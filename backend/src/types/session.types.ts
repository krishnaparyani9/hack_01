export type AccessType = "view" | "write";

export interface CreateSessionPayload {
  accessType: AccessType;
  durationMinutes: number;
  // Optional persistent patient id (ensures documents persist across sessions)
  patientId?: string;
}

export interface SessionTokenData {
  sessionId: string;
  accessType: AccessType;
  // Present when session is created for a specific patient
  patientId?: string;
}

export interface ValidateSessionResponse {
  sessionId: string;
  accessType: AccessType;
  patientId?: string;
}
