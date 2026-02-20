import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
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

    // AI-generated summary (optional, populated after summarization)
    summary: {
      type: String,
    },

    // Date found inside the report itself (extracted from OCR text)
    reportDate: {
      type: Date,
    },

    // Extracted lab metrics (optional, populated after summarization)
    labResults: {
      hemoglobin: {
        value: Number,
        unit: String,
      },
      wbc: {
        value: Number,
        unit: String,
      },
      platelets: {
        value: Number,
        unit: String,
      },
      glucose: {
        value: Number,
        unit: String,
      },
    },
  },
  { timestamps: true }
);

export default mongoose.model("Document", documentSchema);
