import { Request, Response } from "express";
import axios from "axios";
import cloudinary from "../config/cloudinary";
import type { Document as MongooseDocument } from "mongoose";
import Document from "../models/document.model";
import { getSession } from "../utils/sessionStore";
import { OCRService } from "../utils/ocr.service";
import { LLMService } from "../services/llm.service";

type DocumentEntity = MongooseDocument & {
  patientId: string;
  url: string;
  type?: string;
  summary?: string | null;
  labResults?: LabResults | null;
  uploadedByName?: string | null;
  uploadedByRole?: string | null;
  createdAt?: Date;
};

type LabValue = {
  value: number;
  unit?: string;
};

type LabResults = {
  hemoglobin?: LabValue;
  wbc?: LabValue;
  platelets?: LabValue;
  glucose?: LabValue;
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

const extractLabValue = (text: string, pattern: RegExp): LabValue | undefined => {
  const match = text.match(pattern);
  if (!match) return undefined;
  const rawValue = match[1];
  const unit = match[2];
  const value = Number(rawValue);
  if (!Number.isFinite(value)) return undefined;
  return { value, unit };
};

/**
 * Parse the report's own date from raw OCR text.
 * Tries common medical formats; returns null when nothing plausible is found.
 */
const extractReportDate = (text: string): Date | null => {
  const monthMap: Record<string, number> = {
    jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2,
    apr: 3, april: 3, may: 4, jun: 5, june: 5, jul: 6, july: 6,
    aug: 7, august: 7, sep: 8, september: 8, oct: 9, october: 9,
    nov: 10, november: 10, dec: 11, december: 11,
  };

  const tryDate = (y: number, m: number, d: number): Date | null => {
    if (y < 1990 || y > 2100) return null;
    if (m < 0 || m > 11) return null;
    if (d < 1 || d > 31) return null;
    const dt = new Date(y, m, d);
    return isNaN(dt.getTime()) ? null : dt;
  };

  const patterns: { re: RegExp; parse: (m: RegExpMatchArray) => Date | null }[] = [
    // ISO: 2025-11-03
    {
      re: /\b(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})\b/,
      parse: (m) => tryDate(+m[1], +m[2] - 1, +m[3]),
    },
    // DD/MM/YYYY or DD-MM-YYYY
    {
      re: /\b(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})\b/,
      parse: (m) => {
        const day = +m[1], mon = +m[2], yr = +m[3];
        // day > 12 means it can't be month — safe to treat as DD/MM
        // otherwise ambiguous, assume DD/MM (medical convention)
        if (mon > 12) return tryDate(yr, day - 1, mon); // swapped
        return tryDate(yr, mon - 1, day);
      },
    },
    // 15 Jan 2025 or 15 January 2025
    {
      re: /\b(\d{1,2})\s+(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(\d{4})\b/i,
      parse: (m) => {
        const mon = monthMap[m[2].toLowerCase().substring(0, 3)];
        return mon !== undefined ? tryDate(+m[3], mon, +m[1]) : null;
      },
    },
    // Jan 15, 2025 or January 15, 2025
    {
      re: /\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(\d{1,2})[,\s]+(\d{4})\b/i,
      parse: (m) => {
        const mon = monthMap[m[1].toLowerCase().substring(0, 3)];
        return mon !== undefined ? tryDate(+m[3], mon, +m[2]) : null;
      },
    },
    // Mar 2025 (no day — use 1st)
    {
      re: /\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(\d{4})\b/i,
      parse: (m) => {
        const mon = monthMap[m[1].toLowerCase().substring(0, 3)];
        return mon !== undefined ? tryDate(+m[2], mon, 1) : null;
      },
    },
  ];

  for (const { re, parse } of patterns) {
    // Use global search to try all occurrences, pick first valid one
    const globalRe = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
    let match: RegExpExecArray | null;
    while ((match = globalRe.exec(text)) !== null) {
      const dt = parse(match);
      if (dt) return dt;
    }
  }
  return null;
};

