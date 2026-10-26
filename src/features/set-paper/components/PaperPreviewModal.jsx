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

function waitForPrintArea(withAnswerKey = false) {
  return new Promise((resolve) => {
    const check = () => {
      const hasPrint = Boolean(document.getElementById("print-area"));
      const hasAk = !withAnswerKey || Boolean(document.getElementById("answer-key-area"));
      if (hasPrint && hasAk) {
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
    await waitForPrintArea(withAnswerKey);
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
    <div className="modal-overlay sp-preview-modal-overlay" onClick={onClose}>
      <div
        className="modal sp-preview-modal sp-preview-modal-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header toolbar */}
        <div className="sp-preview-modal-header">
          <div className="sp-preview-modal-info">
            <div className="sp-preview-modal-title-row">
              <span className="sp-preview-modal-title">
                {activePaper.subject} — {activePaper.classLevel}
              </span>
              <span className="sp-preview-modal-badge">
                Paper Preview
              </span>
            </div>
            <div className="sp-preview-modal-meta">
              {activePaper.examTerm && `${activePaper.examTerm} · `}
              {activePaper.academicYear && `${activePaper.academicYear} · `}
              {totalMarks} marks · {activePaper.durationInMin ?? 30} min
            </div>
          </div>

          <div className="sp-preview-modal-actions">
            <button
              type="button"
              className="sp-tab sp-preview-modal-edit-btn"
              onClick={() => navigate(`/staff/paper-builder/${activePaper.paperId}`)}
              title="Open full editor"
            >
              <Pencil size={13} /> Update Paper
            </button>
            <button
              type="button"
              className="sp-tab sp-tab-export sp-preview-modal-export-btn"
              onClick={() => handleGeneratePDF(false)}
              disabled={exporting !== null}
            >
              {exporting === "plain" ? <Loader2 size={13} className="sp-spin" /> : <Download size={13} />}
              {exporting === "plain" ? "Generating..." : "Generate PDF"}
            </button>
            <button
              type="button"
              className="sp-tab sp-tab-export sp-preview-modal-export-btn"
              onClick={() => handleGeneratePDF(true)}
              disabled={exporting !== null}
            >
              {exporting === "answer-key" ? <Loader2 size={13} className="sp-spin" /> : <Download size={13} />}
              {exporting === "answer-key" ? "Generating..." : "PDF with Answer Key"}
            </button>
            <button
              type="button"
              className="modal-close sp-preview-modal-close-btn"
              onClick={onClose}
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Paper scrollable body */}
        <div className="sp-preview-modal-body">
          <div className="sp-preview-modal-inner">
            <div className="sp-gradient-border sp-preview-modal-print-border">
              <PrintPreview totalMarks={totalMarks} />
            </div>
            <AnswerKey />
          </div>
        </div>

        {/* Toast */}
        {showToast && (
          <div
            className="sp-toast sp-toast-success sp-preview-modal-toast"
            role="status"
          >
            {toastMessage}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
