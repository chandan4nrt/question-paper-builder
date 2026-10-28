import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  RotateCcw,
  FileText,
  Plus,
  Pencil,
  Trash2,
  AlertTriangle,
  Loader2,
  Eye,
  Search,
  X,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { useListPapers, useDeletePaper } from '../hooks/useQuestionPapers';
import { PaperPreviewModal } from '../components/PaperPreviewModal';
import { extractErrorMessage } from '../../../services/api';

function uniqueValues(items, key) {
  return [...new Set(items.map((item) => String(item[key] ?? '').trim()).filter(Boolean))].sort();
}

function getPaperDisplayName(paper) {
  if (paper.paperName) {
    return paper.paperName;
  }
  const classPart = paper.classLevel ? paper.classLevel.replace(/\s+/g, '_') : '';
  const subjectPart = paper.subject ? paper.subject.replace(/\s+/g, '_') : '';

  if (classPart && subjectPart) {
    return `${classPart}_${subjectPart}`;
  }
  if (subjectPart) {
    return `${subjectPart}_Paper`;
  }
  if (classPart) {
    return `${classPart}_Paper`;
  }
  return 'Question_Paper';
}

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

function getRelativeTime(timestamp) {
  if (!timestamp) return '13 minutes ago';
  const diffMs = Date.now() - new Date(timestamp).getTime();
  if (isNaN(diffMs) || diffMs < 0) return 'Just now';
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minutes ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 30) return `${diffDays} days ago`;
  return new Date(timestamp).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
}

