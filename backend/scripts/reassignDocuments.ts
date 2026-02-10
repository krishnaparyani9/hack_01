#!/usr/bin/env ts-node
import mongoose from "mongoose";
import Document from "../src/models/document.model";
import dotenv from "dotenv";

dotenv.config();

const MONGO = process.env.MONGO_URI || "mongodb://localhost:27017/healthkey";

async function main() {
  const fromId = process.argv[2];
  const toId = process.argv[3];

  if (!fromId || !toId) {
    console.error("Usage: reassignDocuments.ts <fromPatientId> <toPatientId>");
    process.exit(1);
  }

  await mongoose.connect(MONGO);
  console.log(`Connected to MongoDB ${MONGO}`);

  const docs = await Document.find({ patientId: fromId }).lean().exec();
  console.log(`Found ${docs.length} documents for ${fromId}`);

  if (docs.length === 0) {
    await mongoose.disconnect();
    process.exit(0);
  }

  const confirm = process.argv.includes("--yes");
  if (!confirm) {
    console.log("Run with --yes flag to perform reassignment. Example:");
    console.log(`npx ts-node scripts/reassignDocuments.ts ${fromId} ${toId} --yes`);
    await mongoose.disconnect();
    process.exit(0);
  }

  const res = await Document.updateMany({ patientId: fromId }, { patientId: toId }).exec();
  console.log(`Modified ${res.modifiedCount ?? 0} documents.`);

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
