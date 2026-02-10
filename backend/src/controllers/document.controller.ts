import { Request, Response } from "express";
import type { Document as MongooseDocument } from "mongoose";
import cloudinary from "../config/cloudinary";
import Document from "../models/document.model";
import { getSession } from "../utils/sessionStore";
import { OCRService } from "../utils/ocr.service";
import { LLMService } from "../services/llm.service";

type DocumentEntity = MongooseDocument & {
  patientId: string;
  url: string;
  type?: string;
  summary?: string | null;
  uploadedByName?: string | null;
  uploadedByRole?: string | null;
  createdAt?: Date;
};

class DocumentSummarizationError extends Error {
  constructor(
    public readonly code: "OCR_FAILED" | "LLM_FAILED",
    message: string,
    public readonly documentId?: string,
    cause?: unknown
  ) {
    super(message);
    this.name = "DocumentSummarizationError";
    if (cause !== undefined) {
      (this as any).cause = cause;
    }
  }
}

const summarizeDocumentWithLLM = async (
  doc: DocumentEntity,
  llmService: LLMService
): Promise<string> => {
  let rawText: string;

  try {
    rawText = await OCRService.extractText(doc.url);
    console.log(`Summarization: OCR completed for document ${doc._id}`);
  } catch (error) {
    console.error(`Summarization: OCR failed for document ${doc._id}`, error);
    throw new DocumentSummarizationError(
      "OCR_FAILED",
      "Failed to extract text from document.",
      String(doc._id),
      error
    );
  }

  const cleanedText = OCRService.cleanText(rawText);

  try {
    const summary = await llmService.generateSummary(cleanedText);
    doc.summary = summary;
    await doc.save();
    console.log(`Summarization: Summary stored for document ${doc._id}`);
    return summary;
  } catch (error) {
    console.error(`Summarization: LLM failed for document ${doc._id}`, error);
    throw new DocumentSummarizationError(
      "LLM_FAILED",
      "Failed to generate medical summary",
      String(doc._id),
      error
    );
  }
};

/**
 * Upload document via QR session (doctor upload)
 * Session is ONLY for permission, not ownership
 */
export const uploadDocumentController = (req: Request, res: Response) => {
  const sessionId = req.params.sessionId as string;

  if (!sessionId || !req.file?.buffer) {
    return res.status(400).json({ message: "Invalid request: missing sessionId or file" });
  }

  // Validate session
  const session = getSession(sessionId);
  if (!session || Date.now() >= session.expiresAt) {
    return res.status(401).json({ message: "Session invalid or expired" });
  }

  if (session.accessType !== "write") {
    return res.status(403).json({ message: "Session does not allow uploads" });
  }

  const stream = cloudinary.uploader.upload_stream(
    { resource_type: "auto" },
    async (error, result) => {
      // If Cloudinary fails, fall back to storing the file as a data URL in the DB
      if (error || !result) {
        console.error("Cloudinary upload failed (doctor):", error);
        try {
          const buffer = req.file!.buffer;
          const mime = req.file!.mimetype || "application/octet-stream";
          const dataUrl = `data:${mime};base64,${buffer.toString("base64")}`;

          const auth = (req as any).user as
            | { userId?: string; role?: string; name?: string }
            | undefined;

          const doc = await Document.create({
            patientId: session.patientId,
            url: dataUrl,
            type: (req.body?.type as string) || "Other",
            uploadedByName: auth?.name || req.body?.uploaderName,
            uploadedByRole: auth?.role || "doctor",
          });

          return res.status(201).json({
            message: "Document uploaded (fallback stored in DB)",
            data: {
              id: doc._id,
              url: doc.url,
              type: doc.type,
              uploadedByName: doc.uploadedByName,
              uploadedByRole: doc.uploadedByRole,
              createdAt: doc.createdAt,
            },
          });
        } catch (fallbackErr) {
          console.error("Fallback save failed (doctor):", fallbackErr);
          return res.status(500).json({ message: "Upload failed (cloudinary + fallback)" });
        }
      }

      try {
        const auth = (req as any).user as
          | { userId?: string; role?: string; name?: string }
          | undefined;

        const doc = await Document.create({
          patientId: session.patientId, // ✅ ONLY owner
          url: result.secure_url,
          type: (req.body?.type as string) || "Other",
          uploadedByName: auth?.name || req.body?.uploaderName,
          uploadedByRole: auth?.role || "doctor",
        });

        return res.status(201).json({
          message: "Document uploaded",
          data: {
            id: doc._id,
            url: doc.url,
            type: doc.type,
            uploadedByName: doc.uploadedByName,
            uploadedByRole: doc.uploadedByRole,
            createdAt: doc.createdAt,
          },
        });
      } catch (err) {
        console.error("Document create failed (doctor):", err);
        return res.status(500).json({ message: "Failed to save document" });
      }
    }
  );

  stream.end(req.file.buffer);
};