export function PaperListPage() {
  const navigate = useNavigate();
  const papersQuery = useListPapers();
  const deleteMutation = useDeletePaper();
  const [viewingPaper, setViewingPaper] = useState(null);
  const [paperToDelete, setPaperToDelete] = useState(null);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [termFilter, setTermFilter] = useState('');
  const [sortKey, setSortKey] = useState('updatedAt');
  const [sortDir, setSortDir] = useState('desc');
  const [toast, setToast] = useState(null);

  function flashToast(message, type = 'success') {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 4000);
  }

  function handleConfirmDelete() {
    if (!paperToDelete) return;
    if (paperToDelete.isSample) {
      flashToast('✅ Demo paper removed');
      setPaperToDelete(null);
      return;
    }
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

  const realPapers = papersQuery.data ?? [];

  // Default sample fallback when user has not created any papers yet
  const defaultSamplePaper = {
    paperId: 'sample-geography-8',
    paperName: 'Class_8_Geography',
    subject: 'Geography',
    classLevel: 'Class 8',
    examTerm: 'Half-Yearly',
    academicYear: '2026-2027',
    totalMarks: null,
    durationInMin: 90,
    status: 'Submitted',
    updatedAt: new Date(Date.now() - 13 * 60000).toISOString(),
    createdAt: new Date(Date.now() - 13 * 60000).toISOString(),
    isSample: true,
  };

  const allDisplayPapers = realPapers.length > 0 ? realPapers : [defaultSamplePaper];

  const classOptions = useMemo(() => uniqueValues(allDisplayPapers, 'classLevel'), [allDisplayPapers]);
  const subjectOptions = useMemo(() => uniqueValues(allDisplayPapers, 'subject'), [allDisplayPapers]);
  const termOptions = useMemo(() => uniqueValues(allDisplayPapers, 'examTerm'), [allDisplayPapers]);

  const hasActiveFilters = Boolean(search || classFilter || subjectFilter || statusFilter !== 'all' || termFilter);

  function resetAllFilters() {
    setSearch('');
    setClassFilter('');
    setSubjectFilter('');
    setStatusFilter('all');
    setTermFilter('');
  }

  const filteredPapers = useMemo(() => {
    return allDisplayPapers.filter((paper) => {
      if (statusFilter !== 'all' && paper.status !== statusFilter) return false;
      if (classFilter && String(paper.classLevel ?? '').trim() !== classFilter) return false;
      if (subjectFilter && String(paper.subject ?? '').trim() !== subjectFilter) return false;
      if (termFilter && String(paper.examTerm ?? '').trim() !== termFilter) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        const displayName = getPaperDisplayName(paper).toLowerCase();
        const subject = String(paper.subject ?? '').toLowerCase();
        const classLevel = String(paper.classLevel ?? '').toLowerCase();
        const examTerm = String(paper.examTerm ?? '').toLowerCase();
        if (!displayName.includes(q) && !subject.includes(q) && !classLevel.includes(q) && !examTerm.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [allDisplayPapers, search, classFilter, subjectFilter, statusFilter, termFilter]);

  const sortedPapers = useMemo(() => {
    const list = [...filteredPapers];
    list.sort((a, b) => {
      let av = a[sortKey];
      let bv = b[sortKey];

      if (sortKey === 'paperName') {
        av = getPaperDisplayName(a);
        bv = getPaperDisplayName(b);
      } else if (sortKey === 'updatedAt') {
        av = new Date(a.updatedAt || a.createdAt || 0).getTime();
        bv = new Date(b.updatedAt || b.createdAt || 0).getTime();
      } else if (sortKey === 'totalMarks') {
        av = Number(a.totalMarks ?? 0);
        bv = Number(b.totalMarks ?? 0);
      } else if (sortKey === 'examTerm') {
        av = a.examTerm ?? '';
        bv = b.examTerm ?? '';
      }

      let cmp;
      if (typeof av === 'number' && typeof bv === 'number') {
        cmp = av - bv;
      } else {
        cmp = String(av ?? '').localeCompare(String(bv ?? ''), undefined, { numeric: true, sensitivity: 'base' });
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [filteredPapers, sortKey, sortDir]);

  function handleSort(key) {
    if (sortKey === key) {
      setSortDir((dir) => (dir === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  function SortHeader({ label, column, className = '' }) {
    return (
      <th className={className}>
        <button type="button" className="sort-header" onClick={() => handleSort(column)}>
          {label}
          {sortKey === column && (sortDir === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />)}
        </button>
      </th>
    );
  }

  return (
    <div className="db-dashboard-container">
      <div className="db-max-width">
        {/* Simple Page Header */}
        <div className="page-header" style={{ position: 'static', background: 'transparent', padding: '0 0 1.25rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Paper Builder</h1>
            <p style={{ margin: '0.25rem 0 0', color: '#64748b', fontSize: '0.92rem' }}>
              Create, customize, and manage your school exam papers
            </p>
          </div>
          <button
            type="button"
            className="btn-primary"
            onClick={() => navigate('/staff/paper-builder/new')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem', borderRadius: '10px', fontWeight: 700 }}
          >
            <Plus size={16} /> New Paper
          </button>
        </div>

        {/* Main Section */}
        <main className="db-main-layout">
          {/* Filter Card (similar to question-bank) */}
          <div className="qb-filter-card" style={{ margin: '0 0 1rem' }}>
            <div className="qb-search-input-wrap">
              <Search size={16} className="qb-search-icon" />
              <input
                type="text"
                className="qb-search-input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search papers, subject or class…"
              />
              {search && (
                <button
                  type="button"
                  className="qb-search-clear"
                  onClick={() => setSearch('')}
                  title="Clear search"
                  aria-label="Clear search"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            <div className="qb-filters-group">
              <select
                className={`qb-filter-select${classFilter ? ' is-active' : ''}`}
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
              >
                <option value="">All Classes</option>
                {classOptions.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>

              <select
                className={`qb-filter-select${subjectFilter ? ' is-active' : ''}`}
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
              >
                <option value="">All Subjects</option>
                {subjectOptions.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>

              {/* <select
                className={`qb-filter-select${statusFilter !== 'all' ? ' is-active' : ''}`}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="Draft">Drafts</option>
                <option value="Submitted">Submitted</option>
              </select> */}

              <select
                className={`qb-filter-select${termFilter ? ' is-active' : ''}`}
                value={termFilter}
                onChange={(e) => setTermFilter(e.target.value)}
              >
                <option value="">All Terms</option>
                {termOptions.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>

              {hasActiveFilters && (
                <button
                  type="button"
                  className="qb-reset-filters-btn"
                  onClick={resetAllFilters}
                  title="Reset all filters"
                >
                  <RotateCcw size={13} /> Clear filters
                </button>
              )}
            </div>

            <div className="qb-results-count">
              {sortedPapers.length} {sortedPapers.length === 1 ? 'paper' : 'papers'}
            </div>
          </div>

          {/* Recent Papers Card */}
          <div className="db-card db-recent-papers-card">
            {/* Table */}
            <div className="db-table-wrapper">
              <table className="db-papers-table">
                <thead>
                  <tr>
                    <SortHeader label="PAPER" column="paperName" className="db-col-paper" />
                    <SortHeader label="CLASS" column="classLevel" className="db-col-class" />
                    <SortHeader label="SUBJECT" column="subject" className="db-col-subject" />
                    <SortHeader label="TERM" column="examTerm" className="db-col-term" />
                    <SortHeader label="MARKS" column="totalMarks" className="db-col-marks" />
                    <SortHeader label="STATUS" column="status" className="db-col-status" />
                    <th className="db-col-actions">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedPapers.length === 0 ? (
                    <tr>
                      <td colSpan={7}>
                        <div className="db-table-empty">
                          {hasActiveFilters ? (
                            <>
                              <p style={{ margin: 0, fontWeight: 600 }}>No papers match your search and filter criteria.</p>
                              <div>
                                <button
                                  type="button"
                                  className="qb-reset-filters-btn"
                                  onClick={resetAllFilters}
                                  style={{ marginTop: '0.75rem' }}
                                >
                                  <RotateCcw size={13} /> Clear all filters
                                </button>
                              </div>
                            </>
                          ) : (
                            <>
                              <p style={{ margin: 0, fontWeight: 600 }}>No papers found.</p>
                              <div>
                                <button
                                  type="button"
                                  className="db-table-empty-btn"
                                  onClick={() => navigate('/staff/paper-builder/new')}
                                  style={{ marginTop: '0.75rem' }}
                                >
                                  <Plus size={14} /> Create a Paper
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    sortedPapers.map((paper) => {
                      const displayName = getPaperDisplayName(paper);
                      const isDraft = paper.status === 'Draft';

                      return (
                        <tr key={paper.paperId} className="db-paper-row">
                          <td className="db-col-paper">
                            <div className="db-paper-title-cell">
                              <div className="db-paper-doc-icon">
                                <FileText size={16} />
                              </div>
                              <div className="db-paper-title-texts">
                                <span className="db-paper-name" title={displayName}>
                                  {displayName}
                                </span>
                                <span className="db-paper-time">
                                  {getRelativeTime(paper.updatedAt || paper.createdAt)}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="db-col-class">{paper.classLevel || '—'}</td>
                          <td className="db-col-subject">{paper.subject || '—'}</td>
                          <td className="db-col-term">{paper.examTerm || '—'}</td>
                          <td className="db-col-marks">{paper.totalMarks != null ? `${paper.totalMarks}` : '—'}</td>
                          <td className="db-col-status">
                            <span className={`db-status-badge ${isDraft ? 'is-draft' : 'is-submitted'}`}>
                              <span className="db-status-dot" />
                              {isDraft ? 'Draft' : 'Submitted'}
                            </span>
                          </td>
                          <td className="db-col-actions">
                            <div className="db-row-actions">
                              <button
                                type="button"
                                className="db-action-btn db-btn-pdf"
                                onClick={() => {
                                  if (paper.isSample) {
                                    flashToast('Opening sample paper preview...');
                                  }
                                  setViewingPaper(paper);
                                }}
                                title="Preview paper & PDF"
                              >
                                <Eye size={13} />
                              </button>
                              <button
                                type="button"
                                className="db-action-btn db-btn-edit"
                                onClick={() => {
                                  if (paper.isSample) {
                                    navigate('/staff/paper-builder/new');
                                  } else {
                                    navigate(`/staff/paper-builder/${paper.paperId}`);
                                  }
                                }}
                                title="Edit / Update paper"
                              >
                                <Pencil size={13} />
                              </button>
                              <button
                                type="button"
                                className="db-action-btn db-btn-delete"
                                onClick={() => setPaperToDelete(paper)}
                                title="Delete paper"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </main>
      </div>

      {/* Preview Paper Modal */}
      {viewingPaper && (
        <PaperPreviewModal
          paper={viewingPaper}
          onClose={() => setViewingPaper(null)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {paperToDelete && (
        <DeleteConfirmModal
          paper={paperToDelete}
          isDeleting={deleteMutation.isPending}
          onConfirm={handleConfirmDelete}
          onClose={() => !deleteMutation.isPending && setPaperToDelete(null)}
        />
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={`sp-toast sp-toast-${toast.type}`} role="status">
          {toast.message}
        </div>
      )}
    </div>
  );
}