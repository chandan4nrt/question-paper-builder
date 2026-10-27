import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { FileText, Trash2, Pencil, Loader2, Eye, AlertTriangle } from 'lucide-react';
import { useListPapers, useDeletePaper } from '../hooks/useQuestionPapers';
import { PaperPreviewModal } from '../components/PaperPreviewModal';
import { extractErrorMessage } from '../../../services/api';

function DeleteConfirmModal({ paper, isDeleting, onConfirm, onClose }) {
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && !isDeleting) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, isDeleting]);

  return createPortal(
    <div
      className="modal-overlay sp-delete-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isDeleting) {
          onClose();
        }
      }}
      aria-modal="true"
      role="dialog"
    >
      <div className="modal sp-delete-modal">
        <div className="sp-delete-modal-icon-wrap">
          <AlertTriangle size={28} className="sp-delete-modal-icon" />
        </div>

        <h3 className="sp-delete-modal-title">Are you sure?</h3>

        <p className="sp-delete-modal-desc">
          Are you sure you want to delete this paper? This action cannot be undone.
        </p>

        <div className="sp-delete-modal-paper-preview">
          <div className="sp-delete-modal-paper-title">
            {paper.subject || 'Untitled'} — {paper.classLevel || 'General'}
          </div>
          <div className="sp-delete-modal-paper-meta">
            {[
              paper.examTerm,
              paper.academicYear,
              paper.totalMarks != null ? `${paper.totalMarks} marks` : null,
              paper.durationInMin != null ? `${paper.durationInMin} min` : null,
            ]
              .filter(Boolean)
              .join(' · ')}
          </div>
        </div>

        <div className="sp-delete-modal-actions">
          <button
            type="button"
            className="btn-secondary sp-delete-modal-cancel-btn"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn-danger sp-delete-modal-confirm-btn"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 size={15} className="sp-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 size={15} />
                <span>Yes, Delete</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export function PaperListPage() {
  const navigate = useNavigate();
  const papersQuery = useListPapers();
  const deleteMutation = useDeletePaper();
  const [viewingPaper, setViewingPaper] = useState(null);
  const [paperToDelete, setPaperToDelete] = useState(null);
  const [toast, setToast] = useState(null);

  function flashToast(message, type = 'success') {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 4000);
  }

  function handleConfirmDelete() {
    if (!paperToDelete) return;
    deleteMutation.mutate(paperToDelete.paperId, {
      onSuccess: () => {
        flashToast('✅ Paper deleted successfully');
        setPaperToDelete(null);
      },
      onError: (error) => {
        flashToast(`❌ Failed to delete paper: ${extractErrorMessage(error)}`, 'error');
        setPaperToDelete(null);
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
                  onClick={() => setPaperToDelete(paper)}
                  title="Delete paper"
                >
                  <Trash2 size={14} />
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

      {paperToDelete && (
        <DeleteConfirmModal
          paper={paperToDelete}
          isDeleting={deleteMutation.isPending}
          onConfirm={handleConfirmDelete}
          onClose={() => !deleteMutation.isPending && setPaperToDelete(null)}
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