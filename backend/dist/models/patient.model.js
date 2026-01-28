"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const patientSchema = new mongoose_1.default.Schema({
    patientId: { type: String, required: true, unique: true, index: true },
    name: { type: String },
    email: { type: String },
    emergency: {
        bloodGroup: { type: String },
        allergies: { type: [String], default: [] },
        medications: { type: [String], default: [] },
        chronicConditions: { type: [String], default: [] },
        emergencyContact: { type: String },
    },
}, { timestamps: true });
exports.default = mongoose_1.default.model("Patient", patientSchema);
