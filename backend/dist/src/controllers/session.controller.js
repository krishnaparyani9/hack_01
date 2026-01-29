"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.endSessionController = exports.getSessionController = exports.validateSessionController = exports.createSessionAnonController = exports.createSessionController = void 0;
const session_service_1 = require("../services/session.service");
const jwt_1 = require("../utils/jwt");
const sessionStore_1 = require("../utils/sessionStore");
const createSessionController = (req, res) => {
    const { accessType, durationMinutes, patientId } = req.body;
    // Require a patientId to ensure sessions are always tied to a patient.
    // This prevents documents uploaded during a session from being orphaned.
    if (!accessType || !durationMinutes || !patientId) {
        return res.status(400).json({
            message: "accessType, durationMinutes and patientId are required",
        });
    }
    // Prevent creating a new session when the patient already has an active one
    const existing = (0, sessionStore_1.findActiveSessionByPatientId)(patientId);
    if (existing) {
        return res.status(409).json({ message: "Active session already exists" });
    }
    const session = (0, session_service_1.createSession)({ accessType, durationMinutes, patientId });
    return res.status(201).json({
        message: "QR session created",
        data: session,
    });
};
exports.createSessionController = createSessionController;
// Allow creating a session using a persisted `patientId` without authentication.
// This is used by the patient UI when the app stores a persistent patientId
// locally and the user is not actively signed in (keeps UX smooth after
// ending a session). The request must include `patientId` in the body.
const createSessionAnonController = (req, res) => {
    const { accessType, durationMinutes, patientId } = req.body;
    if (!accessType || !durationMinutes || !patientId) {
        return res.status(400).json({ message: "accessType, durationMinutes and patientId are required" });
    }
    console.log(`[session.controller] create-anon request patient=${patientId} access=${accessType} duration=${durationMinutes}`);
    const existing = (0, sessionStore_1.findActiveSessionByPatientId)(patientId);
    if (existing) {
        console.log(`[session.controller] create-anon conflict existing=${existing.sessionId}`);
        return res.status(409).json({ message: "Active session already exists" });
    }
    const session = (0, session_service_1.createSession)({ accessType, durationMinutes, patientId });
    console.log(`[session.controller] create-anon created session=${session.sessionId}`);
    return res.status(201).json({ message: "QR session created (anon)", data: session });
};
exports.createSessionAnonController = createSessionAnonController;
const validateSessionController = (req, res) => {
    const { token } = req.body;
    if (!token) {
        return res.status(400).json({
            message: "QR token is required",
        });
    }
    try {
        const decoded = (0, jwt_1.verifySessionToken)(token);
        // Ensure server-side session still exists and hasn't been invalidated.
        const session = (0, sessionStore_2.getSession)(decoded.sessionId);
        if (!session || Date.now() >= session.expiresAt) {
            return res.status(404).json({ message: "Session not found or expired" });
        }
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
const sessionStore_2 = require("../utils/sessionStore");
const getSessionController = (req, res) => {
    const sessionId = req.params.sessionId;
    if (!sessionId) {
        return res.status(400).json({ message: "sessionId is required" });
    }
    const session = (0, sessionStore_2.getSession)(sessionId);
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
// End / invalidate a session (patient or doctor)
const sessionStore_3 = require("../utils/sessionStore");
const endSessionController = (req, res) => {
    const sessionId = req.params.sessionId;
    if (!sessionId)
        return res.status(400).json({ message: "sessionId is required" });
    const session = (0, sessionStore_2.getSession)(sessionId);
    if (!session)
        return res.status(404).json({ message: "Session not found" });
    console.log(`[session.controller] endSession request session=${sessionId} patient=${session.patientId}`);
    // If authenticated as patient, ensure they own the session
    const user = req.user;
    if (user && user.role === "patient") {
        if (user.userId !== session.patientId)
            return res.status(403).json({ message: "Forbidden" });
    }
    (0, sessionStore_3.deleteSession)(sessionId);
    return res.status(200).json({ message: "Session ended" });
};
exports.endSessionController = endSessionController;
