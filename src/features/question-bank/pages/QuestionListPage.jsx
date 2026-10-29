import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Pencil,
  ArrowUp,
  ArrowDown,
  FolderPlus,
  X,
  Eye,
  Search,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { useQuestionBank, useListPapers } from '../../set-paper/hooks/useQuestionPapers';
import { deserializeQuestion } from '../../set-paper/deserializePaper';
import { AddToPaperModal } from '../components/AddToPaperModal';
import { MathText } from '../../set-paper/components/MathText';

const TYPE_LABELS = {
  normal: 'Normal',
  'multiple-choice': 'MCQ',
  'fill-in-the-blank': 'Fill in the Blanks',
  'matching-picture': 'Match the Following',
  'true-false': 'True / False',
  'color-the-image': 'Image-MCQ',
  'label-picture': 'Picture Labeling',
  'writing-practice': 'Writing Practice',
};

function getPageNumbers(currentPage, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i);
  }
  const pages = [];
  if (currentPage <= 3) {
    pages.push(0, 1, 2, 3, 4, '...', totalPages - 1);
  } else if (currentPage >= totalPages - 4) {
    pages.push(0, '...', totalPages - 5, totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1);
  } else {
    pages.push(0, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages - 1);
  }
  return pages;
}

const SORTABLE = ['questionText', 'className', 'subject', 'type', 'marks'];

