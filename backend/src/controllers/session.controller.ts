import { Request, Response } from "express";
import { createSession } from "../services/session.service";
import { verifySessionToken } from "../utils/jwt";
import { findActiveSessionByPatientId } from "../utils/sessionStore";

export const createSessionController = (req: Request, res: Response) => {
  const { accessType, durationMinutes, patientId } = req.body;

  // Require a patientId to ensure sessions are always tied to a patient.
  // This prevents documents uploaded during a session from being orphaned.
  if (!accessType || !durationMinutes || !patientId) {
    return res.status(400).json({
      message: "accessType, durationMinutes and patientId are required",
    });
  }

  // Prevent creating a new session when the patient already has an active one
  const existing = findActiveSessionByPatientId(patientId);
  if (existing) {
    return res.status(409).json({ message: "Active session already exists" });
  }

  const session = createSession({ accessType, durationMinutes, patientId });

  return res.status(201).json({
    message: "QR session created",
    data: session,
  });
};

// Allow creating a session using a persisted `patientId` without authentication.
// This is used by the patient UI when the app stores a persistent patientId
// locally and the user is not actively signed in (keeps UX smooth after
// ending a session). The request must include `patientId` in the body.
export const createSessionAnonController = (req: Request, res: Response) => {
  const { accessType, durationMinutes, patientId } = req.body;

  if (!accessType || !durationMinutes || !patientId) {
    return res.status(400).json({ message: "accessType, durationMinutes and patientId are required" });
  }

  console.log(`[session.controller] create-anon request patient=${patientId} access=${accessType} duration=${durationMinutes}`);
  const existing = findActiveSessionByPatientId(patientId);
  if (existing) {
    console.log(`[session.controller] create-anon conflict existing=${existing.sessionId}`);
    return res.status(409).json({ message: "Active session already exists" });
  }

  const session = createSession({ accessType, durationMinutes, patientId });
  console.log(`[session.controller] create-anon created session=${session.sessionId}`);

  return res.status(201).json({ message: "QR session created (anon)", data: session });
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

    // Ensure server-side session still exists and hasn't been invalidated.
    const session = getSession(decoded.sessionId);
    if (!session || Date.now() >= session.expiresAt) {
      return res.status(404).json({ message: "Session not found or expired" });
    }

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

// End / invalidate a session (patient or doctor)
import { deleteSession } from "../utils/sessionStore";
import { requireAuth } from "../middleware/auth.middleware";

export const endSessionController = (req: Request, res: Response) => {
  const sessionId = req.params.sessionId as string;
  if (!sessionId) return res.status(400).json({ message: "sessionId is required" });

  const session = getSession(sessionId);
  if (!session) return res.status(404).json({ message: "Session not found" });

  console.log(`[session.controller] endSession request session=${sessionId} patient=${session.patientId}`);

  // If authenticated as patient, ensure they own the session
  const user = (req as any).user;
  if (user && user.role === "patient") {
    if (user.userId !== session.patientId) return res.status(403).json({ message: "Forbidden" });
  }

  deleteSession(sessionId);

  return res.status(200).json({ message: "Session ended" });
};
