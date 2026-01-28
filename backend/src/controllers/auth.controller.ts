import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import User from "../models/user.model";
import Document from "../models/document.model";
import Patient from "../models/patient.model";
import { generateAuthToken } from "../utils/jwt";

const isValidRole = (r?: string) => r === "patient" || r === "doctor";

export const signupController = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role, guestPatientId, licenseNumber, clinicName } = req.body as { name?: string; email?: string; password?: string; role?: string; guestPatientId?: string; licenseNumber?: string; clinicName?: string };

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "name, email, password and role are required" });
    }

    // if signing up as a doctor, require a license number for verification
    if (role === "doctor") {
      if (!licenseNumber || String(licenseNumber).trim().length < 3) {
        return res.status(400).json({ message: "Doctors must provide a valid license number" });
      }
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedName = String(name).trim();

    // basic validations
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    if (!isValidRole(role)) {
      return res.status(400).json({ message: "role must be either 'patient' or 'doctor'" });
    }

    if (String(password).length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) return res.status(409).json({ message: "Email already in use" });

    const hash = await bcrypt.hash(password, 10);

    const user = await User.create({ name: normalizedName, email: normalizedEmail, passwordHash: hash, role, licenseNumber: role === "doctor" ? String(licenseNumber).trim() : undefined, clinicName: role === "doctor" ? (clinicName ? String(clinicName).trim() : undefined) : undefined });

    // Ensure a patient record exists for patient accounts (prevents 404s when frontend fetches patient data)
    try {
      if (role === "patient") {
        await Patient.findOneAndUpdate(
          { patientId: user._id.toString() },
          { $set: { name: user.name, email: user.email } },
          { upsert: true, new: true }
        );
      }
    } catch (e) {
      console.error("failed to ensure patient record", e);
    }

    // If the user signed up from a device with a guest patientId, reassign documents to the new user id
    try {
      if (guestPatientId && String(guestPatientId) !== user._id.toString()) {
        const result = await Document.updateMany({ patientId: guestPatientId }, { patientId: user._id.toString() });
        console.log(`Merged ${result.modifiedCount ?? 0} documents from guest ${guestPatientId} -> ${user._id}`);
      }
    } catch (e) {
      console.error("failed to merge guest documents", e);
    }

    const token = generateAuthToken({ userId: user._id.toString(), role: role as any, name: user.name, email: user.email });

    return res.status(201).json({ message: "User created", data: { user: { id: user._id.toString(), name: user.name, email: user.email, role: user.role }, token } });
  } catch (err) {
    console.error("signup error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const loginController = async (req: Request, res: Response) => {
  try {
    const { email, password, guestPatientId } = req.body as { email?: string; password?: string; guestPatientId?: string };
    if (!email || !password) return res.status(400).json({ message: "email and password are required" });

    const normalizedEmail = String(email).trim().toLowerCase();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    // Ensure a patient record exists for patient accounts (prevents 404s when frontend fetches patient data)
    try {
      if (user.role === "patient") {
        await Patient.findOneAndUpdate(
          { patientId: user._id.toString() },
          { $set: { name: user.name, email: user.email } },
          { upsert: true, new: true }
        );
      }
    } catch (e) {
      console.error("failed to ensure patient record on login", e);
    }

    // If login provided a guestPatientId, merge docs into this user's account
    try {
      if (guestPatientId && String(guestPatientId) !== user._id.toString()) {
        const result = await Document.updateMany({ patientId: guestPatientId }, { patientId: user._id.toString() });
        console.log(`Merged ${result.modifiedCount ?? 0} documents from guest ${guestPatientId} -> ${user._id}`);
      }
    } catch (e) {
      console.error("failed to merge guest documents on login", e);
    }

    const token = generateAuthToken({ userId: user._id.toString(), role: user.role as any, name: user.name, email: user.email });

    return res.status(200).json({ message: "Logged in", data: { user: { id: user._id.toString(), name: user.name, email: user.email, role: user.role }, token } });
  } catch (err) {
    console.error("login error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const meController = async (req: Request, res: Response) => {
  const auth = (req as any).user;
  if (!auth) return res.status(401).json({ message: "Not authenticated" });

  return res.status(200).json({ data: { id: auth.userId, name: auth.name, email: auth.email, role: auth.role } });
};