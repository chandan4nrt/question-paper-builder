import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { X, FilePlus2, FolderPlus } from 'lucide-react';
import { setPendingQuestions } from '../../set-paper/pendingQuestions';

export function AddToPaperModal({ rows, papers, onClose }) {
  const navigate = useNavigate();
  const [mode, setMode] = useState('new');
  const [paperId, setPaperId] = useState('');

  function handleAdd() {
    const questions = rows.map((row) => row.question).filter(Boolean);
    setPendingQuestions(questions);
    if (mode === 'existing' && paperId) {
      navigate(`/staff/paper-builder/${paperId}`);
    } else {
      navigate('/staff/paper-builder/new');
    }
    onClose();
  }

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal sp-add-paper-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add {rows.length} question{rows.length === 1 ? '' : 's'} to paper</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="sp-add-paper-options">
          <label className="sp-add-paper-option">
            <input type="radio" checked={mode === 'new'} onChange={() => setMode('new')} />
            <span className="sp-add-paper-option-icon"><FilePlus2 size={18} /></span>
            <span>
              <b>Brand new paper</b>
              <small>Creates a new paper in the Paper Builder with these questions.</small>
            </span>
          </label>

          <label className="sp-add-paper-option">
            <input
              type="radio"
              checked={mode === 'existing'}
              onChange={() => setMode('existing')}
              disabled={papers.length === 0}
            />
            <span className="sp-add-paper-option-icon"><FolderPlus size={18} /></span>
            <span>
              <b>Existing paper</b>
              <small>{papers.length === 0 ? 'No papers saved yet.' : 'Appends these questions to an existing paper.'}</small>
            </span>
          </label>

          {mode === 'existing' && papers.length > 0 && (
            <select className="sp-input sp-add-paper-select" value={paperId} onChange={(e) => setPaperId(e.target.value)}>
              <option value="">Select a paper…</option>
              {papers.map((paper) => (
                <option key={paper.paperId} value={paper.paperId}>
                  {paper.subject} — {paper.classLevel} · {paper.examTerm} · {paper.totalMarks} marks
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="sp-theme-modal-actions sp-ai-actions" style={{ marginTop: '1rem' }}>
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <span style={{ flex: 1 }} />
          <button
            type="button"
            onClick={handleAdd}
            disabled={mode === 'existing' && !paperId}
          >
            Add to Paper
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}