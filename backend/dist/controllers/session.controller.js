"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSessionController = exports.validateSessionController = exports.createSessionController = void 0;
const session_service_1 = require("../services/session.service");
const jwt_1 = require("../utils/jwt");
const createSessionController = (req, res) => {
    const { accessType, durationMinutes, patientId } = req.body;
    if (!accessType || !durationMinutes) {
        return res.status(400).json({
            message: "accessType and durationMinutes are required",
        });
    }
    const session = (0, session_service_1.createSession)({
        accessType,
        durationMinutes,
        patientId,
    });
    return res.status(201).json({
        message: "QR session created",
        data: session,
    });
};
exports.createSessionController = createSessionController;
const validateSessionController = (req, res) => {
    const { token } = req.body;
    if (!token) {
        return res.status(400).json({
            message: "QR token is required",
        });
    }
    try {
        const decoded = (0, jwt_1.verifySessionToken)(token);
        return res.status(200).json({
            message: "Session valid",
            data: {
                sessionId: decoded.sessionId,
                accessType: decoded.accessType,
                patientId: decoded.patientId,
            },
        });
    }
    catch {
        return res.status(401).json({
            message: "Invalid or expired session",
        });
    }
};
exports.validateSessionController = validateSessionController;
// New: fetch session info (authoritative source of accessType & patientId)
const sessionStore_1 = require("../utils/sessionStore");
const getSessionController = (req, res) => {
    const sessionId = req.params.sessionId;
    if (!sessionId) {
        return res.status(400).json({ message: "sessionId is required" });
    }
    const session = (0, sessionStore_1.getSession)(sessionId);
    if (!session || Date.now() >= session.expiresAt) {
        return res.status(404).json({ message: "Session not found or expired" });
    }
    return res.status(200).json({
        message: "Session fetched",
        data: {
            sessionId: session.sessionId,
            accessType: session.accessType,
            patientId: session.patientId,
            createdAt: session.createdAt,
            expiresAt: session.expiresAt,
            durationMinutes: session.durationMinutes,
        },
    });
};
exports.getSessionController = getSessionController;
