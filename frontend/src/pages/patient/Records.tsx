import { useEffect, useState } from "react";
import axios from "axios";

const API = "http://localhost:5000";

export default function Records() {
  const [documents, setDocuments] = useState<any[]>([]);
  const sessionId = localStorage.getItem("sessionId");

  useEffect(() => {
    if (sessionId) fetchDocuments();
  }, [sessionId]);

  const fetchDocuments = async () => {
    try {
      const res = await axios.get(`${API}/api/documents/${sessionId}`);
      setDocuments(Array.isArray(res.data.data) ? res.data.data : []);
    } catch {
      setDocuments([]);
    }
  };

  if (!sessionId) return <p>No session active.</p>;

  return (
    <div className="main" style={{ maxWidth: 700, margin: "0 auto" }}>
      <h2>My Records</h2>

      {documents.length === 0 ? (
        <p>No records found.</p>
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
                  View Record {index + 1}
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
