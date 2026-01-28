import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
    // optional: document can be owned by a patient without an active session
    sessionId: {
      type: String,
      required: false,
      index: true,
    },
    // persistent owner (patient) id — documents remain visible across sessions
    patientId: {
      type: String,
      required: false,
      index: true,
    },
    url: {
      type: String,
      required: true,
    },
    // Document type (Prescription, Lab Report, Scan, Other)
    type: {
      type: String,
      enum: ["Prescription", "Lab Report", "Scan", "Other"],
      default: "Other",
    },
    // Uploader metadata
    uploadedByName: {
      type: String,
      required: false,
    },
    uploadedByRole: {
      type: String,
      enum: ["doctor", "patient"],
      required: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Document", documentSchema);
