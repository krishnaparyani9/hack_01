"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findActiveSessionByPatientId = exports.deleteSession = exports.isSessionValid = exports.getSession = exports.saveSession = void 0;
const sessions = new Map();
const saveSession = (session) => {
    sessions.set(session.sessionId, session);
    console.log(`[sessionStore] saveSession ${session.sessionId} patient=${session.patientId} expiresAt=${session.expiresAt}`);
};
exports.saveSession = saveSession;
const getSession = (sessionId) => {
    const s = sessions.get(sessionId);
    console.log(`[sessionStore] getSession ${sessionId} -> ${s ? "found" : "missing"}`);
    return s;
};
exports.getSession = getSession;
const isSessionValid = (sessionId) => {
    const session = sessions.get(sessionId);
    if (!session)
        return false;
    return Date.now() < session.expiresAt;
};
exports.isSessionValid = isSessionValid;
const deleteSession = (sessionId) => {
    const ok = sessions.delete(sessionId);
    console.log(`[sessionStore] deleteSession ${sessionId} -> ${ok}`);
    return ok;
};
exports.deleteSession = deleteSession;
const findActiveSessionByPatientId = (patientId) => {
    for (const session of sessions.values()) {
        const active = session.patientId === patientId && Date.now() < session.expiresAt;
        console.log(`[sessionStore] check session ${session.sessionId} patient=${session.patientId} active=${active}`);
        if (active)
            return session;
    }
    return undefined;
};
exports.findActiveSessionByPatientId = findActiveSessionByPatientId;
