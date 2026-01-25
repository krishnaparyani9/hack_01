import { Request, Response } from "express";
import { createSession } from "../services/session.service";
import { verifySessionToken } from "../utils/jwt";

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
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired session",
    });
  }
};
