export type Session = {
  sessionId: string;
  token: string;
  patientId: string;
  accessType: "view" | "write";
  createdAt: number;
  expiresAt: number;
  durationMinutes: number;
  sharedDocIds?: string[];
  anon?: boolean;
};

const sessionsById: Record<string, Session> = {};
const sessionsByToken: Record<string, Session> = {};

const genId = () => Math.random().toString(36).slice(2, 10);
const genToken = () => Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);

export function createSession(opts: {
  patientId: string;
  accessType?: "view" | "write";
  durationMinutes?: number;
  sharedDocIds?: string[];
  anon?: boolean;
}): Session {
  const accessType = opts.accessType || "view";
  const duration = Number(opts.durationMinutes) || 15;
  const now = Date.now();
  const expiresAt = now + duration * 60 * 1000;
  const sessionId = genId();
  const token = genToken();

  const session: Session = {
    sessionId,
    token,
    patientId: opts.patientId,
    accessType,
    createdAt: now,
    expiresAt,
    durationMinutes: duration,
    sharedDocIds: Array.isArray(opts.sharedDocIds) && opts.sharedDocIds.length ? opts.sharedDocIds : undefined,
    anon: !!opts.anon,
  };

  sessionsById[sessionId] = session;
  sessionsByToken[token] = session;

  return session;
}

export function getSession(idOrToken: string | undefined | null): Session | null {
  if (!idOrToken) return null;
  const s = sessionsById[idOrToken] || sessionsByToken[idOrToken];
  if (!s) return null;
  if (Date.now() >= s.expiresAt) {
    // cleanup expired session
    delete sessionsById[s.sessionId];
    delete sessionsByToken[s.token];
    return null;
  }
  return s;
}

export function findActiveSessionByPatient(patientId: string): Session | null {
  // iterate sessionsById for a session with same patientId and not expired
  for (const k in sessionsById) {
    const s = sessionsById[k];
    if (!s) continue;
    if (s.patientId === patientId && Date.now() < s.expiresAt) {
      return s;
    }
  }
  return null;
}

export function deleteSession(sessionId: string): boolean {
  const s = sessionsById[sessionId];
  if (!s) return false;
  delete sessionsById[s.sessionId];
  delete sessionsByToken[s.token];
  return true;
}