export function QuestionListPage() {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [marksFilter, setMarksFilter] = useState('');
  const [sortKey, setSortKey] = useState('className');
  const [sortDir, setSortDir] = useState('asc');
  const [selectedKeys, setSelectedKeys] = useState(() => new Set());
  const [selectedRowsMap, setSelectedRowsMap] = useState(() => new Map());
  const [expandedKeys, setExpandedKeys] = useState(() => new Set());
  const [showAddModal, setShowAddModal] = useState(false);

  // Server-side paginated question-bank query
  const questionBankQuery = useQuestionBank({
    page,
    size: pageSize,
    subject: subjectFilter || undefined,
    classLevel: classFilter || undefined,
    questionType: typeFilter || undefined,
    search: search.trim() || undefined,
  });

  // Query papers for AddToPaperModal and dynamic subject/class options
  const papersQuery = useListPapers();
  const papers = useMemo(() => papersQuery.data ?? [], [papersQuery.data]);

  function toggleExpand(key) {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const qbData = questionBankQuery.data;
  const content = useMemo(() => {
    if (!qbData) return [];
    if (Array.isArray(qbData.content)) return qbData.content;
    if (Array.isArray(qbData)) return qbData;
    return [];
  }, [qbData]);

  const rows = useMemo(() => {
    return content.map((item, index) => {
      const rawQ = item.question || item;
      const urls = item.urls || rawQ.urls || {};
      const q = deserializeQuestion(rawQ, urls);

      const rawSubQuestions = Array.isArray(rawQ.subQuestions)
        ? rawQ.subQuestions
        : (Array.isArray(rawQ.sub_questions) ? rawQ.sub_questions : []);
      const firstSub = rawSubQuestions[0];
      const subText = typeof firstSub === 'string' ? firstSub : (firstSub?.subQuestion ?? firstSub?.text ?? '');
      const qText = subText || rawQ.text || rawQ.questionText || rawQ.questionTitle || '(untitled question)';

      const subject = item.subject || rawQ.subject || '';
      const className = item.classLevel || item.className || rawQ.classLevel || '';
      const qType = item.questionType || rawQ.type || 'normal';
      const marks = Number(rawQ.totalMarks ?? rawQ.marks ?? 0);
      const paperId = item.paperId || rawQ.paperId || null;
      const paperTitle = item.paperTitle || rawQ.paperTitle || '';

      const idPart = item.id ?? rawQ.id ?? rawQ.questionId ?? index;
      const key = `${paperId || 'qb'}-${idPart}-${page * pageSize + index}`;

      return {
        key,
        questionText: qText,
        type: qType,
        marks,
        paperId,
        paperTitle,
        subject,
        className,
        status: item.status,
        question: q || {
          id: idPart,
          type: qType,
          text: qText,
          marks,
          answers: firstSub?.answer ?? (Array.isArray(rawQ.answers) ? rawQ.answers : []),
          solution: rawQ.solution ?? '',
        },
      };
    });
  }, [content, page, pageSize]);

  // Client-side fallback filter for marks or search if needed
  const filtered = useMemo(() => {
    let result = rows;
    if (marksFilter) {
      result = result.filter((r) => Number(r.marks) === Number(marksFilter));
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.questionText.toLowerCase().includes(q) ||
          r.subject.toLowerCase().includes(q) ||
          r.className.toLowerCase().includes(q)
      );
    }
    return result;
  }, [rows, marksFilter, search]);

  const sorted = useMemo(() => {
    const next = [...filtered];
    next.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      let cmp;
      if (typeof av === 'number' && typeof bv === 'number') {
        cmp = av - bv;
      } else {
        cmp = String(av ?? '').localeCompare(String(bv ?? ''));
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return next;
  }, [filtered, sortKey, sortDir]);

  const paginatedRows = sorted;

  // Metadata from backend pagination response
  const totalQuestions = typeof qbData?.totalElements === 'number'
    ? qbData.totalElements
    : (marksFilter || search.trim() ? filtered.length : rows.length);

  const totalPages = typeof qbData?.totalPages === 'number'
    ? Math.max(1, qbData.totalPages)
    : Math.max(1, Math.ceil(totalQuestions / pageSize));

  const currentPage = Math.min(page, totalPages - 1);
  const isFirst = qbData?.first ?? (currentPage === 0);
  const isLast = qbData?.last ?? (currentPage >= totalPages - 1);

  const startIndex = totalQuestions === 0 ? 0 : currentPage * pageSize + 1;
  const endIndex = Math.min((currentPage + 1) * pageSize, totalQuestions);

  // Filter option lists
  const classOptions = useMemo(() => {
    const fromPapers = (papers ?? []).map((p) => String(p.classLevel ?? '').trim()).filter(Boolean);
    const fromRows = rows.map((r) => String(r.className ?? '').trim()).filter(Boolean);
    const common = ['Nursery', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
    const set = new Set([...fromPapers, ...fromRows, ...common]);
    return Array.from(set).sort((a, b) => {
      const na = parseInt(a, 10);
      const nb = parseInt(b, 10);
      if (!isNaN(na) && !isNaN(nb)) return na - nb;
      return a.localeCompare(b);
    });
  }, [papers, rows]);

  const subjectOptions = useMemo(() => {
    const fromPapers = (papers ?? []).map((p) => String(p.subject ?? '').trim()).filter(Boolean);
    const fromRows = rows.map((r) => String(r.subject ?? '').trim()).filter(Boolean);
    const common = ['English', 'Hindi', 'Maths', 'Science', 'Social Science', 'EVS'];
    const set = new Set([...fromPapers, ...fromRows, ...common]);
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [papers, rows]);

  const marksOptions = useMemo(() => {
    const fromRows = rows.map((r) => String(r.marks)).filter(Boolean);
    const common = ['1', '2', '3', '4', '5', '6', '8', '10', '15', '20'];
    const set = new Set([...fromRows, ...common]);
    return Array.from(set).sort((a, b) => Number(a) - Number(b));
  }, [rows]);

  const selectedRows = useMemo(() => Array.from(selectedRowsMap.values()), [selectedRowsMap]);
  const allCurrentPageSelected = paginatedRows.length > 0 && paginatedRows.every((row) => selectedKeys.has(row.key));

  function toggleRow(row) {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      const nextMap = new Map(selectedRowsMap);
      if (next.has(row.key)) {
        next.delete(row.key);
        nextMap.delete(row.key);
      } else {
        next.add(row.key);
        nextMap.set(row.key, row);
      }
      setSelectedRowsMap(nextMap);
      return next;
    });
  }

  function toggleAll() {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      const nextMap = new Map(selectedRowsMap);
      if (allCurrentPageSelected) {
        paginatedRows.forEach((row) => {
          next.delete(row.key);
          nextMap.delete(row.key);
        });
      } else {
        paginatedRows.forEach((row) => {
          next.add(row.key);
          nextMap.set(row.key, row);
        });
      }
      setSelectedRowsMap(nextMap);
      return next;
    });
  }

  function clearSelection() {
    setSelectedKeys(new Set());
    setSelectedRowsMap(new Map());
  }

  const hasActiveFilters = Boolean(search || classFilter || subjectFilter || typeFilter || marksFilter);

  function resetAllFilters() {
    setSearch('');
    setClassFilter('');
    setSubjectFilter('');
    setTypeFilter('');
    setMarksFilter('');
    setPage(0);
  }

  function handleFilterChange(setter) {
    return (e) => {
      setter(e.target.value);
      setPage(0);
    };
  }

  function handleSort(key) {
    if (sortKey === key) {
      setSortDir((dir) => (dir === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  function SortHeader({ label, column }) {
    return (
      <th>
        <button type="button" className="sort-header" onClick={() => handleSort(column)}>
          {label}
          {sortKey === column && (sortDir === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />)}
        </button>
      </th>
    );
  }

  return (
    <div className={`page qb-page${selectedKeys.size > 0 ? ' qb-has-selection' : ''}`}>
      <div className="page-header">
        <div>
          <h1>Question Bank</h1>
          <p>Browse, filter, and select questions to use in your papers.</p>
        </div>
      </div>

      <div className="qb-filter-card">
        <div className="qb-search-input-wrap">
          <Search size={16} className="qb-search-icon" />
          <input
            type="text"
            className="qb-search-input"
            value={search}
            onChange={handleFilterChange(setSearch)}
            placeholder="Search questions, subject or class…"
          />
          {search && (
            <button
              type="button"
              className="qb-search-clear"
              onClick={() => {
                setSearch('');
                setPage(0);
              }}
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
            onChange={handleFilterChange(setClassFilter)}
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
            onChange={handleFilterChange(setSubjectFilter)}
          >
            <option value="">All Subjects</option>
            {subjectOptions.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
          <select
            className={`qb-filter-select${typeFilter ? ' is-active' : ''}`}
            value={typeFilter}
            onChange={handleFilterChange(setTypeFilter)}
          >
            <option value="">All Types</option>
            {Object.entries(TYPE_LABELS).map(([val, label]) => (
              <option key={val} value={val}>
                {label}
              </option>
            ))}
          </select>
          <select
            className={`qb-filter-select${marksFilter ? ' is-active' : ''}`}
            value={marksFilter}
            onChange={handleFilterChange(setMarksFilter)}
          >
            <option value="">All Marks</option>
            {marksOptions.map((o) => (
              <option key={o} value={o}>
                {o} mark{o === '1' ? '' : 's'}
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
          {totalQuestions} {totalQuestions === 1 ? 'question' : 'questions'}
        </div>
      </div>

      {selectedKeys.size > 0 && (
        <div className="selection-bar qb-selection-bar-sticky">
          <span><strong>{selectedKeys.size}</strong> question{selectedKeys.size === 1 ? '' : 's'} selected</span>
          <button type="button" className="btn-secondary btn-sm" onClick={() => setShowAddModal(true)}>
            <FolderPlus size={13} className="icon-middle" /> Add to Paper
          </button>
          <button type="button" className="btn-ghost btn-sm" onClick={clearSelection}>
            <X size={13} className="icon-middle" /> Clear
          </button>
        </div>
      )}

      {questionBankQuery.isLoading && <div className="loading"><span className="spinner" /> Loading questions…</div>}
      {questionBankQuery.isError && <div className="alert alert-error">Could not load question bank.</div>}

      {!questionBankQuery.isLoading && !questionBankQuery.isError && sorted.length === 0 && (
        <div className="empty-state">No questions match your filters.</div>
      )}

      {sorted.length > 0 && (
        <div className="qb-table-wrap">
          <table className="data-table qb-table">
            <thead>
              <tr>
                <th className="col-checkbox">
                  <input
                    type="checkbox"
                    checked={allCurrentPageSelected}
                    onChange={toggleAll}
                    aria-label="Select all questions on this page"
                  />
                </th>
                <SortHeader label="Question" column="questionText" />
                <SortHeader label="Class" column="className" />
                <SortHeader label="Subject" column="subject" />
                <SortHeader label="Type" column="type" />
                <SortHeader label="Marks" column="marks" />
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((row) => {
                const isExpanded = expandedKeys.has(row.key);
                const hasExtraDetails = Boolean(row.question?.solution || (row.question?.answers?.length > 0));

                return (
                  <tr key={row.key} className={selectedKeys.has(row.key) ? 'row-selected' : undefined}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedKeys.has(row.key)}
                        onChange={() => toggleRow(row)}
                        aria-label={`Select ${row.questionText.slice(0, 60)}`}
                      />
                    </td>
                    <td className="qb-question-cell">
                      <div className="qb-question-content">
                        <strong className="qb-question-text">
                          <MathText>{row.questionText}</MathText>
                        </strong>

                        {/* Render MCQ options if present */}
                        {row.question?.options?.length > 0 && (
                          <div className="qb-row-options">
                            {row.question.options.map((opt, i) => (
                              <span key={opt.id || i} className="qb-option-pill">
                                <span className="qb-opt-letter">{String.fromCharCode(65 + i)}.</span>{' '}
                                <MathText>{opt.label}</MathText>
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Render sub-items (e.g. fill-in-blanks or true-false) if distinct */}
                        {row.question?.items?.length > 0 && row.question.items.some((it) => it && it !== row.questionText) && (
                          <div className="qb-subitems-list">
                            {row.question.items.slice(0, 3).map((it, i) => (
                              <div key={i} className="qb-subitem">
                                <span className="qb-subitem-bullet">•</span> <MathText>{it}</MathText>
                              </div>
                            ))}
                            {row.question.items.length > 3 && (
                              <span className="muted text-xs">+{row.question.items.length - 3} more</span>
                            )}
                          </div>
                        )}

                        {/* Render matching pairs if present */}
                        {row.question?.leftItems?.length > 0 && (
                          <div className="qb-row-options">
                            {row.question.leftItems.slice(0, 3).map((item, i) => (
                              <span key={item.id || i} className="qb-option-pill">
                                <span className="qb-opt-letter">{i + 1}.</span>{' '}
                                <MathText>{item.label || 'Item'}</MathText>
                              </span>
                            ))}
                            {row.question.leftItems.length > 3 && (
                              <span className="muted text-xs">+{row.question.leftItems.length - 3} more</span>
                            )}
                          </div>
                        )}

                        {/* Expanded Answer / Solution view */}
                        {isExpanded && (
                          <div className="qb-details-expanded">
                            {row.question?.answers?.length > 0 && (
                              <div>
                                <strong>Answer:</strong>{' '}
                                <MathText>{Array.isArray(row.question.answers) ? row.question.answers.join(', ') : String(row.question.answers)}</MathText>
                              </div>
                            )}
                            {row.question?.solution && (
                              <div className="qb-details-solution">
                                <strong>Solution:</strong>{' '}
                                <MathText>{row.question.solution}</MathText>
                              </div>
                            )}
                          </div>
                        )}

                        {row.paperTitle && (
                          <div className="qb-paper-title">
                            <MathText>{row.paperTitle}</MathText>
                          </div>
                        )}
                      </div>
                    </td>
                    <td>{row.className}</td>
                    <td>{row.subject}</td>
                    <td>{TYPE_LABELS[row.type] ?? row.type.replace('_', ' ')}</td>
                    <td>{row.marks}</td>
                    <td>
                      <div className="row-actions">
                        {hasExtraDetails && (
                          <button
                            type="button"
                            className="btn-ghost btn-sm"
                            onClick={() => toggleExpand(row.key)}
                            title={isExpanded ? 'Hide answers' : 'View answers'}
                          >
                            <Eye size={13} className="icon-middle" /> {isExpanded ? 'Hide' : 'View'}
                          </button>
                        )}
                        {row.paperId ? (
                          <Link to={`/staff/paper-builder/${row.paperId}`}>
                            <button className="btn-secondary btn-sm"><Pencil size={13} className="icon-middle" /> Open Paper</button>
                          </Link>
                        ) : (
                          <button
                            type="button"
                            className="btn-secondary btn-sm"
                            onClick={() => {
                              if (!selectedKeys.has(row.key)) {
                                toggleRow(row);
                              }
                              setShowAddModal(true);
                            }}
                          >
                            <FolderPlus size={13} className="icon-middle" /> Add to Paper
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Bar */}
      {!questionBankQuery.isLoading && !questionBankQuery.isError && totalPages > 0 && (
        <div className="qb-pagination-bar">
          <div className="qb-pagination-info">
            <span>
              Showing Questions <strong>{startIndex}–{endIndex}</strong> of <strong>{totalQuestions}</strong>{' '}
              <span className="muted">
                (Page {currentPage + 1} of {totalPages})
              </span>
            </span>
            {questionBankQuery.isFetching && (
              <span className="qb-pagination-fetching">
                <Loader2 size={13} className="sp-spin" /> Updating…
              </span>
            )}
          </div>

          <div className="qb-pagination-controls">
            <div className="qb-page-size-wrap">
              <span>Per page:</span>
              <select
                className="qb-page-size-select"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(0);
                }}
              >
                <option value={5}>5 questions</option>
                <option value={10}>10 questions</option>
                <option value={20}>20 questions</option>
                <option value={50}>50 questions</option>
              </select>
            </div>

            <button
              type="button"
              className="qb-page-btn"
              onClick={() => {
                setPage((p) => Math.max(0, p - 1));
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              disabled={isFirst || questionBankQuery.isFetching}
              title="Previous page"
            >
              <ChevronLeft size={14} className="icon-middle" /> Prev
            </button>

            <div className="qb-page-numbers">
              {getPageNumbers(currentPage, totalPages).map((p, idx) =>
                typeof p === 'number' ? (
                  <button
                    key={p}
                    type="button"
                    className={`qb-page-number-btn${p === currentPage ? ' is-active' : ''}`}
                    onClick={() => {
                      setPage(p);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    disabled={questionBankQuery.isFetching}
                  >
                    {p + 1}
                  </button>
                ) : (
                  <span key={`ellipsis-${idx}`} className="qb-page-ellipsis">
                    …
                  </span>
                )
              )}
            </div>

            <button
              type="button"
              className="qb-page-btn"
              onClick={() => {
                setPage((p) => Math.min(totalPages - 1, p + 1));
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              disabled={isLast || questionBankQuery.isFetching}
              title="Next page"
            >
              Next <ChevronRight size={14} className="icon-middle" />
            </button>
          </div>
        </div>
      )}

      {showAddModal && (
        <AddToPaperModal
          rows={selectedRows}
          papers={papers}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
}
