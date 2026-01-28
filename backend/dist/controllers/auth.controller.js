"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.meController = exports.loginController = exports.signupController = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const user_model_1 = __importDefault(require("../models/user.model"));
const document_model_1 = __importDefault(require("../models/document.model"));
const patient_model_1 = __importDefault(require("../models/patient.model"));
const jwt_1 = require("../utils/jwt");
const isValidRole = (r) => r === "patient" || r === "doctor";
const signupController = async (req, res) => {
    try {
        const { name, email, password, role, guestPatientId } = req.body;
        if (!name || !email || !password || !role) {
            return res.status(400).json({ message: "name, email, password and role are required" });
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
        const existing = await user_model_1.default.findOne({ email: normalizedEmail });
        if (existing)
            return res.status(409).json({ message: "Email already in use" });
        const hash = await bcryptjs_1.default.hash(password, 10);
        const user = await user_model_1.default.create({ name: normalizedName, email: normalizedEmail, passwordHash: hash, role });
        // Ensure a patient record exists for patient accounts (prevents 404s when frontend fetches patient data)
        try {
            if (role === "patient") {
                await patient_model_1.default.findOneAndUpdate({ patientId: user._id.toString() }, { $set: { name: user.name, email: user.email } }, { upsert: true, new: true });
            }
        }
        catch (e) {
            console.error("failed to ensure patient record", e);
        }
        // If the user signed up from a device with a guest patientId, reassign documents to the new user id
        try {
            if (guestPatientId && String(guestPatientId) !== user._id.toString()) {
                const result = await document_model_1.default.updateMany({ patientId: guestPatientId }, { patientId: user._id.toString() });
                console.log(`Merged ${result.modifiedCount ?? 0} documents from guest ${guestPatientId} -> ${user._id}`);
            }
        }
        catch (e) {
            console.error("failed to merge guest documents", e);
        }
        const token = (0, jwt_1.generateAuthToken)({ userId: user._id.toString(), role: role, name: user.name, email: user.email });
        return res.status(201).json({ message: "User created", data: { user: { id: user._id.toString(), name: user.name, email: user.email, role: user.role }, token } });
    }
    catch (err) {
        console.error("signup error", err);
        return res.status(500).json({ message: "Internal server error" });
    }
};
exports.signupController = signupController;
const loginController = async (req, res) => {
    try {
        const { email, password, guestPatientId } = req.body;
        if (!email || !password)
            return res.status(400).json({ message: "email and password are required" });
        const normalizedEmail = String(email).trim().toLowerCase();
        const user = await user_model_1.default.findOne({ email: normalizedEmail });
        if (!user)
            return res.status(401).json({ message: "Invalid credentials" });
        const ok = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!ok)
            return res.status(401).json({ message: "Invalid credentials" });
        // Ensure a patient record exists for patient accounts (prevents 404s when frontend fetches patient data)
        try {
            if (user.role === "patient") {
                await patient_model_1.default.findOneAndUpdate({ patientId: user._id.toString() }, { $set: { name: user.name, email: user.email } }, { upsert: true, new: true });
            }
        }
        catch (e) {
            console.error("failed to ensure patient record on login", e);
        }
        // If login provided a guestPatientId, merge docs into this user's account
        try {
            if (guestPatientId && String(guestPatientId) !== user._id.toString()) {
                const result = await document_model_1.default.updateMany({ patientId: guestPatientId }, { patientId: user._id.toString() });
                console.log(`Merged ${result.modifiedCount ?? 0} documents from guest ${guestPatientId} -> ${user._id}`);
            }
        }
        catch (e) {
            console.error("failed to merge guest documents on login", e);
        }
        const token = (0, jwt_1.generateAuthToken)({ userId: user._id.toString(), role: user.role, name: user.name, email: user.email });
        return res.status(200).json({ message: "Logged in", data: { user: { id: user._id.toString(), name: user.name, email: user.email, role: user.role }, token } });
    }
    catch (err) {
        console.error("login error", err);
        return res.status(500).json({ message: "Internal server error" });
    }
};
exports.loginController = loginController;
const meController = async (req, res) => {
    const auth = req.user;
    if (!auth)
        return res.status(401).json({ message: "Not authenticated" });
    return res.status(200).json({ data: { id: auth.userId, name: auth.name, email: auth.email, role: auth.role } });
};
exports.meController = meController;
