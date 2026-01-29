#!/usr/bin/env ts-node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const document_model_1 = __importDefault(require("../src/models/document.model"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const MONGO = process.env.MONGO_URI || "mongodb://localhost:27017/healthvault";
async function main() {
    await mongoose_1.default.connect(MONGO);
    console.log("Connected to MongoDB", MONGO);
    // Aggregate counts per patientId
    const res = await document_model_1.default.aggregate([
        { $group: { _id: "$patientId", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
    ]).exec();
    console.log("Documents per patientId:");
    res.forEach((r) => console.log(r._id, "=>", r.count));
    // Optionally list docs for a specific id passed as arg
    const arg = process.argv[2];
    if (arg) {
        console.log(`\nListing documents for patientId: ${arg}`);
        const docs = await document_model_1.default.find({ patientId: arg }).sort({ createdAt: -1 }).lean().exec();
        docs.forEach((d, i) => {
            console.log(`${i + 1}. id=${d._id} uploadedBy=${d.uploadedByName || d.uploadedByRole} createdAt=${d.createdAt}`);
        });
    }
    await mongoose_1.default.disconnect();
    process.exit(0);
}
main().catch((err) => {
    console.error(err);
    process.exit(1);
});
