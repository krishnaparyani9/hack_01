import { Router } from "express";
import {
  createSessionController,
  validateSessionController,
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

export default router;
