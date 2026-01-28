import { Router } from "express";
import {
  uploadDocumentController,
  uploadDocumentByPatientController,
  createMockDocumentController,
  getDocumentsController,
  getDocumentsByPatientController,
} from "../controllers/document.controller";
import { upload } from "../middleware/upload";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

// Upload directly for patient owner (no QR required) — allow auth info when present
router.post(
  "/upload/by-patient",
  authMiddleware,
  upload.single("file"),
  uploadDocumentByPatientController
);

// Upload via QR session — auth info (doctor) may be present and will be used
router.post(
  "/upload/:sessionId",
  authMiddleware,
  upload.single("file"), // 🔴 MUST BE "file"
  uploadDocumentController
);

router.get("/:sessionId", getDocumentsController);
// New: fetch documents by persistent patientId
router.get("/patient/:patientId", getDocumentsByPatientController);

// Testing helper: create a mock document without going through Cloudinary
router.post("/mock", authMiddleware, createMockDocumentController);

export default router;
