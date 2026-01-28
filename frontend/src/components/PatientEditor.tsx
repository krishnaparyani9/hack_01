import React, { useEffect, useState } from "react";
import axios from "axios";

const API = "http://localhost:5000";

interface Props {
  patientId: string;
  onClose: () => void;
}

const PatientEditor: React.FC<Props> = ({ patientId, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [allergies, setAllergies] = useState("");
  const [medications, setMedications] = useState("");
  const [chronicConditions, setChronicConditions] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");

  useEffect(() => {
    if (!patientId) {
      setLoading(false);
      return;
    }

    axios
      .get(`${API}/api/patients/${patientId}`)
      .then((res) => {
        const payload = res.data && res.data.data ? res.data.data : {};
        setName(payload.name || "");
        setEmail(payload.email || "");
        const em = payload.emergency || {};
        setBloodGroup(em.bloodGroup || "");
        setAllergies((em.allergies || []).join(", ") || "");
        setMedications((em.medications || []).join(", ") || "");
        setChronicConditions((em.chronicConditions || []).join(", ") || "");
        setEmergencyContact(em.emergencyContact || "");
      })
      .catch(() => {
        // ignore for now
      })
      .finally(() => setLoading(false));
  }, [patientId]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await axios.put(`${API}/api/patients/${patientId}`, {
        name,
        email,
        emergency: {
          bloodGroup,
          allergies: allergies
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          medications: medications
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          chronicConditions: chronicConditions
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          emergencyContact,
        },
      });

      if (name) localStorage.setItem("patientName", name);
      if (email) localStorage.setItem("patientEmail", email);

      // notify success
      window.dispatchEvent(new CustomEvent("toast", { detail: { message: "Details saved", type: "success" } }));
      window.dispatchEvent(new Event("patient-updated"));
      onClose();
    } catch (err) {
      console.error(err);
      window.dispatchEvent(new CustomEvent("toast", { detail: { message: "Failed to save details", type: "error" } }));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading…</div>;

  return (
    <form className="editor-form" onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <label className="field">
        <div>Name</div>
        <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} />
      </label>

      <label className="field">
        <div>Email</div>
        <input className="form-input" value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>

      <label className="field">
        <div>Blood group</div>
        <input className="form-input" value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)} />
      </label>

      <label className="field">
        <div>Allergies (comma separated)</div>
        <input className="form-input" value={allergies} onChange={(e) => setAllergies(e.target.value)} />
      </label>

      <label className="field">
        <div>Medications (comma separated)</div>
        <input className="form-input" value={medications} onChange={(e) => setMedications(e.target.value)} />
      </label>

      <label className="field">
        <div>Chronic conditions (comma separated)</div>
        <input className="form-input" value={chronicConditions} onChange={(e) => setChronicConditions(e.target.value)} />
      </label>

      <label className="field">
        <div>Emergency contact</div>
        <input className="form-input" value={emergencyContact} onChange={(e) => setEmergencyContact(e.target.value)} />
      </label>

      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </button>
        <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>
          Cancel
        </button>
      </div>
    </form>
  );
};

export default PatientEditor;
