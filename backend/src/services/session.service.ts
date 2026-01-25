import { randomUUID } from "crypto";
import { CreateSessionPayload } from "../types/session.types";
import { generateSessionToken } from "../utils/jwt";

export const createSession = (payload: CreateSessionPayload) => {
  const sessionId = randomUUID();

  const expiresInSeconds = payload.durationMinutes * 60;

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
