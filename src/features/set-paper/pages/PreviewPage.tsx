import { Eye, Download } from 'lucide-react';
import { usePaper } from '../context/PaperContext';
import { PrintPreview } from '../components/PrintPreview';
import { exportToPDF } from '../helpers';

export function PreviewPage() {
  const { totalMarks, state } = usePaper();

  function handleExportPDF() {
    exportToPDF('print-area', `${state.header.schoolName || 'question-paper'}.pdf`);
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
    </div>
  );
}