/**
 * Upload document directly by patient (no QR)
 */
export const uploadDocumentByPatientController = (
  req: Request,
  res: Response
) => {
  const auth = (req as any).user as
    | { userId?: string; role?: string; name?: string }
    | undefined;

  const patientId =
    auth?.role === "patient" && auth.userId
      ? auth.userId
      : (req.body?.patientId as string | undefined);

  // DEBUG: log request info to help diagnose missing uploads
  console.log("Patient upload request:", {
    patientIdFromBody: req.body?.patientId,
    resolvedPatientId: patientId,
    authPresent: !!auth,
    fileOriginalName: req.file?.originalname,
    fileSize: req.file?.size,
  });

  if (!patientId || !req.file?.buffer) {
    // give more context in the response and server log
    console.warn("Invalid upload request - missing patientId or file", {
      patientId,
      filePresent: !!req.file,
    });
    return res.status(400).json({ message: "Invalid request: missing patientId or file" });
  }

  const stream = cloudinary.uploader.upload_stream(
    { resource_type: "auto" },
    async (error, result) => {
      // Cloudinary failed -> fallback to data URL stored in DB
      if (error || !result) {
        console.error("Cloudinary upload failed (patient):", error);
        try {
          const buffer = req.file!.buffer;
          const mime = req.file!.mimetype || "application/octet-stream";
          const dataUrl = `data:${mime};base64,${buffer.toString("base64")}`;

          const doc = await Document.create({
            patientId,
            url: dataUrl,
            type: (req.body?.type as string) || "Other",
            uploadedByName: auth?.name,
            uploadedByRole: "patient",
          });

          return res.status(201).json({
            message: "Document uploaded (fallback stored in DB)",
            data: {
              id: doc._id,
              url: doc.url,
              type: doc.type,
              uploadedByName: doc.uploadedByName,
              uploadedByRole: doc.uploadedByRole,
              createdAt: doc.createdAt,
            },
          });
        } catch (fallbackErr) {
          console.error("Fallback save failed (patient):", fallbackErr);
          return res.status(500).json({ message: "Upload failed (cloudinary + fallback)" });
        }
      }

      try {
        const doc = await Document.create({
          patientId,
          url: result.secure_url,
          type: (req.body?.type as string) || "Other",
          uploadedByName: auth?.name,
          uploadedByRole: "patient",
        });

        return res.status(201).json({
          message: "Document uploaded",
          data: {
            id: doc._id,
            url: doc.url,
            type: doc.type,
            uploadedByName: doc.uploadedByName,
            uploadedByRole: doc.uploadedByRole,
            createdAt: doc.createdAt,
          },
        });
      } catch (err) {
        console.error("Document create failed (patient):", err);
        return res.status(500).json({ message: "Failed to save document" });
      }
    }
  );

  stream.end(req.file.buffer);
};

/**
 * NEW: accept data-url JSON fallback from client
 */
