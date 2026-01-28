import { useEffect, useState } from "react";

type Props = {
  onClose: () => void;
};

export default function DoctorDetailsModal({ onClose }: Props) {
  const [name, setName] = useState(() => localStorage.getItem("doctorName") || "Doctor");
  const [email, setEmail] = useState(() => localStorage.getItem("doctorEmail") || "doctor@example.com");
  const [id, setId] = useState(() => localStorage.getItem("doctorId") || `DR-${Math.floor(Math.random() * 9000 + 1000)}`);
  const [phone, setPhone] = useState(() => localStorage.getItem("doctorPhone") || "-");

  const [editing, setEditing] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "auto";
    };
  }, [onClose]);

  const save = () => {
    localStorage.setItem("doctorName", name);
    localStorage.setItem("doctorEmail", email);
    localStorage.setItem("doctorId", id);
    localStorage.setItem("doctorPhone", phone);
    window.dispatchEvent(new Event("doctor-updated"));
    window.dispatchEvent(new CustomEvent("toast", { detail: { message: "Doctor details saved", type: "success" } }));
    setEditing(false);
    onClose();
  };

  return (
    <div className="editor-modal" role="dialog" aria-modal onClick={onClose}>
      <div className="editor-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
        <button
          aria-label="Close"
          className="btn btn-secondary"
          style={{ position: "absolute", right: 12, top: 12 }}
          onClick={onClose}
        >
          ✕
        </button>

        <h3 style={{ marginTop: 4 }}>Doctor Details</h3>

        {!editing ? (
          <div style={{ marginTop: 12 }}>
            <p><strong>Name:</strong> {name}</p>
            <p><strong>Email:</strong> {email}</p>
            <p><strong>ID:</strong> {id}</p>
            <p><strong>Phone:</strong> {phone}</p>

            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <button className="btn btn-secondary" onClick={() => setEditing(true)}>Edit</button>
              <button className="btn btn-primary" onClick={onClose}>Close</button>
              <button className="btn btn-outline" onClick={() => { localStorage.removeItem("authToken"); localStorage.removeItem("userId"); localStorage.removeItem("userName"); localStorage.removeItem("userEmail"); localStorage.removeItem("userRole"); window.dispatchEvent(new CustomEvent("toast", { detail: { message: "Signed out", type: "success" } })); onClose(); }}>Sign Out</button>
            </div>
          </div>
        ) : (
          <div style={{ marginTop: 12 }}>
            <label style={{ fontSize: 13, fontWeight: 700 }}>Name</label>
            <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} style={{ width: "100%", marginTop: 8 }} />

            <label style={{ fontSize: 13, fontWeight: 700, marginTop: 12 }}>Email</label>
            <input className="form-input" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: "100%", marginTop: 8 }} />

            <label style={{ fontSize: 13, fontWeight: 700, marginTop: 12 }}>ID</label>
            <input className="form-input" value={id} onChange={(e) => setId(e.target.value)} style={{ width: "100%", marginTop: 8 }} />

            <label style={{ fontSize: 13, fontWeight: 700, marginTop: 12 }}>Phone</label>
            <input className="form-input" value={phone} onChange={(e) => setPhone(e.target.value)} style={{ width: "100%", marginTop: 8 }} />

            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <button className="btn btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={save}>Save</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
