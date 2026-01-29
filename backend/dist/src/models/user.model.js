"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const { Schema } = mongoose_1.default;
const UserSchema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["patient", "doctor"], required: true },
    // Doctor-specific metadata (optional)
    licenseNumber: { type: String },
    clinicName: { type: String },
}, { timestamps: true });
exports.default = mongoose_1.default.model("User", UserSchema);
