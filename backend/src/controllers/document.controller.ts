import { Request, Response } from "express";
import cloudinary from "../config/cloudinary";
import Document from "../models/document.model";

export const uploadDocumentController = (
  req: Request,
  res: Response
) => {
  const sessionId = req.params.sessionId as string;

  if (!sessionId || !req.file?.buffer) {
    return res.status(400).json({ message: "Invalid request" });
  }

  const stream = cloudinary.uploader.upload_stream(
    { resource_type: "auto" },
    async (error, result) => {
      if (error || !result) {
        return res.status(500).json({ message: "Upload failed" });
      }

      await Document.create({
        sessionId,
        url: result.secure_url,
      });

      return res.status(201).json({
        message: "Document uploaded",
        url: result.secure_url,
      });
    }
  );

  stream.end(req.file.buffer);
};

export const getDocumentsController = async (
  req: Request,
  res: Response
) => {
  const sessionId = req.params.sessionId as string;

  const docs = await Document.find({ sessionId }).sort({
    createdAt: -1,
  });

  return res.status(200).json({
    message: "Documents fetched",
    data: docs.map((d) => d.url),
  });
};
