import { useEffect, useState } from "react";
import axios from "axios";

const API = "http://localhost:5000";

export default function Documents() {
  const [file, setFile] = useState<File | null>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const sessionId = localStorage.getItem("sessionId");

  useEffect(() => {
    if (sessionId) fetchDocuments();
  }, [sessionId]);

  const fetchDocuments = async () => {
    try {
      const res = await axios.get(`${API}/api/documents/${sessionId}`);
      setDocuments(Array.isArray(res.data.data) ? res.data.data : []);
    } catch (err) {
      console.error("Fetch error", err);
      setDocuments([]);
    }
  };

  const uploadDocument = async () => {
    if (!sessionId || !file) return alert("No session or file");

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      await axios.post(
        `${API}/api/documents/upload/${sessionId}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      setFile(null);
      fetchDocuments();
    } catch (err) {
      alert("Upload failed");
    } finally {
      setLoading(false);
    }
  };

  if (!sessionId) {
    return <div className="card">Generate QR first.</div>;
  }

  return (
    <div className="main" style={{ maxWidth: 700, margin: "0 auto" }}>
      <h2>My Medical Documents</h2>

      <div className="card" style={{ marginBottom: 24 }}>
        <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        <button
          className="btn btn-primary"
          onClick={uploadDocument}
          disabled={loading}
          style={{ marginTop: 12 }}
        >
          {loading ? "Uploading..." : "Upload"}
        </button>
      </div>

      <div className="card">
        <h3>Uploaded Files</h3>

        {documents.length === 0 ? (
          <p>No documents uploaded.</p>
        ) : (
          <ul>
            {documents.map((doc, index) => {
              if (typeof doc !== "string") return null;

              const safeUrl = doc.startsWith("http")
                ? doc
                : `https://${doc}`;

              return (
                <li key={index}>
                  <a href={safeUrl} target="_blank" rel="noopener noreferrer">
                    View Document {index + 1}
                  </a>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
