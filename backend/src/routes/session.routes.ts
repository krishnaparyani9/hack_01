import { Router } from "express";
import {
  createSessionController,
  validateSessionController,
  getSessionController,
} from "../controllers/session.controller";
import { authMiddleware, requireRole } from "../middleware/auth.middleware";

const router = Router();

/**
 * Patient creates QR
 */
router.post("/create", createSessionController);

/**
 * Doctor validates QR (doctors only)
 */
router.post("/validate", authMiddleware, requireRole("doctor"), validateSessionController);

/**
 * Get session info (accessType / patientId)
 */
router.get("/:sessionId", getSessionController);

export default router;
