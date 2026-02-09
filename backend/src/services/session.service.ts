import { randomUUID } from "crypto";
import { CreateSessionPayload } from "../types/session.types";
import { generateSessionToken } from "../utils/jwt";
import { saveSession } from "../utils/sessionStore";

export const createSession = (payload: CreateSessionPayload) => {
  const sessionId = randomUUID();
  const expiresInSeconds = payload.durationMinutes * 60;

  // ✅ store session server-side and persist optional patientId
  const createdAt = Date.now();
  const token = generateSessionToken(
    {
      sessionId,
      accessType: payload.accessType,
      patientId: payload.patientId,
    },
    expiresInSeconds
  );

  saveSession({
    sessionId,
    token,
    accessType: payload.accessType,
    expiresAt: createdAt + expiresInSeconds * 1000,
    createdAt,
    durationMinutes: payload.durationMinutes,
    patientId: payload.patientId,
  });

  return {
    sessionId,
    token,
    expiresInMinutes: payload.durationMinutes,
    accessType: payload.accessType,
    patientId: payload.patientId,
  };
};