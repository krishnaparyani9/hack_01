import { Router } from "express";
import {
  createSessionController,
  validateSessionController,
  getSessionController,
} from "../controllers/session.controller";

const router = Router();

/**
 * Patient creates QR
 */
router.post("/create", createSessionController);

/**
 * Doctor validates QR
 */
router.post("/validate", validateSessionController);

/**
 * Get session info (accessType / patientId)
 */
router.get("/:sessionId", getSessionController);

export default router;
