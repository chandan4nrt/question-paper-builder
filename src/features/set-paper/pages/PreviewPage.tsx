import { usePaper } from '../context/PaperContext';
import { PrintPreview } from '../components/PrintPreview';

export function PreviewPage() {
  const { totalMarks } = usePaper();

  return (
    <div className="sp-no-print">
      <div className="sp-gradient-border">
        <PrintPreview totalMarks={totalMarks} />
      </div>
    </div>
  );
}