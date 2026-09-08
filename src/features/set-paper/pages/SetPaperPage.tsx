import { useState } from "react";
import { Pencil, Printer, Download, Loader2 } from "lucide-react";
import { PaperProvider, usePaper } from "../context/PaperContext";
import { EditorPage } from "./EditorPage";
import { PreviewPage } from "./PreviewPage";
import { AddQuestionBar } from "../components/AddQuestionBar";
import { ThemePanel } from "../components/ThemePanel";
import { exportToPDF } from "../helpers";

function waitForPrintArea(): Promise<void> {
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
  return (
    <PaperProvider>
      <PaperBuilder />
    </PaperProvider>
  );
}

function PaperBuilder() {
  const { state } = usePaper();
  const [activeTab, setActiveTab] = useState<"editor" | "preview">("editor");
  const [exporting, setExporting] = useState(false);
  const [showToast, setShowToast] = useState(false);

  function openPreview() {
    setActiveTab("preview");
  }

  async function handleGeneratePDF() {
    setActiveTab("preview");
    await waitForPrintArea();
    setExporting(true);
    try {
      await exportToPDF("print-area", `${state.header.schoolName || "question-paper"}.pdf`);
      setShowToast(true);
      window.setTimeout(() => setShowToast(false), 4000);
    } finally {
      setExporting(false);
    }
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
          <button type="button" className="sp-tab" onClick={openPreview}>
            <Printer size={15} /> Print Preview
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
          🎉 Congrats! Question paper generated successfully.
        </div>
      )}
    </div>
  );
}