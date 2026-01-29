type Session = {
  sessionId: string;
  accessType: "view" | "write";
  expiresAt: number;
  createdAt?: number;
  durationMinutes?: number;
  // persistent patient id (optional)
  patientId?: string;
};

const sessions = new Map<string, Session>();

export const saveSession = (session: Session) => {
  sessions.set(session.sessionId, session);
  console.log(`[sessionStore] saveSession ${session.sessionId} patient=${session.patientId} expiresAt=${session.expiresAt}`);
};

export const getSession = (sessionId: string) => {
  const s = sessions.get(sessionId);
  console.log(`[sessionStore] getSession ${sessionId} -> ${s ? "found" : "missing"}`);
  return s;
};

export const isSessionValid = (sessionId: string) => {
  const session = sessions.get(sessionId);
  if (!session) return false;
  return Date.now() < session.expiresAt;
};

export const deleteSession = (sessionId: string) => {
  const ok = sessions.delete(sessionId);
  console.log(`[sessionStore] deleteSession ${sessionId} -> ${ok}`);
  return ok;
};

export const findActiveSessionByPatientId = (patientId: string) => {
  for (const session of sessions.values()) {
    const active = session.patientId === patientId && Date.now() < session.expiresAt;
    console.log(`[sessionStore] check session ${session.sessionId} patient=${session.patientId} active=${active}`);
    if (active) return session;
  }
  return undefined;
};
