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
router.post("/create", authMiddleware, requireRole("patient"), createSessionController);

/**
 * Doctor validates QR
 */
router.post("/validate", authMiddleware, requireRole("doctor"), validateSessionController);

/**
 * Get session info (doctor / patient)
 */
router.get("/:sessionId", authMiddleware, getSessionController);

export default router;
