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
