import * as jwt from "jsonwebtoken";
import { Secret, SignOptions } from "jsonwebtoken";
import { SessionTokenData } from "../types/session.types";

const JWT_SECRET: Secret = process.env.JWT_SECRET || "dev_secret";

export const generateSessionToken = (
  payload: SessionTokenData,
  expiresInSeconds: number
): string => {
  const options: SignOptions = {
    expiresIn: expiresInSeconds,
  };

  return jwt.sign(payload, JWT_SECRET, options);
};

export const verifySessionToken = (token: string): SessionTokenData => {
  return jwt.verify(token, JWT_SECRET) as SessionTokenData;
};

// ----- AUTH TOKENS -----
export interface AuthTokenData {
  userId: string;
  role: "patient" | "doctor";
  name?: string;
  email?: string;
}

export const generateAuthToken = (payload: AuthTokenData, expiresInSeconds = 60 * 60 * 24 * 7) => {
  const options: SignOptions = { expiresIn: expiresInSeconds };
  return jwt.sign(payload, JWT_SECRET, options);
};

export const verifyAuthToken = (token: string) => {
  return jwt.verify(token, JWT_SECRET) as AuthTokenData;
};