export const uploadDocumentByPatientJsonController = async (req: Request, res: Response) => {
  try {
    const { patientId, type, uploaderName, uploaderRole, dataUrl } = req.body as {
      patientId?: string;
      type?: string;
      uploaderName?: string;
      uploaderRole?: string;
      dataUrl?: string;
    };

    console.log("JSON patient upload request:", { patientId, hasDataUrl: !!dataUrl, uploaderName });

    if (!patientId || !dataUrl) {
      return res.status(400).json({ message: "Missing patientId or dataUrl" });
    }

    // Basic sanity check of data URL
    if (!/^data:[\w/+-]+;base64,/.test(dataUrl)) {
      return res.status(400).json({ message: "Invalid dataUrl" });
    }

    const doc = await Document.create({
      patientId,
      url: dataUrl,
      type: (type as string) || "Other",
      uploadedByName: uploaderName,
      uploadedByRole: uploaderRole || "patient",
    });

    return res.status(201).json({
      message: "Document uploaded (data-url)",
      data: {
        id: doc._id,
        url: doc.url,
        type: doc.type,
        uploadedByName: doc.uploadedByName,
        uploadedByRole: doc.uploadedByRole,
        createdAt: doc.createdAt,
      },
    });
  } catch (err) {
    console.error("uploadDocumentByPatientJsonController error:", err);
    return res.status(500).json({ message: "Failed to save document" });
  }
};

/**
 * Fetch documents via QR session (read access)
 */
export const getDocumentsController = async (
  req: Request,
  res: Response
) => {
  const sessionId = req.params.sessionId as string;

  const session = getSession(sessionId);
  if (!session || Date.now() >= session.expiresAt) {
    return res.status(401).json({ message: "Session invalid or expired" });
  }

  try {
    // If the session explicitly lists sharedDocIds, return only those docs
    const sharedIds = (session as any).sharedDocIds as string[] | undefined;

    let docs;
    if (Array.isArray(sharedIds) && sharedIds.length > 0) {
      docs = await Document.find({ _id: { $in: sharedIds } }).sort({ createdAt: -1 });
    } else {
      // fallback: return all documents for the patient
      docs = await Document.find({
        patientId: session.patientId,
      }).sort({ createdAt: -1 });
    }

    return res.status(200).json({
      message: "Documents fetched",
      data: docs.map((d) => ({
        id: d._id,
        url: d.url,
        type: d.type,
        uploadedByName: d.uploadedByName,
        uploadedByRole: d.uploadedByRole,
        createdAt: d.createdAt,
      })),
    });
  } catch (err) {
    console.error("Failed to fetch documents for session:", err);
    return res.status(500).json({ message: "Failed to fetch documents" });
  }
};

/**
 * Fetch documents directly by patientId (patient dashboard)
 */
export const getDocumentsByPatientController = async (
  req: Request,
  res: Response
) => {
  const patientId = req.params.patientId as string;

  if (!patientId) {
    return res.status(400).json({ message: "Invalid request" });
  }

  const docs = await Document.find({ patientId }).sort({
    createdAt: -1,
  });

  return res.status(200).json({
    message: "Documents fetched",
    data: docs.map((d) => ({
      id: d._id,
      url: d.url,
      type: d.type,
      uploadedByName: d.uploadedByName,
      uploadedByRole: d.uploadedByRole,
      createdAt: d.createdAt,
    })),
  });
};

/**
 * Summarize a document using OCR and LLM (patients and doctors can trigger)
 */
export const summarizeDocumentController = async (req: Request, res: Response) => {
  const id = req.params.id as string;

  console.log(`Summarize request for document ID: ${id}`);

  if (!id) return res.status(400).json({ message: "Invalid request: missing document ID" });

  const auth = (req as any).user as { userId?: string; role?: string } | undefined;
  if (!auth) return res.status(401).json({ message: "Authentication required" });

  try {
    const doc = (await Document.findById(id)) as unknown as DocumentEntity | null;
    if (!doc) {
      console.log("Summarization: Document not found");
      return res.status(404).json({ message: "Document not found" });
    }

    if (auth.role === "patient" && String(doc.patientId) !== String(auth.userId)) {
      console.log("Summarization: Authorization failed for patient");
      return res.status(403).json({ message: "Forbidden: cannot summarize another patient's document" });
    }

    const llmService = new LLMService();
    const summary = await summarizeDocumentWithLLM(doc, llmService);

    return res.status(200).json({
      message: "Document summarized successfully",
      data: {
        id: doc._id,
        summary,
      },
    });
  } catch (err) {
    if (err instanceof DocumentSummarizationError) {
      if (err.code === "OCR_FAILED") {
        return res.status(500).json({ message: "Failed to extract text from document." });
      }
      console.error("Failed to summarize document via LLM:", err);
      return res.status(500).json({ message: "Failed to generate medical summary" });
    }

    console.error("Failed to summarize document:", err);
    return res.status(500).json({ message: "Failed to summarize document" });
  }
};

