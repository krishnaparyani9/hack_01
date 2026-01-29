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
    const fromId = process.argv[2];
    const toId = process.argv[3];
    if (!fromId || !toId) {
        console.error("Usage: reassignDocuments.ts <fromPatientId> <toPatientId>");
        process.exit(1);
    }
    await mongoose_1.default.connect(MONGO);
    console.log(`Connected to MongoDB ${MONGO}`);
    const docs = await document_model_1.default.find({ patientId: fromId }).lean().exec();
    console.log(`Found ${docs.length} documents for ${fromId}`);
    if (docs.length === 0) {
        await mongoose_1.default.disconnect();
        process.exit(0);
    }
    const confirm = process.argv.includes("--yes");
    if (!confirm) {
        console.log("Run with --yes flag to perform reassignment. Example:");
        console.log(`npx ts-node scripts/reassignDocuments.ts ${fromId} ${toId} --yes`);
        await mongoose_1.default.disconnect();
        process.exit(0);
    }
    const res = await document_model_1.default.updateMany({ patientId: fromId }, { patientId: toId }).exec();
    console.log(`Modified ${res.modifiedCount ?? 0} documents.`);
    await mongoose_1.default.disconnect();
    process.exit(0);
}
main().catch((err) => {
    console.error(err);
    process.exit(1);
});
