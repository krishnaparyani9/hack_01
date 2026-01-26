import { Router } from "express";
import {
  createSessionController,
  validateSessionController,
  getSessionDetailsController, // ✅ ADD
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
 * Doctor fetches active session details
 * (after QR scan + redirect)
 */
router.get("/:sessionId", getSessionDetailsController); // ✅ ADD

export default router;
