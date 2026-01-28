"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDocumentsByPatientController = exports.getDocumentsController = exports.createMockDocumentController = exports.uploadDocumentByPatientController = exports.uploadDocumentController = void 0;
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
const document_model_1 = __importDefault(require("../models/document.model"));
const sessionStore_1 = require("../utils/sessionStore");
const uploadDocumentController = (req, res) => {
    const sessionId = req.params.sessionId;
    if (!sessionId || !req.file?.buffer) {
        return res.status(400).json({ message: "Invalid request" });
    }
    // validate session exists and is not expired
    const session = (0, sessionStore_1.getSession)(sessionId);
    if (!session || Date.now() >= session.expiresAt) {
        return res.status(400).json({ message: "Session invalid or expired" });
    }
    // only allow uploads via session when accessType is "write"
    if (session.accessType !== "write") {
        return res.status(403).json({ message: "Session does not allow uploads" });
    }
    const stream = cloudinary_1.default.uploader.upload_stream({ resource_type: "auto" }, async (error, result) => {
        if (error || !result) {
            return res.status(500).json({ message: "Upload failed" });
        }
        // Attach patientId from session (if present)
        const patientId = session?.patientId;
        // Prefer authenticated user info when present
        const auth = req.user;
        const uploaderName = auth?.name || req.body?.uploaderName || undefined;
        const uploaderRole = auth?.role || "doctor";
        const doc = await document_model_1.default.create({
            sessionId,
            patientId,
            url: result.secure_url,
            type: req.body?.type || "Other",
            uploadedByName: uploaderName,
            uploadedByRole: uploaderRole,
        });
        return res.status(201).json({
            message: "Document uploaded",
            url: result.secure_url,
            data: { id: doc._id, url: doc.url, type: doc.type, uploadedByName: doc.uploadedByName, uploadedByRole: doc.uploadedByRole, createdAt: doc.createdAt },
        });
    });
    stream.end(req.file.buffer);
};
exports.uploadDocumentController = uploadDocumentController;
// New: upload documents directly for a patient (no QR required)
const uploadDocumentByPatientController = (req, res) => {
    const patientId = req.body?.patientId;
    if (!patientId || !req.file?.buffer) {
        return res.status(400).json({ message: "Invalid request" });
    }
    console.log(`Patient upload request received for patientId=${patientId}`);
    const stream = cloudinary_1.default.uploader.upload_stream({ resource_type: "auto" }, async (error, result) => {
        if (error || !result) {
            console.error("Cloudinary upload error:", error);
            return res.status(500).json({ message: "Upload failed" });
        }
        const uploaderName = req.body?.uploaderName || undefined;
        const doc = await document_model_1.default.create({
            // patient-owned upload — no sessionId
            patientId,
            url: result.secure_url,
            type: req.body?.type || "Other",
            uploadedByName: uploaderName,
            uploadedByRole: "patient",
        });
        console.log(`Document saved for patientId=${patientId}, docId=${doc._id}`);
        return res.status(201).json({
            message: "Document uploaded",
            url: result.secure_url,
            data: { id: doc._id, url: doc.url, type: doc.type, uploadedByName: doc.uploadedByName, uploadedByRole: doc.uploadedByRole, createdAt: doc.createdAt },
        });
    });
    stream.end(req.file.buffer);
};
exports.uploadDocumentByPatientController = uploadDocumentByPatientController;
// New: create a document record directly (useful for quick testing without Cloudinary)
const createMockDocumentController = async (req, res) => {
    const { patientId, url } = req.body;
    if (!patientId || !url) {
        return res.status(400).json({ message: "patientId and url are required" });
    }
    const uploaderName = req.body?.uploaderName || undefined;
    const uploaderRole = req.body?.uploaderRole || "patient";
    const doc = await document_model_1.default.create({ patientId, url, type: req.body?.type || "Other", uploadedByName: uploaderName, uploadedByRole: uploaderRole });
    console.log(`Mock document created for patientId=${patientId}, docId=${doc._id}`);
    return res.status(201).json({ message: "Mock document created", data: { id: doc._id, url: doc.url, type: doc.type, uploadedByName: doc.uploadedByName, uploadedByRole: doc.uploadedByRole, createdAt: doc.createdAt } });
};
exports.createMockDocumentController = createMockDocumentController;
const getDocumentsController = async (req, res) => {
    const sessionId = req.params.sessionId;
    // Prefer looking up the session's patientId (if present) so documents persist across sessions
    const session = (0, sessionStore_1.getSession)(sessionId);
    let docs;
    if (session?.patientId) {
        docs = await document_model_1.default.find({ patientId: session.patientId }).sort({
            createdAt: -1,
        });
    }
    else {
        // Fallback for older documents stored by sessionId
        docs = await document_model_1.default.find({ sessionId }).sort({
            createdAt: -1,
        });
    }
    return res.status(200).json({
        message: "Documents fetched",
        data: docs.map((d) => ({ id: d._id, url: d.url, type: d.type || "Other", uploadedByName: d.uploadedByName, uploadedByRole: d.uploadedByRole, createdAt: d.createdAt })),
    });
};
exports.getDocumentsController = getDocumentsController;
// New: fetch documents directly by patientId (used on patient pages)
const getDocumentsByPatientController = async (req, res) => {
    const patientId = req.params.patientId;
    if (!patientId) {
        return res.status(400).json({ message: "Invalid request" });
    }
    const docs = await document_model_1.default.find({ patientId }).sort({ createdAt: -1 });
    return res.status(200).json({ message: "Documents fetched", data: docs.map((d) => ({ id: d._id, url: d.url, type: d.type || "Other", uploadedByName: d.uploadedByName, uploadedByRole: d.uploadedByRole, createdAt: d.createdAt })) });
};
exports.getDocumentsByPatientController = getDocumentsByPatientController;
