import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import User from "../models/user.model";
import { generateAuthToken } from "../utils/jwt";

export const signupController = async (req: Request, res: Response) => {
  const { name, email, password, role } = req.body as { name?: string; email?: string; password?: string; role?: string };

  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: "name, email, password and role are required" });
  }

  // basic validations
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ message: "Invalid email format" });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters" });
  }

  const existing = await User.findOne({ email });
  if (existing) return res.status(409).json({ message: "Email already in use" });

  const hash = await bcrypt.hash(password, 10);

  const user = await User.create({ name, email, passwordHash: hash, role });

  const token = generateAuthToken({ userId: user._id.toString(), role: role as any, name: user.name, email: user.email });

  return res.status(201).json({ message: "User created", data: { user: { id: user._id, name: user.name, email: user.email, role: user.role }, token } });
};

export const loginController = async (req: Request, res: Response) => {
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password) return res.status(400).json({ message: "email and password are required" });

  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ message: "Invalid credentials" });

  const token = generateAuthToken({ userId: user._id.toString(), role: user.role as any, name: user.name, email: user.email });

  return res.status(200).json({ message: "Logged in", data: { user: { id: user._id, name: user.name, email: user.email, role: user.role }, token } });
};

export const meController = async (req: Request, res: Response) => {
  const auth = (req as any).user;
  if (!auth) return res.status(401).json({ message: "Not authenticated" });

  return res.status(200).json({ data: { id: auth.userId, name: auth.name, email: auth.email, role: auth.role } });
};