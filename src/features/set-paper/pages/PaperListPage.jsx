import { useNavigate } from 'react-router-dom';
import { FileText, Trash2, Pencil, Loader2 } from 'lucide-react';
import { useListPapers, useDeletePaper } from '../hooks/useQuestionPapers';

export function PaperListPage() {
  const navigate = useNavigate();
  const papersQuery = useListPapers();
  const deleteMutation = useDeletePaper();

  function handleDelete(paperId) {
    deleteMutation.mutate(paperId);
  }

  return (
    <div className="sp-app page">
      <div className="page-header">
        <div className="sp-tabs">
          <span className="sp-tab active">
            <FileText size={15} /> My Papers
          </span>
        </div>
        <button
          type="button"
          className="sp-tab sp-tab-save"
          onClick={() => navigate('/staff/paper-builder/new')}
        >
          <Pencil size={15} /> New Paper
        </button>
      </div>

      <div style={{ padding: '1.5rem', maxWidth: 900, margin: '0 auto' }}>
        {papersQuery.isLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '3rem 1rem', color: '#64748b' }}>
            <Loader2 size={20} className="sp-spin" /> Loading papers...
          </div>
        ) : papersQuery.isError ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#ef4444' }}>
            Failed to load papers. Please try again.
          </div>
        ) : papersQuery.data?.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b' }}>
            <FileText size={40} style={{ marginBottom: '0.75rem', opacity: 0.4 }} />
            <p style={{ fontSize: '1rem', fontWeight: 600 }}>No papers found</p>
            <p style={{ fontSize: '0.85rem' }}>Create a paper and save it to see it here.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {(papersQuery.data ?? []).map((paper) => (
              <div
                key={paper.paperId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '0.75rem 1rem',
                  border: '1px solid #e2e8f0',
                  borderRadius: 10,
                  background: '#fff',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e293b' }}>
                    {paper.subject} — {paper.classLevel}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 2 }}>
                    {paper.examTerm} · {paper.academicYear} · {paper.totalMarks} marks · {paper.durationInMin} min
                  </div>
                </div>
                <button
                  type="button"
                  className="sp-tab"
                  onClick={() => navigate(`/staff/paper-builder/${paper.paperId}`)}
                  style={{ fontSize: '0.82rem', padding: '0.35rem 0.75rem', background: '#fff', color: '#8f240b', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}
                >
                  <Pencil size={13} /> Edit
                </button>
                <button
                  type="button"
                  className="sp-icon-btn"
                  onClick={() => handleDelete(paper.paperId)}
                  title="Delete paper"
                  style={{ color: '#ef4444' }}
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
    </div>
  );
}