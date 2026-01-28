import mongoose from "mongoose";

const patientSchema = new mongoose.Schema(
  {
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
  },
  { timestamps: true }
);

export default mongoose.model("Patient", patientSchema);
