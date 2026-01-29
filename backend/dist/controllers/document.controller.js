"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteDocumentController = exports.getDocumentsByPatientController = exports.getDocumentsController = exports.uploadDocumentByPatientController = exports.uploadDocumentController = void 0;
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
const document_model_1 = __importDefault(require("../models/document.model"));
const sessionStore_1 = require("../utils/sessionStore");
/**
 * Upload document via QR session (doctor upload)
 * Session is ONLY for permission, not ownership
 */
const uploadDocumentController = (req, res) => {
    const sessionId = req.params.sessionId;
    if (!sessionId || !req.file?.buffer) {
        return res.status(400).json({ message: "Invalid request" });
    }
    // Validate session
    const session = (0, sessionStore_1.getSession)(sessionId);
    if (!session || Date.now() >= session.expiresAt) {
        return res.status(401).json({ message: "Session invalid or expired" });
    }
    if (session.accessType !== "write") {
        return res.status(403).json({ message: "Session does not allow uploads" });
    }
    const stream = cloudinary_1.default.uploader.upload_stream({ resource_type: "auto" }, async (error, result) => {
        if (error || !result) {
            console.error("Cloudinary upload failed:", error);
            return res.status(500).json({ message: "Upload failed" });
        }
        try {
            const auth = req.user;
            const doc = await document_model_1.default.create({
                patientId: session.patientId, // ✅ ONLY owner
                url: result.secure_url,
                type: req.body?.type || "Other",
                uploadedByName: auth?.name || req.body?.uploaderName,
                uploadedByRole: auth?.role || "doctor",
            });
            return res.status(201).json({
                message: "Document uploaded",
                data: {
                    id: doc._id,
                    url: doc.url,
                    type: doc.type,
                    uploadedByName: doc.uploadedByName,
                    uploadedByRole: doc.uploadedByRole,
                    createdAt: doc.createdAt,
                },
            });
        }
        catch (err) {
            console.error("Document create failed:", err);
            return res.status(500).json({ message: "Failed to save document" });
        }
    });
    stream.end(req.file.buffer);
};
exports.uploadDocumentController = uploadDocumentController;
/**
 * Upload document directly by patient (no QR)
 */
const uploadDocumentByPatientController = (req, res) => {
    const auth = req.user;
    const patientId = auth?.role === "patient" && auth.userId
        ? auth.userId
        : req.body?.patientId;
    if (!patientId || !req.file?.buffer) {
        return res.status(400).json({ message: "Invalid request" });
    }
    const stream = cloudinary_1.default.uploader.upload_stream({ resource_type: "auto" }, async (error, result) => {
        if (error || !result) {
            console.error("Cloudinary upload failed:", error);
            return res.status(500).json({ message: "Upload failed" });
        }
        try {
            const doc = await document_model_1.default.create({
                patientId,
                url: result.secure_url,
                type: req.body?.type || "Other",
                uploadedByName: auth?.name,
                uploadedByRole: "patient",
            });
            return res.status(201).json({
                message: "Document uploaded",
                data: {
                    id: doc._id,
                    url: doc.url,
                    type: doc.type,
                    uploadedByName: doc.uploadedByName,
                    uploadedByRole: doc.uploadedByRole,
                    createdAt: doc.createdAt,
                },
            });
        }
        catch (err) {
            console.error("Document create failed:", err);
            return res.status(500).json({ message: "Failed to save document" });
        }
    });
    stream.end(req.file.buffer);
};
exports.uploadDocumentByPatientController = uploadDocumentByPatientController;
/**
 * Fetch documents via QR session (read access)
 */
const getDocumentsController = async (req, res) => {
    const sessionId = req.params.sessionId;
    const session = (0, sessionStore_1.getSession)(sessionId);
    if (!session || Date.now() >= session.expiresAt) {
        return res.status(401).json({ message: "Session invalid or expired" });
    }
    const docs = await document_model_1.default.find({
        patientId: session.patientId,
    }).sort({ createdAt: -1 });
    return res.status(200).json({
        message: "Documents fetched",
        data: docs.map((d) => ({
            id: d._id,
            url: d.url,
            type: d.type,
            uploadedByName: d.uploadedByName,
            uploadedByRole: d.uploadedByRole,
            createdAt: d.createdAt,
        })),
    });
};
exports.getDocumentsController = getDocumentsController;
/**
 * Fetch documents directly by patientId (patient dashboard)
 */
const getDocumentsByPatientController = async (req, res) => {
    const patientId = req.params.patientId;
    if (!patientId) {
        return res.status(400).json({ message: "Invalid request" });
    }
    const docs = await document_model_1.default.find({ patientId }).sort({
        createdAt: -1,
    });
    return res.status(200).json({
        message: "Documents fetched",
        data: docs.map((d) => ({
            id: d._id,
            url: d.url,
            type: d.type,
            uploadedByName: d.uploadedByName,
            uploadedByRole: d.uploadedByRole,
            createdAt: d.createdAt,
        })),
    });
};
exports.getDocumentsByPatientController = getDocumentsByPatientController;
/**
 * Delete a document (patients can delete their own documents)
 */
const deleteDocumentController = async (req, res) => {
    const id = req.params.id;
    if (!id)
        return res.status(400).json({ message: "Invalid request" });
    const doc = await document_model_1.default.findById(id);
    if (!doc)
        return res.status(404).json({ message: "Document not found" });
    const auth = req.user;
    if (!auth)
        return res.status(401).json({ message: "Authentication required" });
    // Patients may delete documents that belong to them
    if (auth.role === "patient") {
        if (String(doc.patientId) !== String(auth.userId)) {
            return res.status(403).json({ message: "Forbidden: cannot delete another patient's document" });
        }
    }
    else {
        // Doctors are not permitted to delete documents in this implementation
        return res.status(403).json({ message: "Forbidden: insufficient role" });
    }
    try {
        await document_model_1.default.deleteOne({ _id: id });
        return res.status(200).json({ message: "Document deleted" });
    }
    catch (err) {
        console.error("Failed to delete document:", err);
        return res.status(500).json({ message: "Failed to delete document" });
    }
};
exports.deleteDocumentController = deleteDocumentController;
