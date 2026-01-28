"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upsertPatientController = exports.getPatientController = void 0;
const patient_model_1 = __importDefault(require("../models/patient.model"));
const getPatientController = async (req, res) => {
    const patientId = req.params.patientId;
    if (!patientId)
        return res.status(400).json({ message: "patientId required" });
    const patient = await patient_model_1.default.findOne({ patientId });
    if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
    }
    return res.status(200).json({ message: "Patient fetched", data: patient });
};
exports.getPatientController = getPatientController;
const upsertPatientController = async (req, res) => {
    const patientId = req.params.patientId;
    if (!patientId)
        return res.status(400).json({ message: "patientId required" });
    const payload = {};
    if (req.body.name !== undefined)
        payload.name = req.body.name;
    if (req.body.email !== undefined)
        payload.email = req.body.email;
    if (req.body.emergency !== undefined)
        payload.emergency = req.body.emergency;
    const patient = await patient_model_1.default.findOneAndUpdate({ patientId }, { $set: payload }, { upsert: true, new: true });
    return res.status(200).json({ message: "Patient updated", data: patient });
};
exports.upsertPatientController = upsertPatientController;
