import { Router } from "express";
import {
  createSessionController,
  validateSessionController,
  getSessionController,
  deleteSessionController,
  createAnonSessionController, // corrected name
} from "../controllers/session.controller";
import { authMiddleware, requireRole } from "../middleware/auth.middleware";

const router = Router();

/**
 * Patient creates QR
 */
router.post("/create", authMiddleware, requireRole("patient"), createSessionController);

// Create a session using a stored patientId (no auth required).
// Used by patient UI flows when the app has a persistent `patientId` but no active auth token.
router.post("/create-anon", createAnonSessionController);

/**
 * Doctor validates QR
 */
router.post("/validate", authMiddleware, requireRole("doctor"), validateSessionController);

/**
 * Get session info (public - frontend expects to be able to read)
 */
router.get("/:sessionId", getSessionController);

/**
 * End session (requires auth)
 */
router.delete("/:sessionId", authMiddleware, deleteSessionController);

export default router;