/**
 * Generate a unified AI summary across all documents for a patient.
 */
export const summarizePatientDocumentsController = async (req: Request, res: Response) => {
  const patientId = req.params.patientId as string;

  if (!patientId) {
    return res.status(400).json({ message: "Invalid request: missing patient ID" });
  }

  const auth = (req as any).user as { userId?: string; role?: string } | undefined;
  if (!auth) {
    return res.status(401).json({ message: "Authentication required" });
  }

  if (auth.role === "patient" && String(auth.userId) !== String(patientId)) {
    return res.status(403).json({ message: "Forbidden: cannot summarize another patient's documents" });
  }

  if (auth.role !== "patient" && auth.role !== "doctor") {
    return res.status(403).json({ message: "Forbidden: insufficient role" });
  }

  const docs = (await Document.find({ patientId }).sort({ createdAt: 1 })) as unknown as DocumentEntity[];

  if (docs.length === 0) {
    return res.status(404).json({ message: "No documents found for patient" });
  }

  const llmService = new LLMService();
  const preparedSummaries: Array<{ title: string; summary: string }> = [];
  const failedDocumentIds: string[] = [];

  for (const doc of docs) {
    const title = doc.type || `Document ${preparedSummaries.length + 1}`;
    let summaryText = (doc.summary || "").trim();

    if (!summaryText) {
      try {
        summaryText = await summarizeDocumentWithLLM(doc, llmService);
      } catch (error) {
        failedDocumentIds.push(String(doc._id));
        if (error instanceof DocumentSummarizationError) {
          console.error(
            `Aggregate summary: failed to summarize document ${doc._id} (${error.code})`,
            error
          );
        } else {
          console.error(`Aggregate summary: unexpected error summarizing document ${doc._id}`, error);
        }
        continue;
      }
    }

    if (summaryText) {
      preparedSummaries.push({ title, summary: summaryText });
    }
  }

  if (preparedSummaries.length === 0) {
    return res.status(500).json({ message: "Failed to summarize patient documents" });
  }

  try {
    const aggregateSummary = await llmService.generateAggregateSummary(preparedSummaries);
    return res.status(200).json({
      message: "Patient documents summarized successfully",
      data: {
        patientId,
        documentCount: docs.length,
        summarizedCount: preparedSummaries.length,
        failedDocumentIds,
        summary: aggregateSummary,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Failed to generate aggregate summary:", error);
    return res.status(500).json({ message: "Failed to generate patient summary" });
  }
};

/**
 * Delete a document (patients can delete their own documents)
 */
export const deleteDocumentController = async (req: Request, res: Response) => {
  const id = req.params.id as string;

  if (!id) return res.status(400).json({ message: "Invalid request" });

  const doc = await Document.findById(id);
  if (!doc) return res.status(404).json({ message: "Document not found" });

  const auth = (req as any).user as { userId?: string; role?: string } | undefined;
  if (!auth) return res.status(401).json({ message: "Authentication required" });

  // Patients may delete documents that belong to them
  if (auth.role === "patient") {
    if (String(doc.patientId) !== String(auth.userId)) {
      return res.status(403).json({ message: "Forbidden: cannot delete another patient's document" });
    }
  } else {
    // Doctors are not permitted to delete documents in this implementation
    return res.status(403).json({ message: "Forbidden: insufficient role" });
  }

  try {
    await Document.deleteOne({ _id: id });
    return res.status(200).json({ message: "Document deleted" });
  } catch (err) {
    console.error("Failed to delete document:", err);
    return res.status(500).json({ message: "Failed to delete document" });
  }
};
