import { Request, Response } from "express";
import cloudinary from "../config/cloudinary";
import Document from "../models/document.model";
import { getSession } from "../utils/sessionStore";

export const uploadDocumentController = (
  req: Request,
  res: Response
) => {
  const sessionId = req.params.sessionId as string;

  if (!sessionId || !req.file?.buffer) {
    return res.status(400).json({ message: "Invalid request" });
  }

  // validate session exists and is not expired
  const session = getSession(sessionId);
  if (!session || Date.now() >= session.expiresAt) {
    return res.status(400).json({ message: "Session invalid or expired" });
  }

  // only allow uploads via session when accessType is "write"
  if (session.accessType !== "write") {
    return res.status(403).json({ message: "Session does not allow uploads" });
  }

  const stream = cloudinary.uploader.upload_stream(
    { resource_type: "auto" },
    async (error, result) => {
      if (error || !result) {
        return res.status(500).json({ message: "Upload failed" });
      }

      // Attach patientId from session (if present)
      const patientId = session?.patientId;

          // Prefer authenticated user info when present
      const auth = (req as any).user as { userId?: string; role?: string; name?: string } | undefined;
      const uploaderName = auth?.name || (req.body?.uploaderName as string) || undefined;
      const uploaderRole = auth?.role || "doctor";

      const doc = await Document.create({
        sessionId,
        patientId,
        url: result.secure_url,
        type: (req.body?.type as string) || "Other",
        uploadedByName: uploaderName,
        uploadedByRole: uploaderRole,
      });

      return res.status(201).json({
        message: "Document uploaded",
        url: result.secure_url,
        data: { id: doc._id, url: doc.url, type: doc.type, uploadedByName: doc.uploadedByName, uploadedByRole: doc.uploadedByRole, createdAt: doc.createdAt },
      });
    }
  );

  stream.end(req.file.buffer);
};

// New: upload documents directly for a patient (no QR required)
export const uploadDocumentByPatientController = (
  req: Request,
  res: Response
) => {
  const patientId = req.body?.patientId as string | undefined;

  if (!patientId || !req.file?.buffer) {
    return res.status(400).json({ message: "Invalid request" });
  }

  console.log(`Patient upload request received for patientId=${patientId}`);

  const stream = cloudinary.uploader.upload_stream(
    { resource_type: "auto" },
    async (error, result) => {
      if (error || !result) {
        console.error("Cloudinary upload error:", error);
        return res.status(500).json({ message: "Upload failed" });
      }

      const uploaderName = (req.body?.uploaderName as string) || undefined;
      const doc = await Document.create({
        // patient-owned upload — no sessionId
        patientId,
        url: result.secure_url,
        type: (req.body?.type as string) || "Other",
        uploadedByName: uploaderName,
        uploadedByRole: "patient",
      });

      console.log(`Document saved for patientId=${patientId}, docId=${doc._id}`);

      return res.status(201).json({
        message: "Document uploaded",
        url: result.secure_url,
        data: { id: doc._id, url: doc.url, type: doc.type, uploadedByName: doc.uploadedByName, uploadedByRole: doc.uploadedByRole, createdAt: doc.createdAt },
      });
    }
  );

  stream.end(req.file.buffer);
};

// New: create a document record directly (useful for quick testing without Cloudinary)
export const createMockDocumentController = async (req: Request, res: Response) => {
  const { patientId, url } = req.body as { patientId?: string; url?: string };

  if (!patientId || !url) {
    return res.status(400).json({ message: "patientId and url are required" });
  }

  const uploaderName = (req.body?.uploaderName as string) || undefined;
  const uploaderRole = (req.body?.uploaderRole as string) || "patient";
  const doc = await Document.create({ patientId, url, type: (req.body?.type as string) || "Other", uploadedByName: uploaderName, uploadedByRole: uploaderRole });

  console.log(`Mock document created for patientId=${patientId}, docId=${doc._id}`);

  return res.status(201).json({ message: "Mock document created", data: { id: doc._id, url: doc.url, type: doc.type, uploadedByName: doc.uploadedByName, uploadedByRole: doc.uploadedByRole, createdAt: doc.createdAt } });
};

export const getDocumentsController = async (
  req: Request,
  res: Response
) => {
  const sessionId = req.params.sessionId as string;

  // Prefer looking up the session's patientId (if present) so documents persist across sessions
  const session = getSession(sessionId);
  let docs;

  if (session?.patientId) {
    docs = await Document.find({ patientId: session.patientId }).sort({
      createdAt: -1,
    });
  } else {
    // Fallback for older documents stored by sessionId
    docs = await Document.find({ sessionId }).sort({
      createdAt: -1,
    });
  }

  return res.status(200).json({
    message: "Documents fetched",
    data: docs.map((d) => ({ id: d._id, url: d.url, type: (d.type as string) || "Other", uploadedByName: d.uploadedByName, uploadedByRole: d.uploadedByRole, createdAt: d.createdAt })),
  });
};

// New: fetch documents directly by patientId (used on patient pages)
export const getDocumentsByPatientController = async (
  req: Request,
  res: Response
) => {
  const patientId = req.params.patientId as string;

  if (!patientId) {
    return res.status(400).json({ message: "Invalid request" });
  }

  const docs = await Document.find({ patientId }).sort({ createdAt: -1 });

  return res.status(200).json({ message: "Documents fetched", data: docs.map((d) => ({ id: d._id, url: d.url, type: (d.type as string) || "Other", uploadedByName: d.uploadedByName, uploadedByRole: d.uploadedByRole, createdAt: d.createdAt })) });
};
