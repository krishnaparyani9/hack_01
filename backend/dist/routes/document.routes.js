"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const document_controller_1 = require("../controllers/document.controller");
const upload_1 = require("../middleware/upload");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Upload directly for patient owner (no QR required) — allow auth info when present
router.post("/upload/by-patient", auth_middleware_1.authMiddleware, upload_1.upload.single("file"), document_controller_1.uploadDocumentByPatientController);
// Upload via QR session — auth info (doctor) may be present and will be used
router.post("/upload/:sessionId", auth_middleware_1.authMiddleware, upload_1.upload.single("file"), // 🔴 MUST BE "file"
document_controller_1.uploadDocumentController);
router.get("/:sessionId", document_controller_1.getDocumentsController);
// New: fetch documents by persistent patientId
router.get("/patient/:patientId", document_controller_1.getDocumentsByPatientController);
// Testing helper: create a mock document without going through Cloudinary
router.post("/mock", auth_middleware_1.authMiddleware, document_controller_1.createMockDocumentController);
exports.default = router;
