import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Trash2, Pencil, Loader2, Eye } from 'lucide-react';
import { useListPapers, useDeletePaper } from '../hooks/useQuestionPapers';
import { PaperPreviewModal } from '../components/PaperPreviewModal';
import { extractErrorMessage } from '../../../services/api';

export function PaperListPage() {
  const navigate = useNavigate();
  const papersQuery = useListPapers();
  const deleteMutation = useDeletePaper();
  const [viewingPaper, setViewingPaper] = useState(null);
  const [toast, setToast] = useState(null);

  function flashToast(message, type = 'success') {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 4000);
  }

  function handleDelete(paperId) {
    deleteMutation.mutate(paperId, {
      onSuccess: () => {
        flashToast('✅ Paper deleted successfully');
      },
      onError: (error) => {
        flashToast(`❌ Failed to delete paper: ${extractErrorMessage(error)}`, 'error');
      },
    });
  }

  return (
    <div className="sp-app page">

      <div className="sp-paper-list-container">
        <div className="sp-paper-list-subtitle">
          Latest updated / created papers appear on top.
        </div>
        {papersQuery.isLoading ? (
          <div className="sp-paper-list-loading">
            <Loader2 size={20} className="sp-spin" /> Loading papers...
          </div>
        ) : papersQuery.isError ? (
          <div className="sp-paper-list-error">
            Failed to load papers. Please try again.
          </div>
        ) : papersQuery.data?.length === 0 ? (
          <div className="sp-paper-list-empty">
            <FileText size={40} className="sp-paper-list-empty-icon" />
            <p className="sp-paper-list-empty-title">No papers found</p>
            <p className="sp-paper-list-empty-desc">Create a paper and save it to see it here.</p>
          </div>
        ) : (
          <div className="sp-paper-list-items">
            {(papersQuery.data ?? []).map((paper) => (
              <div
                key={paper.paperId}
                className="sp-paper-list-item"
              >
                <div className="sp-paper-list-item-info">
                  <div className="sp-paper-list-item-title">
                    {paper.subject} — {paper.classLevel}
                  </div>
                  <div className="sp-paper-list-item-meta">
                    {paper.examTerm} · {paper.academicYear} · {paper.totalMarks} marks · {paper.durationInMin} min
                  </div>
                </div>
                <button
                  type="button"
                  className="sp-tab sp-paper-list-view-btn"
                  onClick={() => setViewingPaper(paper)}
                  title="Preview paper and answer key"
                >
                  <Eye size={13} /> View
                </button>
                <button
                  type="button"
                  className="sp-tab sp-paper-list-update-btn"
                  onClick={() => navigate(`/staff/paper-builder/${paper.paperId}`)}
                  title="Update paper"
                >
                  <Pencil size={13} /> Update
                </button>
                <button
                  type="button"
                  className="sp-icon-btn sp-paper-list-delete-btn"
                  onClick={() => handleDelete(paper.paperId)}
                  title="Delete paper"
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending && deleteMutation.variables === paper.paperId ? (
                    <Loader2 size={14} className="sp-spin" />
                  ) : (
                    <Trash2 size={14} />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {viewingPaper && (
        <PaperPreviewModal
          paper={viewingPaper}
          onClose={() => setViewingPaper(null)}
        />
      )}

      {toast && (
        <div className={`sp-toast sp-toast-${toast.type}`} role="status">
          {toast.message}
        </div>
      )}
    </div>
  );
}