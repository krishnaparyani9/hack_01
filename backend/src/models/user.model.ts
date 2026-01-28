import mongoose from "mongoose";

const { Schema } = mongoose;

const UserSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["patient", "doctor"], required: true },
    // Doctor-specific metadata (optional)
    licenseNumber: { type: String },
    clinicName: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("User", UserSchema);
