"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSessionValid = exports.getSession = exports.saveSession = void 0;
const sessions = new Map();
const saveSession = (session) => {
    sessions.set(session.sessionId, session);
};
exports.saveSession = saveSession;
const getSession = (sessionId) => {
    return sessions.get(sessionId);
};
exports.getSession = getSession;
const isSessionValid = (sessionId) => {
    const session = sessions.get(sessionId);
    if (!session)
        return false;
    return Date.now() < session.expiresAt;
};
exports.isSessionValid = isSessionValid;
