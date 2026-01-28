import { Request, Response } from "express";
import { createSession } from "../services/session.service";
import { verifySessionToken } from "../utils/jwt";

export const createSessionController = (req: Request, res: Response) => {
  const { accessType, durationMinutes, patientId } = req.body;

  if (!accessType || !durationMinutes) {
    return res.status(400).json({
      message: "accessType and durationMinutes are required",
    });
  }

  const session = createSession({
    accessType,
    durationMinutes,
    patientId,
  });

  return res.status(201).json({
    message: "QR session created",
    data: session,
  });
};

export const validateSessionController = (req: Request, res: Response) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({
      message: "QR token is required",
    });
  }

  try {
    const decoded = verifySessionToken(token);

    return res.status(200).json({
      message: "Session valid",
      data: {
        sessionId: decoded.sessionId,
        accessType: decoded.accessType,
        patientId: decoded.patientId,
      },
    });
  } catch {
    return res.status(401).json({
      message: "Invalid or expired session",
    });
  }
};

// New: fetch session info (authoritative source of accessType & patientId)
import { getSession } from "../utils/sessionStore";

export const getSessionController = (req: Request, res: Response) => {
  const sessionId = req.params.sessionId as string;

  if (!sessionId) {
    return res.status(400).json({ message: "sessionId is required" });
  }

  const session = getSession(sessionId);
  if (!session || Date.now() >= session.expiresAt) {
    return res.status(404).json({ message: "Session not found or expired" });
  }

  return res.status(200).json({
    message: "Session fetched",
    data: {
      sessionId: session.sessionId,
      accessType: session.accessType,
      patientId: session.patientId,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
      durationMinutes: session.durationMinutes,
    },
  });
};
