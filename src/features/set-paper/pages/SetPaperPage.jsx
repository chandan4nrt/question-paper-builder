import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Pencil, Printer, Download, Loader2, Upload, SlidersHorizontal, X, Plus, Layers } from "lucide-react";
import { PaperProvider, usePaper } from "../context/PaperContext";
import { EditorPage } from "./EditorPage";
import { PreviewPage } from "./PreviewPage";
import { AddQuestionBar } from "../components/AddQuestionBar";
import { ThemePanel } from "../components/ThemePanel";
import { exportToPDF } from "../helpers";
import { useSetPaper, useUpdatePaper, useListPapers, useGetPaper } from "../hooks/useQuestionPapers";
import { extractErrorMessage } from "../../../services/api";
import { buildSetPaperFormData } from "../serializePaper";
import { deserializePaper } from "../deserializePaper";
import { consumePendingQuestions } from "../pendingQuestions";

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
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") === "preview" ? "preview" : "editor";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [exporting, setExporting] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const setPaperMutation = useSetPaper();
  const updatePaperMutation = useUpdatePaper();
  const paperQuery = useGetPaper(paperId);
  const papersQuery = useListPapers();
  const [loaded, setLoaded] = useState(false);

  // Close mobile sidebar on Escape key
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape" && isMobileSidebarOpen) {
        setIsMobileSidebarOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobileSidebarOpen]);

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    if (isMobileSidebarOpen) {
      document.body.classList.add("sp-mobile-sidebar-active");
    } else {
      document.body.classList.remove("sp-mobile-sidebar-active");
    }
    return () => {
      document.body.classList.remove("sp-mobile-sidebar-active");
    };
  }, [isMobileSidebarOpen]);

  const saveMutation = paperId ? updatePaperMutation : setPaperMutation;

  const loadedPaper = paperId
    ? (paperQuery.data ?? papersQuery.data?.find((p) => p.paperId === paperId))
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

  useEffect(() => {
    if (!loaded) return;
    const pending = consumePendingQuestions();
    if (pending.length > 0) {
      dispatch({ type: "ADD_GENERATED_QUESTIONS", payload: { questions: pending } });
    }
  }, [loaded, dispatch]);

  function flashToast(message) {
    setToastMessage(message);
    setShowToast(true);
    window.setTimeout(() => setShowToast(false), 4000);
  }

  async function handleGeneratePDF(withAnswerKey = false) {
    setActiveTab("preview");
    await waitForPrintArea(withAnswerKey);
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
    const isEditMode = Boolean(paperId);
    const { formData, payload } = buildSetPaperFormData(state, paperId, loadedPaper);
    console.log("=== SET PAPER PAYLOAD ===", payload);
    console.log("=== SET PAPER PAYLOAD (JSON) ===\n" + JSON.stringify(payload, null, 2));
    const onSuccess = (response) => {
      flashToast(`✅ Paper ${isEditMode ? "updated" : "saved"} successfully (${response?.paperId ?? paperId}).`);
      if (!paperId) navigate("/staff/paper-builder");
    };
    const onError = (error) => {
      flashToast(`❌ Failed to ${isEditMode ? "update" : "save"} paper: ${extractErrorMessage(error)}`);
    };
    if (paperId) {
      updatePaperMutation.mutate({ paperId, formData }, { onSuccess, onError });
    } else {
      setPaperMutation.mutate(formData, { onSuccess, onError });
    }
  }

  const isPaperLoading = paperId && !loadedPaper && (papersQuery.isLoading || paperQuery.isLoading);
  if (isPaperLoading) {
    return (
      <div className="sp-app page sp-page-state-center">
        <Loader2 size={24} className="sp-spin sp-loading-spinner-muted" />
        <span className="sp-loading-text">Loading paper...</span>
      </div>
    );
  }

  if (paperId && !loadedPaper && papersQuery.isError && (paperQuery.isError || !paperQuery.isLoading)) {
    return (
      <div className="sp-app page sp-page-state-center">
        <p className="sp-state-error-text">Failed to load papers. Please try again.</p>
      </div>
    );
  }

  if (paperId && !loadedPaper && !papersQuery.isLoading && !paperQuery.isLoading && (papersQuery.isSuccess || paperQuery.isSuccess)) {
    return (
      <div className="sp-app page sp-page-state-center">
        <p className="sp-state-error-text">Paper not found. Please check the ID and try again.</p>
      </div>
    );
  }

  return (
    <div className="sp-app page">
      <div className="page-header">
        <div className="sp-tabs">
          {/* Mobile sidebar toggle button */}
          <button
            type="button"
            className={`sp-tab sp-mobile-tools-btn ${isMobileSidebarOpen ? "active" : ""}`}
            onClick={() => {
              if (activeTab !== "editor") {
                setActiveTab("editor");
              }
              setIsMobileSidebarOpen((prev) => !prev);
            }}
            title="Question Tools & Themes"
            aria-label="Toggle Question Tools & Themes"
          >
            <SlidersHorizontal size={15} />
            <span>Tools</span>
          </button>

          <button
            type="button"
            className={`sp-tab ${activeTab === "editor" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("editor");
              setSearchParams(
                (prev) => {
                  const next = new URLSearchParams(prev);
                  next.delete("tab");
                  return next;
                },
                { replace: true }
              );
            }}
          >
            <Pencil size={15} /> Editor
          </button>
          <button
            type="button"
            className={`sp-tab ${activeTab === "preview" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("preview");
              setIsMobileSidebarOpen(false);
              setSearchParams(
                (prev) => {
                  const next = new URLSearchParams(prev);
                  next.set("tab", "preview");
                  return next;
                },
                { replace: true }
              );
            }}
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
            {saveMutation.isPending
              ? Boolean(paperId)
                ? "Updating..."
                : "Saving..."
              : Boolean(paperId)
              ? "Update Paper"
              : "Save Paper"}
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
        {/* Backdrop for mobile drawer */}
        {isMobileSidebarOpen && (
          <div
            className="sp-mobile-sidebar-backdrop"
            onClick={() => setIsMobileSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        <div className={`layout-sec ${isMobileSidebarOpen ? "sp-mobile-sidebar-open" : ""}`}>
          <div className="sp-mobile-sidebar-header">
            <div className="sp-mobile-sidebar-title">
              <Layers size={18} color="#9333ea" />
              <span>Paper Tools & Questions</span>
            </div>
            <button
              type="button"
              className="sp-mobile-sidebar-close"
              onClick={() => setIsMobileSidebarOpen(false)}
              aria-label="Close sidebar"
            >
              <X size={20} />
            </button>
          </div>

          <aside className="sp-sidebar sp-sidebar-right">
            <AddQuestionBar disabled={activeTab === "preview"} />
          </aside>
          <aside className="sp-sidebar sp-sidebar-left">
            <ThemePanel
              disabled={activeTab === "preview"}
              onGenerateApplied={() => setIsMobileSidebarOpen(false)}
            />
          </aside>

          <div className="sp-mobile-sidebar-footer">
            <button
              type="button"
              className="sp-mobile-sidebar-done-btn"
              onClick={() => setIsMobileSidebarOpen(false)}
            >
              Done ({state.questions.length} Question{state.questions.length === 1 ? "" : "s"})
            </button>
          </div>
        </div>

        <div className="sp-builder-main">
          {activeTab === "editor" ? (
            <EditorPage onOpenSidebar={() => setIsMobileSidebarOpen(true)} />
          ) : (
            <PreviewPage />
          )}
        </div>
      </div>

      {/* Floating Action Button for mobile */}
      {activeTab === "editor" && !isMobileSidebarOpen && (
        <button
          type="button"
          className="sp-mobile-fab"
          onClick={() => setIsMobileSidebarOpen(true)}
          aria-label="Add Question & Tools"
        >
          <Plus size={20} />
          <span>Add Question</span>
        </button>
      )}

      {showToast && (
        <div className="sp-toast sp-toast-success" role="status">
          {toastMessage}
        </div>
      )}
    </div>
  );
}