const extractLabResults = (text: string): LabResults | null => {
  const hemoglobin = extractLabValue(text, /(?:hemoglobin|haemoglobin|hgb|hb)\s*[:\-]?\s*([0-9]+(?:\.[0-9]+)?)\s*([a-zA-Z/%]+)?/i);
  const wbc = extractLabValue(text, /(?:wbc|white blood cell(?:s)?|leukocytes?)\s*[:\-]?\s*([0-9]+(?:\.[0-9]+)?)\s*([a-zA-Z/%]+)?/i);
  const platelets = extractLabValue(text, /(?:platelets?|plt)\s*[:\-]?\s*([0-9]+(?:\.[0-9]+)?)\s*([a-zA-Z/%]+)?/i);
  const glucose = extractLabValue(text, /(?:glucose|blood sugar|fbs|rbs)\s*[:\-]?\s*([0-9]+(?:\.[0-9]+)?)\s*([a-zA-Z/%]+)?/i);

  const results: LabResults = {};
  if (hemoglobin) results.hemoglobin = hemoglobin;
  if (wbc) results.wbc = wbc;
  if (platelets) results.platelets = platelets;
  if (glucose) results.glucose = glucose;

  return Object.keys(results).length > 0 ? results : null;
};

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
  if (cleanedText.length < 20) {
    doc.summary = "No extractable text found in the document.";
    await doc.save();
    console.log(`Summarization: No text found for document ${doc._id}`);
    return doc.summary;
  }
  const labResults = extractLabResults(cleanedText);
  const reportDate = extractReportDate(rawText); // use raw OCR text for date extraction
  if (labResults || reportDate) {
    if (labResults) doc.labResults = labResults;
    if (reportDate) (doc as any).reportDate = reportDate;
    await doc.save();
    console.log(`Summarization: metrics stored for document ${doc._id} – date=${reportDate?.toISOString() ?? 'none'}`);
  }

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
        labResults: d.labResults || null,
        reportDate: (d as any).reportDate || null,
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

  // Lazy backfill: for documents that have a summary but no reportDate stored,
  // extract the date from the summary text now and persist it in the background.
  const backfillPromises: Promise<void>[] = [];
  for (const d of docs) {
    if (!(d as any).reportDate && d.summary) {
      const extracted = extractReportDate(d.summary);
      if (extracted) {
        (d as any).reportDate = extracted;
        backfillPromises.push(
          Document.updateOne({ _id: d._id }, { $set: { reportDate: extracted } })
            .then(() => console.log(`Backfilled reportDate for doc ${d._id}: ${extracted.toISOString()}`))
            .catch((e: unknown) => console.warn(`Backfill failed for doc ${d._id}:`, e))
        );
      }
    }
  }
  // Fire-and-forget — don't block the response
  Promise.all(backfillPromises).catch(() => {});

  return res.status(200).json({
    message: "Documents fetched",
    data: docs.map((d) => ({
      id: d._id,
      url: d.url,
      type: d.type,
      summary: d.summary || null,
      uploadedByName: d.uploadedByName,
      uploadedByRole: d.uploadedByRole,
      labResults: d.labResults || null,
      reportDate: (d as any).reportDate || null,
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
        labResults: doc.labResults || null,
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

  const BAD_SUMMARIES = [
    "no extractable text found",
    "no significant findings",
    "no meaningful findings",
    "no information available",
  ];

  const isBadSummary = (s: string) => {
    const lower = s.toLowerCase();
    return BAD_SUMMARIES.some((b) => lower.includes(b));
  };

  for (const doc of docs) {
    const title = doc.type || `Document ${preparedSummaries.length + 1}`;
    let summaryText = (doc.summary || "").trim();

    // Re-run OCR+LLM if summary is empty or was a known failure placeholder
    if (!summaryText || isBadSummary(summaryText)) {
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
 * Proxy document fetch to avoid PDF iframe/CORS issues.
 */
export const proxyDocumentController = async (req: Request, res: Response) => {
  try {
    const rawUrl = String(req.query.url || "").trim();
    if (!rawUrl || !/^https?:\/\//i.test(rawUrl)) {
      return res.status(400).json({ message: "Invalid document URL" });
    }

    let target: URL;
    try {
      target = new URL(rawUrl);
    } catch {
      return res.status(400).json({ message: "Invalid document URL" });
    }

    if (target.host !== "res.cloudinary.com") {
      return res.status(403).json({ message: "Document host not allowed" });
    }

    // Parse: https://res.cloudinary.com/{cloud}/{resType}/{type}/v{ver}/{publicId}.{fmt}
    const m = rawUrl.match(
      /res\.cloudinary\.com\/([^/]+)\/([^/]+)\/([^/]+)\/v(\d+)\/(.+?)\.(\w+)(?:[?#].*)?$/i
    );

    const doStream = (r: { status: number; headers: Record<string, any>; data: NodeJS.ReadableStream }) => {
      const ct = (r.headers["content-type"] as string) || "application/octet-stream";
      res.status(r.status);
      res.setHeader("Content-Type", ct.toLowerCase().includes("pdf") ? "application/pdf" : ct);
      res.setHeader("Content-Disposition", "inline");
      res.setHeader("Cache-Control", "public, max-age=3600");
      if (r.headers["content-length"]) res.setHeader("Content-Length", r.headers["content-length"]);
      r.data.pipe(res);
    };

    const fetchUrl = (url: string) =>
      axios.get(url, {
        responseType: "stream",
        headers: req.headers.range ? { Range: req.headers.range } : {},
        validateStatus: () => true,
        timeout: 20000,
      });

    // ── Strategy 1: Cloudinary private_download_url (uses API key+secret) ──────
    // This generates: https://api.cloudinary.com/v1_1/{cloud}/{resType}/download?...
    // It's the only approach that works when a Cloudinary account has strict signing.
    if (m) {
      const [, cloud, resType, , , publicId, format] = m;
      const resourceTypes = resType === "raw" ? ["raw", "image"] : ["image", "raw"];

      console.log(`Proxy: cloud=${cloud} resType=${resType} publicId=${publicId} fmt=${format}`);

      for (const rt of resourceTypes) {
        try {
          const dlUrl = (cloudinary.utils as any).private_download_url(publicId, format, {
            cloud_name: cloud,
            resource_type: rt,
            type: "upload",
            api_key: cloudinary.config().api_key,
            api_secret: cloudinary.config().api_secret,
          });
          console.log(`Proxy: trying private_download (${rt}): ${dlUrl.substring(0, 100)}`);
          const r = await fetchUrl(dlUrl);
          if (r.status >= 200 && r.status < 400) return doStream(r);
          console.warn(`Proxy: private_download (${rt}) returned ${r.status}`);
        } catch (e) {
          console.warn(`Proxy: private_download (${rt}) threw`, e);
        }
      }
    }

    // ── Strategy 2: Direct URL (works on accounts without strict signing) ───────
    {
      const r = await fetchUrl(rawUrl);
      if (r.status >= 200 && r.status < 400) return doStream(r);
      console.warn(`Proxy: direct URL returned ${r.status}`);
    }

    return res.status(502).json({ message: "Could not retrieve document from storage" });
  } catch (error) {
    console.error("Proxy document error:", error);
    return res.status(502).json({ message: "Failed to fetch document" });
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
