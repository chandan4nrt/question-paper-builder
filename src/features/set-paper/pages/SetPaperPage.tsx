import { useState } from 'react';
import { Pencil, Printer } from 'lucide-react';
import { PaperProvider } from '../context/PaperContext';
import { EditorPage } from './EditorPage';
import { PreviewPage } from './PreviewPage';

export function SetPaperPage() {
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');

  const tabs = [
    { id: 'editor' as const, label: 'Editor', icon: <Pencil size={15} /> },
    { id: 'preview' as const, label: 'Preview', icon: <Printer size={15} /> },
  ];

  return (
    <PaperProvider>
      <div className="sp-app page">
        <div className="page-header">
          <div>
            <h1>Paper Builder</h1>
            <p>Create a playschool question paper, preview and export as PDF.</p>
          </div>
        </div>

        <div className="sp-tabs sp-no-print">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`sp-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'editor' ? <EditorPage /> : <PreviewPage />}
      </div>
    </PaperProvider>
  );
}
