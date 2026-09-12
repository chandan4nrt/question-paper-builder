import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Pencil, Printer, Download, Loader2, Upload } from "lucide-react";
import { PaperProvider, usePaper } from "../context/PaperContext";
import { EditorPage } from "./EditorPage";
import { PreviewPage } from "./PreviewPage";
import { AddQuestionBar } from "../components/AddQuestionBar";
import { ThemePanel } from "../components/ThemePanel";
import { exportToPDF } from "../helpers";
import { useSetPaper, useListPapers } from "../hooks/useQuestionPapers";
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
  return (
    <PaperProvider>
      <PaperBuilder paperId={id && id !== "new" ? id : null} />
    </PaperProvider>
  );
}

function PaperBuilder({ paperId }) {
  const { state, dispatch } = usePaper();
  const [activeTab, setActiveTab] = useState("editor");
  const [exporting, setExporting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const setPaperMutation = useSetPaper();
  const papersQuery = useListPapers();
  const [loaded, setLoaded] = useState(false);

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

  function flashToast(message) {
    setToastMessage(message);
    setShowToast(true);
    window.setTimeout(() => setShowToast(false), 4000);
  }

  async function handleGeneratePDF() {
    setActiveTab("preview");
    await waitForPrintArea();
    setExporting(true);
    try {
      await exportToPDF("print-area", `${state.header.schoolName || "question-paper"}.pdf`);
      flashToast("🎉 Congrats! Question paper generated successfully.");
    } finally {
      setExporting(false);
    }
  }

  function handleSetPaper() {
    const { formData, payload } = buildSetPaperFormData(state);
    console.log("Payload items:", payload.template.questions);
    setPaperMutation.mutate(formData, {
      onSuccess: (response) => {
        flashToast(`✅ Paper saved successfully (${response.paperId}).`);
      },
      onError: (error) => {
        flashToast(`❌ Failed to save paper: ${extractErrorMessage(error)}`);
      },
    });
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
            disabled={setPaperMutation.isPending}
          >
            {setPaperMutation.isPending ? (
              <Loader2 size={15} className="sp-spin" />
            ) : (
              <Upload size={15} />
            )}
            {setPaperMutation.isPending ? "Saving..." : "Save Paper"}
          </button>
          <button
            type="button"
            className="sp-tab sp-tab-export"
            onClick={handleGeneratePDF}
            disabled={exporting}
          >
            {exporting ? <Loader2 size={15} className="sp-spin" /> : <Download size={15} />}
            {exporting ? "Generating..." : "Generate PDF"}
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