export type AccessType = "view" | "write";

export interface CreateSessionPayload {
  accessType: AccessType;
  durationMinutes: number;
}

export interface SessionTokenData {
  sessionId: string;
  accessType: AccessType;
}

export interface ValidateSessionResponse {
  sessionId: string;
  accessType: AccessType;
}
