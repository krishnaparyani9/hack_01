import { Request, Response, NextFunction } from "express";
import { verifyAuthToken } from "../utils/jwt";

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const header = req.headers.authorization as string | undefined;
  if (!header || !header.startsWith("Bearer ")) return next();

  const token = header.split(" ")[1];
  try {
    const payload = verifyAuthToken(token);
    // attach to request
    (req as any).user = payload;
    next();
  } catch (err) {
    // invalid token: just proceed without user (routes can choose to require)
    return next();
  }
};

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if ((req as any).user) return next();
  return res.status(401).json({ message: "Authentication required" });
};

// Require a specific role for a route (e.g. doctor-only)
export const requireRole = (role: "doctor" | "patient") => (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  if (!user) return res.status(401).json({ message: "Authentication required" });
  if (user.role !== role) return res.status(403).json({ message: "Forbidden: insufficient role" });
  return next();
};