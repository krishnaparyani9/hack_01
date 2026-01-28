import { Request, Response } from "express";
import Patient from "../models/patient.model";

export const getPatientController = async (req: Request, res: Response) => {
  const patientId = req.params.patientId as string;
  if (!patientId) return res.status(400).json({ message: "patientId required" });

  const patient = await Patient.findOne({ patientId });
  if (!patient) {
    return res.status(404).json({ message: "Patient not found" });
  }

  return res.status(200).json({ message: "Patient fetched", data: patient });
};

export const upsertPatientController = async (req: Request, res: Response) => {
  const patientId = req.params.patientId as string;
  if (!patientId) return res.status(400).json({ message: "patientId required" });

  const payload: any = {};
  if (req.body.name !== undefined) payload.name = req.body.name;
  if (req.body.email !== undefined) payload.email = req.body.email;
  if (req.body.emergency !== undefined) payload.emergency = req.body.emergency;

  const patient = await Patient.findOneAndUpdate(
    { patientId },
    { $set: payload },
    { upsert: true, new: true }
  );

  return res.status(200).json({ message: "Patient updated", data: patient });
};
