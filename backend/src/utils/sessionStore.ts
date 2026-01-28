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
};

export const getSession = (sessionId: string) => {
  return sessions.get(sessionId);
};

export const isSessionValid = (sessionId: string) => {
  const session = sessions.get(sessionId);
  if (!session) return false;
  return Date.now() < session.expiresAt;
};
