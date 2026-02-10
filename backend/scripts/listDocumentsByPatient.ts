#!/usr/bin/env ts-node
import mongoose from "mongoose";
import Document from "../src/models/document.model";
import dotenv from "dotenv";

dotenv.config();

const MONGO = process.env.MONGO_URI || "mongodb://localhost:27017/healthkey";

async function main() {
  await mongoose.connect(MONGO);
  console.log("Connected to MongoDB", MONGO);

  // Aggregate counts per patientId
  const res = await Document.aggregate([
    { $group: { _id: "$patientId", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]).exec();

  console.log("Documents per patientId:");
  res.forEach((r: any) => console.log(r._id, "=>", r.count));

  // Optionally list docs for a specific id passed as arg
  const arg = process.argv[2];
  if (arg) {
    console.log(`\nListing documents for patientId: ${arg}`);
    const docs = await Document.find({ patientId: arg }).sort({ createdAt: -1 }).lean().exec();
    docs.forEach((d: any, i: number) => {
      console.log(`${i + 1}. id=${d._id} uploadedBy=${d.uploadedByName || d.uploadedByRole} createdAt=${d.createdAt}`);
    });
  }

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
