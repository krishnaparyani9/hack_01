import { Router } from "express";
import {
  uploadDocumentController,
  uploadDocumentByPatientController,
  getDocumentsController,
  getDocumentsByPatientController,
  deleteDocumentController,
  uploadDocumentByPatientJsonController, // <-- new
  summarizeDocumentController,
  summarizePatientDocumentsController,
} from "../controllers/document.controller";
import { upload } from "../middleware/upload";
import { authMiddleware, requireAuth } from "../middleware/auth.middleware";

const router = Router();

/**
 * Upload document directly by patient (no QR)
 * NOTE: no authMiddleware so patient UI uploads using patientId
 */
router.post(
  "/upload/by-patient",
  // authMiddleware,   // intentionally not required for patient-side upload using patientId
  upload.single("file"),
  uploadDocumentByPatientController
);

/**
 * Fetch documents by patientId (must come before :sessionId)
 * NOTE: public so patient UI can fetch by patientId
 */
router.get(
  "/patient/:patientId",
  // authMiddleware,  // intentionally not required
  getDocumentsByPatientController
);

router.post(
  "/patient/:patientId/summary",
  authMiddleware,
  requireAuth,
  summarizePatientDocumentsController
);

/**
 * Upload document via QR session (doctor) - requires auth
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

/**
 * Fallback JSON upload endpoint for clients that can't send multipart/form-data
 * (public so patient UI can provide persisted patientId)
 */
router.post(
  "/upload/by-patient-json",
  // no auth
  uploadDocumentByPatientJsonController
);

// Summarize a document (patients and doctors)
router.post('/:id/summarize', authMiddleware, requireAuth, summarizeDocumentController);

// Delete a document (patient only)
router.delete('/:id', authMiddleware, requireAuth, deleteDocumentController);

export default router;
