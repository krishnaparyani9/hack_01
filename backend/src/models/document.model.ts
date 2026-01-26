import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Document", documentSchema);
