import { Router } from "express";
import {
  uploadDocumentController,
  uploadDocumentByPatientController,
  getDocumentsController,
  getDocumentsByPatientController,
  deleteDocumentController
} from "../controllers/document.controller";
import { upload } from "../middleware/upload";
import { authMiddleware, requireAuth } from "../middleware/auth.middleware";

const router = Router();

/**
 * Upload document directly by patient (no QR)
 */
router.post(
  "/upload/by-patient",
  authMiddleware,
  upload.single("file"),
  uploadDocumentByPatientController
);

/**
 * Fetch documents by patientId (⚠️ MUST COME BEFORE :sessionId)
 */
router.get(
  "/patient/:patientId",
  authMiddleware,
  getDocumentsByPatientController
);

/**
 * Upload document via QR session (doctor)
 */
router.post(
  "/upload/:sessionId",
  authMiddleware,
  upload.single("file"),
  uploadDocumentController
);

/**
 * Fetch documents via QR session
 */
router.get("/:sessionId", getDocumentsController);
// Delete a document (patient only)
router.delete('/:id', authMiddleware, requireAuth, deleteDocumentController);
export default router;
