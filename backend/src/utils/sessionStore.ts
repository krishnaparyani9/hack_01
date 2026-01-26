// backend/src/utils/sessionStore.ts

export interface SessionData {
  sessionId: string;
  accessType: "view" | "write";
  expiresAt: Date;
  patientId?: string; // optional for now
}

// In-memory session store (hackathon-safe)
export const sessions = new Map<string, SessionData>();
