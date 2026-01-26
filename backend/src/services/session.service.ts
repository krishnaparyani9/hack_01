import { randomUUID } from "crypto";
import { CreateSessionPayload } from "../types/session.types";
import { generateSessionToken } from "../utils/jwt";
import { sessions } from "../utils/sessionStore"; // ✅ ADD

export const createSession = (payload: CreateSessionPayload) => {
  const sessionId = randomUUID();

  // your logic (unchanged)
  const expiresInSeconds = payload.durationMinutes * 60;

  const token = generateSessionToken(
    {
      sessionId,
      accessType: payload.accessType,
    },
    expiresInSeconds
  );

  // ✅ NEW (store session, does NOT change logic)
  const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);

  sessions.set(sessionId, {
    sessionId,
    accessType: payload.accessType,
    expiresAt,
  });

  return {
    sessionId,
    token,
    expiresInMinutes: payload.durationMinutes,
    accessType: payload.accessType,
  };
};
