import { useNavigate } from 'react-router-dom';
import { FileText, Trash2, Pencil, Loader2, Link2, Globe, Lock } from 'lucide-react';
import { useListPapers, useDeletePaper, usePublishPaper } from '../hooks/useQuestionPapers';
import { buildPublishPayload } from '../serializePaper';
import { extractErrorMessage } from '../../../services/api';
import { copyTextToClipboard } from '../../bloom-exam/copy';

function copyStudentLink(link) {
  copyTextToClipboard(link).then((ok) => {
    if (ok) {
      alert(`Student link copied:\n${link}`);
    } else {
      alert(`Student link:\n${link}`);
    }
  });
}

export function PaperListPage() {
  const navigate = useNavigate();
  const papersQuery = useListPapers();
  const deleteMutation = useDeletePaper();
  const publishMutation = usePublishPaper();

  function handleDelete(paperId) {
    deleteMutation.mutate(paperId);
  }

  function togglePublished(paper) {
    const willPublish = paper.published !== true;
    publishMutation.mutate(
      { paperId: paper.paperId, payload: buildPublishPayload(paper, willPublish) },
      {
        onSuccess: () => {
          alert(willPublish ? 'Paper published.' : 'Paper unpublished.');
        },
        onError: (error) => {
          alert(`Failed to update publish state: ${extractErrorMessage(error)}`);
        },
      },
    );
  }

  const updating = publishMutation.isPending;

  return (
    <div className="sp-app page">

      <div style={{ padding: '1.5rem', maxWidth: 900, margin: '0 auto' }}>
        <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '0.75rem' }}>
          Latest updated / created papers appear on top. Publish a paper to give students a link to answer it.
        </div>
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
            {(papersQuery.data ?? []).map((paper) => {
              const isPublished = paper.published === true;
              return (
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
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {paper.subject} — {paper.classLevel}
                      <span className={`sp-status-chip ${isPublished ? 'sp-status-published' : 'sp-status-draft'}`}>
                        {isPublished ? <Globe size={12} /> : <Lock size={12} />}
                        {isPublished ? 'Published' : 'Draft'}
                      </span>
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
                    className={`sp-tab ${isPublished ? 'sp-publish-on' : ''}`}
                    onClick={() => togglePublished(paper)}
                    disabled={updating && publishMutation.variables?.paperId === paper.paperId}
                    style={{ fontSize: '0.82rem', padding: '0.35rem 0.75rem', background: isPublished ? '#047857' : '#fff', color: isPublished ? '#fff' : '#475569', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}
                    title={isPublished ? 'Students can take this paper. Click to unpublish.' : 'Students cannot take this paper yet. Click to publish.'}
                  >
                    {updating && publishMutation.variables?.paperId === paper.paperId ? (
                      <Loader2 size={13} className="sp-spin" />
                    ) : isPublished ? (
                      <Lock size={13} />
                    ) : (
                      <Globe size={13} />
                    )}
                    {isPublished ? 'Unpublish' : 'Publish'}
                  </button>
                  {isPublished && (
                    <button
                      type="button"
                      className="sp-tab"
                      onClick={() => copyStudentLink(paper.publish_link || `${window.location.origin}/paper/${paper.paperId}`)}
                      style={{ fontSize: '0.82rem', padding: '0.35rem 0.75rem', background: '#fff', color: '#0f766e', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}
                      title="Copy student answer link"
                    >
                      <Link2 size={13} /> Student link
                    </button>
                  )}
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
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}