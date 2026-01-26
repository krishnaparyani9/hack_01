import mongoose from "mongoose";

const documentSchema = new mongoose.Schema({
  patientId: { type: String, required: true },
  cloudinaryId: String,
  fileUrl: String,
  originalName: String,
  mimeType: String,
  uploadedAt: { type: Date, default: Date.now },
});

export default mongoose.model("Document", documentSchema);
