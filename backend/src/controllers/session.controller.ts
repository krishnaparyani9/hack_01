import { Request, Response } from "express";
import { verifySessionToken } from "../utils/jwt";
import { createSession, getSession, findActiveSessionByPatient, deleteSession, Session } from "../utils/sessionStore";

/**
 * Create authenticated session (patient signed in)
 * POST /api/session/create
 * body: { accessType, durationMinutes, patientId, sharedDocIds? }
 */
export const createSessionController = async (req: Request, res: Response) => {
  try {
    const { accessType, durationMinutes, patientId, sharedDocIds } = req.body || {};

    // Require a patientId to ensure sessions are always tied to a patient.
    // This prevents documents uploaded during a session from being orphaned.
    if (!accessType || !durationMinutes || !patientId) {
      return res.status(400).json({
        message: "accessType, durationMinutes and patientId are required",
      });
    }

    // Ensure the patient only ever has a single active session; replace any lingering one
    const existing = findActiveSessionByPatient(patientId);
    if (existing) {
      // replace the previous session so patients can regenerate a fresh QR without manual cleanup
      deleteSession(existing.sessionId);
    }

    const session = createSession({
      patientId,
      accessType,
      durationMinutes,
      sharedDocIds,
      anon: false,
    });

    return res.status(201).json({
      message: "Session created",
      data: {
        token: session.token,
        sessionId: session.sessionId,
        expiresAt: session.expiresAt,
        accessType: session.accessType,
        patientId: session.patientId,
        sharedDocIds: session.sharedDocIds || [],
      },
    });
  } catch (err) {
    console.error("createSession error:", err);
    return res.status(500).json({ message: "Failed to create session" });
  }
};

/**
 * Create anonymous session using stored patientId (no auth)
 * POST /api/session/create-anon
 */
export const createAnonSessionController = async (req: Request, res: Response) => {
  try {
    const { accessType, durationMinutes, patientId, sharedDocIds } = req.body || {};
    if (!patientId) return res.status(400).json({ message: "patientId required" });

    const existing = findActiveSessionByPatient(patientId);
    if (existing) {
      deleteSession(existing.sessionId);
    }

    const session = createSession({
      patientId,
      accessType,
      durationMinutes,
      sharedDocIds,
      anon: true,
    });

    return res.status(201).json({
      message: "Session created",
      data: {
        token: session.token,
        sessionId: session.sessionId,
        expiresAt: session.expiresAt,
        accessType: session.accessType,
        patientId: session.patientId,
        sharedDocIds: session.sharedDocIds || [],
      },
    });
  } catch (err) {
    console.error("createAnonSession error:", err);
    return res.status(500).json({ message: "Failed to create session" });
  }
};

/**
 * Validate a token scanned by doctor
 * POST /api/session/validate
 * body: { token }
 */
export const validateSessionController = async (req: Request, res: Response) => {
  try {
    const { token } = req.body || {};
    if (!token) return res.status(400).json({ message: "token required" });

    const session = getSession(token);
    if (!session) return res.status(401).json({ message: "Invalid or expired token" });

    return res.status(200).json({
      message: "Session valid",
      data: {
        sessionId: session.sessionId,
        accessType: session.accessType,
        patientId: session.patientId,
        expiresAt: session.expiresAt,
        sharedDocIds: session.sharedDocIds || [],
      },
    });
  } catch (err) {
    console.error("validateSession error:", err);
    return res.status(500).json({ message: "Failed to validate session" });
  }
};

/**
 * Fetch session by id (GET /api/session/:id)
 */
export const getSessionController = async (req: Request, res: Response) => {
  try {
    const id = req.params.sessionId as string;
    if (!id) return res.status(400).json({ message: "sessionId required" });

    const session = getSession(id);
    if (!session) return res.status(404).json({ message: "Session not found or expired" });

    return res.status(200).json({
      message: "Session fetched",
      data: {
        sessionId: session.sessionId,
        accessType: session.accessType,
        patientId: session.patientId,
        expiresAt: session.expiresAt,
        sharedDocIds: session.sharedDocIds || [],
      },
    });
  } catch (err) {
    console.error("getSession error:", err);
    return res.status(500).json({ message: "Failed to fetch session" });
  }
};

/**
 * Delete session (DELETE /api/session/:sessionId)
 */
export const deleteSessionController = async (req: Request, res: Response) => {
  try {
    const id = req.params.sessionId as string;
    if (!id) return res.status(400).json({ message: "sessionId required" });

    const ok = deleteSession(id);
    if (!ok) return res.status(404).json({ message: "Session not found" });

    return res.status(200).json({ message: "Session deleted" });
  } catch (err) {
    console.error("deleteSession error:", err);
    return res.status(500).json({ message: "Failed to delete session" });
  }
};
