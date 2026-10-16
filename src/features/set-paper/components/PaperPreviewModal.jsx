import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { X, Pencil, Download, Loader2 } from "lucide-react";
import { PaperProvider, usePaper } from "../context/PaperContext";
import { PrintPreview } from "./PrintPreview";
import { AnswerKey } from "./AnswerKey";
import { exportToPDF } from "../helpers";
import { deserializePaper } from "../deserializePaper";
import { useGetPaper } from "../hooks/useQuestionPapers";

function waitForPrintArea() {
  return new Promise((resolve) => {
    const check = () => {
      if (document.getElementById("print-area")) {
        resolve();
      } else {
        window.setTimeout(check, 50);
      }
    };
    check();
  });
}

export function PaperPreviewModal({ paper, onClose }) {
  if (!paper) return null;
  return (
    <PaperProvider key={paper.paperId}>
      <PaperPreviewModalContent initialPaper={paper} onClose={onClose} />
    </PaperProvider>
  );
}

function PaperPreviewModalContent({ initialPaper, onClose }) {
  const { state, dispatch, totalMarks } = usePaper();
  const navigate = useNavigate();
  const paperQuery = useGetPaper(initialPaper?.paperId);
  const activePaper = paperQuery.data ?? initialPaper;

  const [exporting, setExporting] = useState(null);
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (activePaper) {
      const deserialized = deserializePaper(activePaper);
      dispatch({ type: "LOAD_DRAFT", payload: deserialized });
    }
  }, [activePaper, dispatch]);

  function flashToast(message) {
    setToastMessage(message);
    setShowToast(true);
    window.setTimeout(() => setShowToast(false), 3500);
  }

  async function handleGeneratePDF(withAnswerKey = false) {
    await waitForPrintArea();
    setExporting(withAnswerKey ? "answer-key" : "plain");
    try {
      const baseName = state.header.schoolName || activePaper.subject || "question-paper";
      await exportToPDF(
        withAnswerKey ? ["print-area", "answer-key-area"] : "print-area",
        withAnswerKey ? `${baseName}-answer-key.pdf` : `${baseName}.pdf`
      );
      flashToast(
        withAnswerKey
          ? "🎉 PDF with answer key generated successfully."
          : "🎉 Question paper PDF generated successfully."
      );
    } catch (err) {
      flashToast("❌ Failed to export PDF. Please try again.");
    } finally {
      setExporting(null);
    }
  }

  return createPortal(
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 99999 }}>
      <div
        className="modal sp-preview-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "95vw",
          maxWidth: "940px",
          height: "92vh",
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          padding: 0,
          overflow: "hidden",
          borderRadius: 14,
          background: "#f8fafc",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        }}
      >
        {/* Header toolbar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "0.75rem",
            padding: "0.85rem 1.25rem",
            background: "#fff",
            borderBottom: "1px solid #e2e8f0",
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontWeight: 700, fontSize: "1rem", color: "#1e293b" }}>
                {activePaper.subject} — {activePaper.classLevel}
              </span>
              <span
                style={{
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  padding: "0.15rem 0.5rem",
                  background: "#f1f5f9",
                  color: "#475569",
                  borderRadius: 999,
                }}
              >
                Paper Preview
              </span>
            </div>
            <div style={{ fontSize: "0.76rem", color: "#64748b", marginTop: "2px" }}>
              {activePaper.examTerm && `${activePaper.examTerm} · `}
              {activePaper.academicYear && `${activePaper.academicYear} · `}
              {totalMarks} marks · {activePaper.durationInMin ?? 30} min
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
            <button
              type="button"
              className="sp-tab"
              onClick={() => navigate(`/staff/paper-builder/${activePaper.paperId}`)}
              style={{
                fontSize: "0.82rem",
                padding: "0.4rem 0.8rem",
                background: "#fff",
                color: "#8f240b",
                border: "1px solid #fed7aa",
                borderRadius: 8,
              }}
              title="Open full editor"
            >
              <Pencil size={13} /> Update Paper
            </button>
            <button
              type="button"
              className="sp-tab sp-tab-export"
              onClick={() => handleGeneratePDF(false)}
              disabled={exporting !== null}
              style={{
                fontSize: "0.82rem",
                padding: "0.4rem 0.8rem",
                borderRadius: 8,
              }}
            >
              {exporting === "plain" ? <Loader2 size={13} className="sp-spin" /> : <Download size={13} />}
              {exporting === "plain" ? "Generating..." : "Generate PDF"}
            </button>
            <button
              type="button"
              className="sp-tab sp-tab-export"
              onClick={() => handleGeneratePDF(true)}
              disabled={exporting !== null}
              style={{
                fontSize: "0.82rem",
                padding: "0.4rem 0.8rem",
                borderRadius: 8,
              }}
            >
              {exporting === "answer-key" ? <Loader2 size={13} className="sp-spin" /> : <Download size={13} />}
              {exporting === "answer-key" ? "Generating..." : "PDF with Answer Key"}
            </button>
            <button
              type="button"
              className="modal-close"
              onClick={onClose}
              aria-label="Close"
              style={{
                background: "#f1f5f9",
                border: "none",
                borderRadius: 8,
                padding: "0.4rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "#64748b",
                marginLeft: "0.25rem",
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Paper scrollable body */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "1.5rem 1rem",
            background: "#f8fafc",
          }}
        >
          <div style={{ maxWidth: 840, margin: "0 auto" }}>
            <div className="sp-gradient-border" style={{ marginBottom: "2rem" }}>
              <PrintPreview totalMarks={totalMarks} />
            </div>
            <AnswerKey />
          </div>
        </div>

        {/* Toast */}
        {showToast && (
          <div
            className="sp-toast sp-toast-success"
            role="status"
            style={{ position: "fixed", bottom: 20, right: 20, zIndex: 100000 }}
          >
            {toastMessage}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
