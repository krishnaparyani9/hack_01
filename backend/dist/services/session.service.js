"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSession = void 0;
const crypto_1 = require("crypto");
const jwt_1 = require("../utils/jwt");
const sessionStore_1 = require("../utils/sessionStore");
const createSession = (payload) => {
    const sessionId = (0, crypto_1.randomUUID)();
    const expiresInSeconds = payload.durationMinutes * 60;
    // ✅ store session server-side and persist optional patientId
    const createdAt = Date.now();
    (0, sessionStore_1.saveSession)({
        sessionId,
        accessType: payload.accessType,
        expiresAt: createdAt + expiresInSeconds * 1000,
        createdAt,
        durationMinutes: payload.durationMinutes,
        patientId: payload.patientId,
    });
    // ✅ include accessType and optional patientId in token
    const token = (0, jwt_1.generateSessionToken)({
        sessionId,
        accessType: payload.accessType,
        patientId: payload.patientId,
    }, expiresInSeconds);
    return {
        sessionId,
        token,
        expiresInMinutes: payload.durationMinutes,
        accessType: payload.accessType,
        patientId: payload.patientId,
    };
};
exports.createSession = createSession;
