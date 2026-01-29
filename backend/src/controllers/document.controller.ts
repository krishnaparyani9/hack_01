import { Request, Response } from "express";
import cloudinary from "../config/cloudinary";
import Document from "../models/document.model";
import { getSession } from "../utils/sessionStore";

/**
 * Upload document via QR session (doctor upload)
 * Session is ONLY for permission, not ownership
 */
export const uploadDocumentController = (req: Request, res: Response) => {
  const sessionId = req.params.sessionId as string;

  if (!sessionId || !req.file?.buffer) {
    return res.status(400).json({ message: "Invalid request" });
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
      if (error || !result) {
        console.error("Cloudinary upload failed:", error);
        return res.status(500).json({ message: "Upload failed" });
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
        console.error("Document create failed:", err);
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

  if (!patientId || !req.file?.buffer) {
    return res.status(400).json({ message: "Invalid request" });
  }

  const stream = cloudinary.uploader.upload_stream(
    { resource_type: "auto" },
    async (error, result) => {
      if (error || !result) {
        console.error("Cloudinary upload failed:", error);
        return res.status(500).json({ message: "Upload failed" });
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
        console.error("Document create failed:", err);
        return res.status(500).json({ message: "Failed to save document" });
      }
    }
  );

  stream.end(req.file.buffer);
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

  const docs = await Document.find({
    patientId: session.patientId,
  }).sort({ createdAt: -1 });

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
