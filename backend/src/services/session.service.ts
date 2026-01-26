import { randomUUID } from "crypto";
import { CreateSessionPayload } from "../types/session.types";
import { generateSessionToken } from "../utils/jwt";
import { saveSession } from "../utils/sessionStore";

export const createSession = (payload: CreateSessionPayload) => {
  const sessionId = randomUUID();
  const expiresInSeconds = payload.durationMinutes * 60;

  // ✅ store session server-side
  saveSession({
    sessionId,
    accessType: payload.accessType,
    expiresAt: Date.now() + expiresInSeconds * 1000,
  });

  // ✅ FIXED: include accessType
  const token = generateSessionToken(
    {
      sessionId,
      accessType: payload.accessType,
    },
    expiresInSeconds
  );

  return {
    sessionId,
    token,
    expiresInMinutes: payload.durationMinutes,
    accessType: payload.accessType,
  };
};
