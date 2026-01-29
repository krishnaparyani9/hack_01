"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const documentSchema = new mongoose_1.default.Schema({
    // Persistent owner (patient)
    patientId: {
        type: String,
        required: true,
        index: true,
    },
    url: {
        type: String,
        required: true,
    },
    // Document type
    type: {
        type: String,
        enum: ["Prescription", "Lab Report", "Scan", "Other"],
        default: "Other",
    },
    // Uploader metadata
    uploadedByName: {
        type: String,
    },
    uploadedByRole: {
        type: String,
        enum: ["doctor", "patient"],
    },
}, { timestamps: true });
exports.default = mongoose_1.default.model("Document", documentSchema);
