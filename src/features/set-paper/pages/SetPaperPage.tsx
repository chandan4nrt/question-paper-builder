import { useState } from "react";
import { Pencil, Printer } from "lucide-react";
import { PaperProvider } from "../context/PaperContext";
import { EditorPage } from "./EditorPage";
import { PreviewPage } from "./PreviewPage";
import { AddQuestionBar } from "../components/AddQuestionBar";
import { ThemePanel } from "../components/ThemePanel";

export function SetPaperPage() {
  const [activeTab, setActiveTab] = useState<"editor" | "preview">("editor");

  const tabs = [
    { id: "editor" as const, label: "Editor", icon: <Pencil size={15} /> },
    { id: "preview" as const, label: "Preview", icon: <Printer size={15} /> },
  ];

  return (
    <PaperProvider>
      <div className="sp-app page">
        <div className="page-header">
          <div>
            <h1>Paper Builder</h1>
            <p>Create a playschool question paper, preview and export as PDF.</p>
          </div>
          <div className="sp-tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`sp-tab ${activeTab === tab.id ? "active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="sp-builder-layout sp-no-print">
          <div className="layout-sec">
            <aside className="sp-sidebar sp-sidebar-right">
              <AddQuestionBar />
            </aside>
            <aside className="sp-sidebar sp-sidebar-left">
              <ThemePanel />
            </aside>
          </div>

          <div className="sp-builder-main">{activeTab === "editor" ? <EditorPage /> : <PreviewPage />}</div>
        </div>
      </div>
    </PaperProvider>
  );
}
