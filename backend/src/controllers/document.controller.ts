import { Request, Response } from "express";
import cloudinary from "../config/cloudinary";
import Document from "../models/document.model";
import { getSession } from "../utils/sessionStore";
import { OCRService } from "../utils/ocr.service";
import { LLMService } from "../services/llm.service";

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
    console.log('Step 1: Fetching document from DB');
    const doc = await Document.findById(id);
    if (!doc) {
      console.log('Step 1: Document not found');
      return res.status(404).json({ message: "Document not found" });
    }
    console.log('Step 1: Document fetched successfully');

    // Authorization: Patients can summarize their own docs; doctors can summarize any (for sessions)
    if (auth.role === "patient" && String(doc.patientId) !== String(auth.userId)) {
      console.log('Step 1: Authorization failed');
      return res.status(403).json({ message: "Forbidden: cannot summarize another patient's document" });
    }
    console.log('Step 1: Authorization passed');

    // Step 2: Extract text using OCR
    console.log('Step 2: Starting OCR extraction');
    let rawText: string;
    let cleanedText: string;
    try {
      rawText = await OCRService.extractText(doc.url);
      console.log(`Step 2: OCR completed, raw text length: ${rawText.length}`);
      cleanedText = OCRService.cleanText(rawText);
      console.log(`Step 2: Text cleaned, cleaned text length: ${cleanedText.length}`);
    } catch (error) {
      console.error('Step 2: OCR extraction failed:', error);
      return res.status(500).json({ message: 'Failed to extract text from document.' });
    }

    // Step 3: Generate summary using LLM
    console.log('Step 3: Starting LLM summarization');
    const llmService = new LLMService();
    const summary = await llmService.generateSummary(cleanedText);
    console.log('Step 3: LLM summarization completed');

    // Step 4: Update document with summary
    console.log('Step 4: Updating document with summary');
    doc.summary = summary;
    await doc.save();
    console.log('Step 4: Document updated successfully');

    return res.status(200).json({
      message: "Document summarized successfully",
      data: {
        id: doc._id,
        summary: doc.summary,
      },
    });
  } catch (err) {
    console.error("Failed to summarize document:", err);
    return res.status(500).json({ message: "Failed to summarize document" });
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
