import { Fragment, useMemo, useState } from "react";
import type { CSSProperties, ReactNode } from "react";

type Props = {
  summary: string;
  documentCount: number;
  generatedAt?: string;
  onClose: () => void;
};

type SummaryBlock =
  | { kind: "paragraph"; content: string }
  | { kind: "list"; items: string[] };

const parseSummary = (text: string): SummaryBlock[] => {
  const lines = text.split(/\r?\n/);
  const blocks: SummaryBlock[] = [];
  let currentList: string[] | null = null;

  const flushList = () => {
    if (currentList && currentList.length > 0) {
      blocks.push({ kind: "list", items: currentList });
      currentList = null;
    }
  };

  lines.forEach((rawLine) => {
    const line = rawLine.trim();
    if (!line) {
      flushList();
      return;
    }

    if (line.startsWith("- ")) {
      if (!currentList) currentList = [];
      currentList.push(line.slice(2));
      return;
    }

    flushList();
    blocks.push({ kind: "paragraph", content: line });
  });

  flushList();
  return blocks;
};

const renderInline = (text: string, keyPrefix: string): ReactNode[] | string => {
  const nodes: ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*)|(`[^`]+`)/g;
  let match: RegExpExecArray | null;
  let lastIndex = 0;
  let tokenIndex = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(
        <Fragment key={`${keyPrefix}-text-${tokenIndex}`}>{text.slice(lastIndex, match.index)}</Fragment>
      );
      tokenIndex += 1;
    }

    const token = match[0];
    if (token.startsWith("**")) {
      nodes.push(
        <strong key={`${keyPrefix}-strong-${tokenIndex}`}>
          {token.slice(2, -2)}
        </strong>
      );
    } else {
      nodes.push(
        <code key={`${keyPrefix}-code-${tokenIndex}`}>{token.slice(1, -1)}</code>
      );
    }

    tokenIndex += 1;
    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) {
    nodes.push(
      <Fragment key={`${keyPrefix}-tail`}>{text.slice(lastIndex)}</Fragment>
    );
  }

  if (nodes.length === 0) return text;
  return nodes;
};

const AISummaryModal = ({ summary, documentCount, generatedAt, onClose }: Props) => {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");
  const timestamp = generatedAt ? new Date(generatedAt).toLocaleString() : null;
  const trimmedSummary = summary.trim();

  const blocks = useMemo(() => {
    if (!trimmedSummary) {
      return parseSummary("No significant findings across the provided records.");
    }
    return parseSummary(trimmedSummary);
  }, [trimmedSummary]);

  const handleCopy = async () => {
    try {
      const copyValue = trimmedSummary || "No significant findings across the provided records.";
      await navigator.clipboard.writeText(copyValue);
      setCopyState("copied");
      window.setTimeout(() => setCopyState("idle"), 2200);
    } catch (error) {
      console.error("Failed to copy summary:", error);
      setCopyState("error");
      window.setTimeout(() => setCopyState("idle"), 2200);
    }
  };

  return (
    <div style={overlayStyle} role="dialog" aria-modal>
      <div style={modalStyle}>
        <div style={headerStyle}>
          <div>
            <p style={eyebrowStyle}>AI Medical Summary</p>
            <h3 style={titleStyle}>Latest patient insights</h3>
          </div>
          <button style={closeIconButtonStyle} aria-label="Close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div style={metaBarStyle}>
          <span style={badgeStyle}>
            📄 {documentCount} document{documentCount === 1 ? "" : "s"}
          </span>
          {timestamp && <span style={timestampStyle}>Generated {timestamp}</span>}
          <button style={copyButtonStyle} onClick={handleCopy}>
            {copyState === "copied" ? "Copied" : copyState === "error" ? "Retry" : "Copy Summary"}
          </button>
        </div>

        <div style={summaryBoxStyle}>
          <div style={summaryContentStyle}>
            {blocks.map((block, index) => {
              if (block.kind === "list") {
                return (
                  <ul key={`list-${index}`} style={listStyle}>
                    {block.items.map((item, itemIdx) => (
                      <li key={`list-${index}-${itemIdx}`} style={listItemStyle}>
                        {renderInline(item, `list-${index}-${itemIdx}`)}
                      </li>
                    ))}
                  </ul>
                );
              }

              return (
                <p key={`para-${index}`} style={paragraphStyle}>
                  {renderInline(block.content, `para-${index}`)}
                </p>
              );
            })}
          </div>
        </div>

        <p style={disclaimerStyle}>
          ⚠️ This summary is AI-generated for support purposes only and should not replace professional medical advice.
        </p>

        <button style={primaryButtonStyle} onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
};

const overlayStyle: CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  backgroundColor: "rgba(4, 6, 14, 0.68)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  padding: 16,
  zIndex: 9999,
};

const modalStyle: CSSProperties = {
  background: "radial-gradient(circle at top, rgba(37, 99, 235, 0.25), rgba(15, 23, 42, 0.95))",
  borderRadius: 20,
  width: "min(600px, 100%)",
  padding: 32,
  color: "#f8fafc",
  border: "1px solid rgba(148, 163, 184, 0.35)",
  boxShadow: "0 40px 80px rgba(15, 23, 42, 0.6)",
  display: "flex",
  flexDirection: "column",
  gap: 18,
};

const headerStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 12,
};

const eyebrowStyle: CSSProperties = {
  fontSize: 12,
  letterSpacing: 1.2,
  textTransform: "uppercase",
  color: "#38bdf8",
  marginBottom: 6,
  fontWeight: 600,
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: 26,
  fontWeight: 700,
  lineHeight: 1.2,
};

const closeIconButtonStyle: CSSProperties = {
  padding: "8px 12px",
  borderRadius: 12,
  background: "rgba(15, 23, 42, 0.6)",
  color: "#e2e8f0",
  border: "1px solid rgba(148, 163, 184, 0.45)",
  cursor: "pointer",
};

const metaBarStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: 12,
};

const badgeStyle: CSSProperties = {
  background: "rgba(56, 189, 248, 0.18)",
  color: "#bae6fd",
  borderRadius: 999,
  padding: "6px 14px",
  fontWeight: 600,
  fontSize: 13,
};

const timestampStyle: CSSProperties = {
  fontSize: 13,
  color: "#cbd5f5",
};

const copyButtonStyle: CSSProperties = {
  marginLeft: "auto",
  padding: "6px 16px",
  background: "rgba(148, 163, 184, 0.2)",
  color: "#f8fafc",
  borderRadius: 12,
  border: "1px solid rgba(148, 163, 184, 0.4)",
  cursor: "pointer",
  fontWeight: 600,
};

const summaryBoxStyle: CSSProperties = {
  borderRadius: 16,
  padding: 20,
  background: "linear-gradient(135deg, rgba(37, 99, 235, 0.18), rgba(59, 130, 246, 0.08))",
  border: "1px solid rgba(59, 130, 246, 0.25)",
  maxHeight: 360,
  overflowY: "auto",
};

const summaryContentStyle: CSSProperties = {
  fontSize: 15,
  lineHeight: 1.65,
  display: "flex",
  flexDirection: "column",
  gap: 10,
};

const paragraphStyle: CSSProperties = {
  margin: 0,
};

const listStyle: CSSProperties = {
  margin: 0,
  paddingLeft: 20,
  display: "flex",
  flexDirection: "column",
  gap: 6,
};

const listItemStyle: CSSProperties = {
  margin: 0,
};

const disclaimerStyle: CSSProperties = {
  fontSize: 12,
  lineHeight: 1.5,
  color: "#cbd5f5",
  marginTop: 6,
};

const primaryButtonStyle: CSSProperties = {
  alignSelf: "flex-start",
  padding: "10px 22px",
  borderRadius: 12,
  border: "none",
  cursor: "pointer",
  background: "linear-gradient(135deg, #38bdf8, #2563eb)",
  color: "#f8fafc",
  fontWeight: 600,
  boxShadow: "0 12px 28px rgba(37, 99, 235, 0.35)",
};

export default AISummaryModal;
