import { useState } from 'react';
import { Eye, Download } from 'lucide-react';
import { usePaper } from '../context/PaperContext';
import { PrintPreview } from '../components/PrintPreview';
import { exportToPDF } from '../helpers';

export function PreviewPage() {
  const { totalMarks, state } = usePaper();
  const [showToast, setShowToast] = useState(false);

  async function handleExportPDF() {
    await exportToPDF('print-area', `${state.header.schoolName || 'question-paper'}.pdf`);
    setShowToast(true);
    window.setTimeout(() => setShowToast(false), 4000);
  }

  return (
    <div className="sp-no-print">
      <div className="sp-toolbar sp-no-print">
        <div className="sp-toolbar-title">
          <Eye size={20} color="#FFB199" />
          <span>Print Preview</span>
        </div>
        <div className="sp-toolbar-actions">
          <button type="button" onClick={handleExportPDF}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              <Download size={15} /> Generate PDF
            </span>
          </button>
        </div>
      </div>

      <div className="sp-gradient-border">
        <PrintPreview totalMarks={totalMarks} />
      </div>

      {showToast && (
        <div className="sp-toast sp-toast-success" role="status">
          🎉 Congrats! Question paper generated successfully.
        </div>
      )}
    </div>
  );
}
