import { Router } from "express";
import {
  createSessionController,
  validateSessionController,
  getSessionController,
  endSessionController,
  createSessionAnonController,
} from "../controllers/session.controller";
import { authMiddleware, requireRole } from "../middleware/auth.middleware";

const router = Router();

/**
 * Patient creates QR
 */
router.post("/create", authMiddleware, requireRole("patient"), createSessionController);

// Create a session using a stored patientId (no auth required). Used by patient
// UI flows when the app has a persistent `patientId` but no active auth token.
router.post("/create-anon", createSessionAnonController);

/**
 * Doctor validates QR
 */
router.post("/validate", authMiddleware, requireRole("doctor"), validateSessionController);

/**
 * Get session info (doctor / patient)
 */
router.get("/:sessionId", authMiddleware, getSessionController);

/**
 * End session (patient/doctor)
 */
router.delete("/:sessionId", authMiddleware, endSessionController);

export default router;
