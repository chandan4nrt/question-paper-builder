import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Pencil, Printer, Download, Loader2, Upload } from "lucide-react";
import { PaperProvider, usePaper } from "../context/PaperContext";
import { EditorPage } from "./EditorPage";
import { PreviewPage } from "./PreviewPage";
import { AddQuestionBar } from "../components/AddQuestionBar";
import { ThemePanel } from "../components/ThemePanel";
import { exportToPDF } from "../helpers";
import { useSetPaper, useUpdatePaper, useListPapers } from "../hooks/useQuestionPapers";
import { extractErrorMessage } from "../../../services/api";
import { buildSetPaperFormData } from "../serializePaper";
import { deserializePaper } from "../deserializePaper";

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

export function SetPaperPage() {
  const { id } = useParams();
  const key = id || "new";
  return (
    <PaperProvider key={key}>
      <PaperBuilder paperId={id && id !== "new" ? id : null} />
    </PaperProvider>
  );
}

function PaperBuilder({ paperId }) {
  const { state, dispatch } = usePaper();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("editor");
  const [exporting, setExporting] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const setPaperMutation = useSetPaper();
  const updatePaperMutation = useUpdatePaper();
  const papersQuery = useListPapers();
  const [loaded, setLoaded] = useState(false);

  const saveMutation = paperId ? updatePaperMutation : setPaperMutation;

  const loadedPaper = paperId
    ? papersQuery.data?.find((p) => p.paperId === paperId)
    : undefined;

  useEffect(() => {
    if (loadedPaper && !loaded) {
      const deserialized = deserializePaper(loadedPaper);
      dispatch({ type: "LOAD_DRAFT", payload: deserialized });
      setLoaded(true);
    }
  }, [loadedPaper, loaded, dispatch]);

  useEffect(() => {
    if (paperId || loaded) return;
    dispatch({ type: "RESET" });
    setLoaded(true);
  }, [paperId, loaded, dispatch]);

  function flashToast(message) {
    setToastMessage(message);
    setShowToast(true);
    window.setTimeout(() => setShowToast(false), 4000);
  }

  async function handleGeneratePDF(withAnswerKey = false) {
    setActiveTab("preview");
    await waitForPrintArea();
    setExporting(withAnswerKey ? "answer-key" : "plain");
    try {
      const baseName = state.header.schoolName || "question-paper";
      await exportToPDF(
        withAnswerKey ? ["print-area", "answer-key-area"] : "print-area",
        withAnswerKey ? `${baseName}-answer-key.pdf` : `${baseName}.pdf`,
      );
      flashToast(
        withAnswerKey
          ? "🎉 Question paper with answer key generated successfully."
          : "🎉 Congrats! Question paper generated successfully.",
      );
    } finally {
      setExporting(null);
    }
  }

  function handleSetPaper() {
    const { formData, payload } = buildSetPaperFormData(state, paperId, loadedPaper);
    console.log("Payload items:", payload.template.questions);
    const onSuccess = (response) => {
      flashToast(`✅ Paper saved successfully (${response?.paperId ?? paperId}).`);
      if (!paperId) navigate("/staff/paper-builder");
    };
    const onError = (error) => {
      flashToast(`❌ Failed to save paper: ${extractErrorMessage(error)}`);
    };
    if (paperId) {
      updatePaperMutation.mutate({ paperId, formData }, { onSuccess, onError });
    } else {
      setPaperMutation.mutate(formData, { onSuccess, onError });
    }
  }

  if (paperId && papersQuery.isLoading) {
    return (
      <div className="sp-app page" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <Loader2 size={24} className="sp-spin" style={{ color: "#64748b" }} />
        <span style={{ marginLeft: "0.5rem", color: "#64748b" }}>Loading paper...</span>
      </div>
    );
  }

  if (paperId && papersQuery.isError) {
    return (
      <div className="sp-app page" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <p style={{ color: "#ef4444" }}>Failed to load papers. Please try again.</p>
      </div>
    );
  }

  if (paperId && papersQuery.isSuccess && !loadedPaper) {
    return (
      <div className="sp-app page" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <p style={{ color: "#ef4444" }}>Paper not found. Please check the ID and try again.</p>
      </div>
    );
  }

  return (
    <div className="sp-app page">
      <div className="page-header">
        <div className="sp-tabs">
          <button
            type="button"
            className={`sp-tab ${activeTab === "editor" ? "active" : ""}`}
            onClick={() => setActiveTab("editor")}
          >
            <Pencil size={15} /> Editor
          </button>
          <button
            type="button"
            className={`sp-tab ${activeTab === "preview" ? "active" : ""}`}
            onClick={() => setActiveTab("preview")}
          >
            <Printer size={15} /> Preview
          </button>
          <button
            type="button"
            className="sp-tab sp-tab-save"
            onClick={handleSetPaper}
            disabled={activeTab !== "preview" || saveMutation.isPending}
          >
            {saveMutation.isPending ? (
              <Loader2 size={15} className="sp-spin" />
            ) : (
              <Upload size={15} />
            )}
            {saveMutation.isPending ? "Saving..." : "Save Paper"}
          </button>
          <button
            type="button"
            className="sp-tab sp-tab-export"
            onClick={() => handleGeneratePDF(false)}
            disabled={activeTab !== "preview" || exporting !== null}
          >
            {exporting === "plain" ? <Loader2 size={15} className="sp-spin" /> : <Download size={15} />}
            {exporting === "plain" ? "Generating..." : "Generate PDF"}
          </button>
          <button
            type="button"
            className="sp-tab sp-tab-export"
            onClick={() => handleGeneratePDF(true)}
            disabled={activeTab !== "preview" || exporting !== null}
          >
            {exporting === "answer-key" ? <Loader2 size={15} className="sp-spin" /> : <Download size={15} />}
            {exporting === "answer-key" ? "Generating..." : "PDF with Answer Key"}
          </button>
        </div>
      </div>

      <div className="sp-builder-layout sp-no-print">
        <div className="layout-sec">
          <aside className="sp-sidebar sp-sidebar-right">
            <AddQuestionBar disabled={activeTab === "preview"} />
          </aside>
          <aside className="sp-sidebar sp-sidebar-left">
            <ThemePanel disabled={activeTab === "preview"} />
          </aside>
        </div>

        <div className="sp-builder-main">{activeTab === "editor" ? <EditorPage /> : <PreviewPage />}</div>
      </div>

      {showToast && (
        <div className="sp-toast sp-toast-success" role="status">
          {toastMessage}
        </div>
      )}
    </div>
  );
}