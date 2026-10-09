import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  FileText,
  Trash2,
  Pencil,
  Loader2,
  Copy,
  Globe,
  Lock,
} from 'lucide-react';

import {
  useListPapers,
  useDeletePaper,
  usePublishPaper,
} from '../hooks/useQuestionPapers';
import { buildStudentLink } from '../studentLink';

import { extractErrorMessage } from '../../../services/api';

export function PaperListPage() {
  const navigate = useNavigate();

  const papersQuery = useListPapers();
  const deleteMutation = useDeletePaper();
  const publishMutation = usePublishPaper();

  // IMPORTANT: useState must be INSIDE the component
  const [copiedPaperId, setCopiedPaperId] = useState(null);

  /**
   * Copy student link
   */
  const copyStudentLink = async (link, paperId) => {
    try {
      // Modern Clipboard API
      if (
        navigator.clipboard &&
        typeof navigator.clipboard.writeText === 'function'
      ) {
        await navigator.clipboard.writeText(link);
      } else {
        // Fallback for environments where navigator.clipboard is unavailable
        const textarea = document.createElement('textarea');

        textarea.value = link;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        textarea.style.top = '0';
        textarea.style.opacity = '0';

        document.body.appendChild(textarea);

        textarea.focus();
        textarea.select();
        textarea.setSelectionRange(0, textarea.value.length);

        const successful = document.execCommand('copy');

        document.body.removeChild(textarea);

        if (!successful) {
          throw new Error('Copy command failed');
        }
      }

      // Show "Copied"
      setCopiedPaperId(paperId);

      // Reset button after 2 seconds
      setTimeout(() => {
        setCopiedPaperId(null);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy student link:', error);
    }
  };

  function handleDelete(paperId) {
    deleteMutation.mutate(paperId);
  }

  function getQuestionCount(paper) {
    if (Array.isArray(paper?.questions) && paper.questions.length > 0) {
      return paper.questions.length;
    }
    const rawQuestions = paper?.template?.sections?.length
      ? paper.template.sections.flatMap((s) => s.questions ?? [])
      : (paper?.template?.questions ?? []);
    return rawQuestions.length;
  }

 function togglePublished(paper) {
  const willPublish = paper.published !== true;
  const questionCount = getQuestionCount(paper);

  if (willPublish && questionCount === 0) {
    toast.error(
      'Cannot publish paper: Please add at least one question to the paper before publishing.'
    );
    return;
  }

    publishMutation.mutate(
      { paperId: paper.paperId },
      {
        onSuccess: (response) => {
          const link = response?.publishLink
            ? buildStudentLink(response.publishLink)
            : null;
          toast.success(
            willPublish
              ? (link
                  ? `Paper published. Student link: ${link}`
                  : 'Paper published.')
              : 'Paper unpublished.',
          );
        },
        onError: (error) => {
          toast.error(
            `Failed to update publish state: ${extractErrorMessage(error)}`
          );
        },
      },
    );
  }

  const updating = publishMutation.isPending;

  return (
    <div className="sp-app page">
      <div
        style={{
          padding: '1.5rem',
          maxWidth: 900,
          margin: '0 auto',
        }}
      >
        <div
          style={{
            fontSize: '0.78rem',
            color: '#64748b',
            marginBottom: '0.75rem',
          }}
        >
          Latest updated / created papers appear on top. Publish a paper to
          give students a link to answer it.
        </div>

        {papersQuery.isLoading ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '3rem 1rem',
              color: '#64748b',
            }}
          >
            <Loader2 size={20} className="sp-spin" />
            Loading papers...
          </div>
        ) : papersQuery.isError ? (
          <div
            style={{
              textAlign: 'center',
              padding: '3rem 1rem',
              color: '#ef4444',
            }}
          >
            Failed to load papers. Please try again.
          </div>
        ) : papersQuery.data?.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '3rem 1rem',
              color: '#64748b',
            }}
          >
            <FileText
              size={40}
              style={{
                marginBottom: '0.75rem',
                opacity: 0.4,
              }}
            />

            <p
              style={{
                fontSize: '1rem',
                fontWeight: 600,
              }}
            >
              No papers found
            </p>

            <p
              style={{
                fontSize: '0.85rem',
              }}
            >
              Create a paper and save it to see it here.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
            }}
          >
            {(papersQuery.data ?? [])
              .filter((paper) => paper.active !== false)
              .map((paper) => {
                const isPublished =
                  paper.published === true ||
                  paper.paper_status === 'PUBLISHED' ||
                  paper.paperStatus === 'PUBLISHED';

                const storedLink = paper.publish_link || paper.publishLink || null;
                const studentLink = buildStudentLink(storedLink);

              const isCopied = copiedPaperId === paper.paperId;

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
                  {/* Paper information */}
                  <div
                    style={{
                      flex: 1,
                      minWidth: 0,
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        color: '#1e293b',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                      }}
                    >
                      {paper.subject} — {paper.classLevel}

                      <span
                        className={`sp-status-chip ${
                          isPublished
                            ? 'sp-status-published'
                            : 'sp-status-draft'
                        }`}
                      >
                        {isPublished ? (
                          <Globe size={12} />
                        ) : (
                          <Lock size={12} />
                        )}

                        {isPublished ? 'Published' : 'Draft'}
                      </span>
                    </div>

                    <div
                      style={{
                        fontSize: '0.78rem',
                        color: '#64748b',
                        marginTop: 2,
                      }}
                    >
                      {paper.examTerm} · {paper.academicYear} ·{' '}
                      {paper.totalMarks} marks · {paper.durationInMin} min
                    </div>
                  </div>

                  {/* Edit (only shown for draft papers) */}
                  {!isPublished && (
                    <button
                      type="button"
                      className="sp-tab"
                      onClick={() =>
                        navigate(
                          `/staff/paper-builder/${paper.paperId}`,
                        )
                      }
                      style={{
                        fontSize: '0.82rem',
                        padding: '0.35rem 0.75rem',
                        background: '#fff',
                        color: '#8f240b',
                        boxShadow:
                          '0 1px 4px rgba(0,0,0,0.08)',
                      }}
                    >
                      <Pencil size={13} />
                      Edit
                    </button>
                  )}

                  {/* Publish / Unpublish */}
                  <button
                    type="button"
                    className={`sp-tab ${
                      isPublished ? 'sp-publish-on' : ''
                    }`}
                    onClick={() => togglePublished(paper)}
                    disabled={
                      updating &&
                      publishMutation.variables?.paperId ===
                        paper.paperId
                    }
                    style={{
                      fontSize: '0.82rem',
                      padding: '0.35rem 0.75rem',
                      background: isPublished
                        ? '#047857'
                        : '#fff',
                      color: isPublished
                        ? '#fff'
                        : '#475569',
                      boxShadow:
                        '0 1px 4px rgba(0,0,0,0.08)',
                    }}
                    title={
                      isPublished
                        ? 'Students can take this paper. Click to unpublish.'
                        : 'Students cannot take this paper yet. Click to publish.'
                    }
                  >
                    {updating &&
                    publishMutation.variables?.paperId ===
                      paper.paperId ? (
                      <Loader2
                        size={13}
                        className="sp-spin"
                      />
                    ) : isPublished ? (
                      <Lock size={13} />
                    ) : (
                      <Globe size={13} />
                    )}

                    {isPublished
                      ? 'Unpublish'
                      : 'Publish'}
                  </button>

                  {/* Student Link */}
                  {isPublished && studentLink && (
                    <button
                      type="button"
                      className="sp-tab"
                      onClick={() =>
                        copyStudentLink(
                          studentLink,
                          paper.paperId,
                        )
                      }
                      title={
                        isCopied
                          ? 'Student link copied'
                          : 'Copy student answer link'
                      }
                      style={{
                        fontSize: '0.82rem',
                        padding: '0.35rem 0.75rem',
                        background: '#fff',
                        color: isCopied
                          ? '#16a34a'
                          : '#0f766e',
                        boxShadow:
                          '0 1px 4px rgba(0,0,0,0.08)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      {isCopied ? (
                        <>
                          <span
                            style={{
                              fontSize: '14px',
                              fontWeight: 700,
                            }}
                          >
                            ✓
                          </span>
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy size={14} />
                          Student link
                        </>
                      )}
                    </button>
                  )}

                  {/* Delete */}
                  <button
                    type="button"
                    className="sp-icon-btn"
                    onClick={() =>
                      handleDelete(paper.paperId)
                    }
                    title="Delete paper"
                    style={{
                      color: '#ef4444',
                    }}
                    disabled={deleteMutation.isPending}
                  >
                    {deleteMutation.isPending &&
                    deleteMutation.variables ===
                      paper.paperId ? (
                      <Loader2
                        size={14}
                        className="sp-spin"
                      />
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