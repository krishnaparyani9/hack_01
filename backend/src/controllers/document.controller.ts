import { Request, Response } from "express";
import cloudinary from "../config/cloudinary";
import { addDocument, getDocuments } from "../utils/documentStore";

export const uploadDocumentController = (
  req: Request,
  res: Response
) => {
  const sessionId = req.params.sessionId as string;

  if (!sessionId) {
    return res.status(400).json({ message: "Session ID required" });
  }

  if (!req.file || !req.file.buffer) {
    return res.status(400).json({ message: "File buffer missing" });
  }

  const stream = cloudinary.uploader.upload_stream(
    { resource_type: "auto" },
    (error, result) => {
      if (error || !result) {
        console.error("Cloudinary error:", error);
        return res.status(500).json({ message: "Upload failed" });
      }

      addDocument(sessionId, result.secure_url);

      return res.status(201).json({
        message: "Document uploaded",
        url: result.secure_url,
      });
    }
  );

  stream.end(req.file.buffer);
};

export const getDocumentsController = (req: Request, res: Response) => {
  const sessionId = req.params.sessionId as string;

  if (!sessionId) {
    return res.status(400).json({ message: "Session ID required" });
  }

  return res.status(200).json({
    message: "Documents fetched",
    data: getDocuments(sessionId),
  });
};
