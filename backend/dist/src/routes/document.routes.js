"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const document_controller_1 = require("../controllers/document.controller");
const upload_1 = require("../middleware/upload");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
/**
 * Upload document directly by patient (no QR)
 */
router.post("/upload/by-patient", auth_middleware_1.authMiddleware, upload_1.upload.single("file"), document_controller_1.uploadDocumentByPatientController);
/**
 * Fetch documents by patientId (⚠️ MUST COME BEFORE :sessionId)
 */
router.get("/patient/:patientId", auth_middleware_1.authMiddleware, document_controller_1.getDocumentsByPatientController);
/**
 * Upload document via QR session (doctor)
 */
router.post("/upload/:sessionId", auth_middleware_1.authMiddleware, upload_1.upload.single("file"), document_controller_1.uploadDocumentController);
/**
 * Fetch documents via QR session
 */
router.get("/:sessionId", document_controller_1.getDocumentsController);
// Delete a document (patient only)
router.delete('/:id', auth_middleware_1.authMiddleware, auth_middleware_1.requireAuth, document_controller_1.deleteDocumentController);
exports.default = router;
