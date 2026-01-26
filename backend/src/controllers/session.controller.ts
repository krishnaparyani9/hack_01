import { Request, Response } from "express";
import { createSession } from "../services/session.service";
import { verifySessionToken } from "../utils/jwt";
import { sessions } from "../utils/sessionStore";

/**
 * Create QR session (Patient)
 */
export const createSessionController = (req: Request, res: Response) => {
  const { accessType, durationMinutes } = req.body;

  if (!accessType || !durationMinutes) {
    return res.status(400).json({
      message: "accessType and durationMinutes are required",
    });
  }

  const session = createSession({
    accessType,
    durationMinutes,
  });

  return res.status(201).json({
    message: "QR session created",
    data: session,
  });
};

/**
 * Doctor validates QR token
 */
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
      },
    });
  } catch {
    return res.status(401).json({
      message: "Invalid or expired session",
    });
  }
};

/**
 * Get active session details (Doctor Session Page)
 */
export const getSessionDetailsController = (
  req: Request,
  res: Response
) => {
  // ✅ FIX: Explicit cast to string
  const sessionId = req.params.sessionId as string;

  const session = sessions.get(sessionId);

  if (!session) {
    return res.status(404).json({
      message: "Session not found",
    });
  }

  // Expiry check
  if (new Date(session.expiresAt).getTime() < Date.now()) {
    sessions.delete(sessionId);
    return res.status(410).json({
      message: "Session expired",
    });
  }

  return res.status(200).json({
    message: "Session active",
    data: {
      sessionId: session.sessionId,
      accessType: session.accessType,
      expiresAt: session.expiresAt,
    },
  });
};
