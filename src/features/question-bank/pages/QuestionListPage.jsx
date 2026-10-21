import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Pencil, ArrowUp, ArrowDown, FolderPlus, X, Eye, Search, RotateCcw } from 'lucide-react';
import { useListPapers } from '../../set-paper/hooks/useQuestionPapers';
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

function flattenQuestions(papers) {
  const rows = [];
  for (const paper of papers ?? []) {
    let template = paper.template;
    if (typeof template === 'string') {
      try {
        template = JSON.parse(template);
      } catch (e) {
        template = {};
      }
    }
    if (!template || typeof template !== 'object') {
      if (Array.isArray(paper.questions) || paper.sections) {
        template = {
          questions: paper.questions,
          sections: paper.sections,
          urls: paper.urls,
        };
      } else {
        template = {};
      }
    }
    const rawQuestions = template.sections?.length
      ? template.sections.flatMap((s) => s?.questions ?? [])
      : (template.questions ?? []);
    const urlMap = template.urls ?? paper.urls ?? {};
    for (const raw of rawQuestions) {
      if (!raw) continue;
      const subText = raw.subQuestions?.[0]?.subQuestion ?? '';
      const qText = subText || raw.text || raw.questionText || raw.questionTitle || '(untitled question)';
      rows.push({
        key: `${paper.paperId}-${raw.questionId}`,
        questionText: qText,
        type: raw.type ?? 'normal',
        marks: Number(raw.totalMarks ?? 0),
        paperId: paper.paperId,
        paperTitle: template.title || `${paper.subject ?? ''} ${paper.classLevel ?? ''}`.trim(),
        subject: paper.subject ?? '',
        className: paper.classLevel ?? '',
        status: paper.status,
        question: deserializeQuestion(raw, urlMap),
      });
    }
  }
  return rows;
}

function uniqueValues(rows, key) {
  return [...new Set(rows.map((row) => String(row[key] ?? '').trim()).filter(Boolean))].sort();
}

const SORTABLE = ['questionText', 'className', 'subject', 'type', 'marks'];

export function QuestionListPage() {
  const papersQuery = useListPapers();
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [marksFilter, setMarksFilter] = useState('');
  const [sortKey, setSortKey] = useState('className');
  const [sortDir, setSortDir] = useState('asc');
  const [selectedKeys, setSelectedKeys] = useState(() => new Set());
  const [expandedKeys, setExpandedKeys] = useState(() => new Set());
  const [showAddModal, setShowAddModal] = useState(false);

  function toggleExpand(key) {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const rows = useMemo(() => flattenQuestions(papersQuery.data), [papersQuery.data]);

  const byType = typeFilter ? rows.filter((r) => r.type === typeFilter) : rows;
  const byClass = classFilter ? byType.filter((r) => r.className === classFilter) : byType;
  const bySubject = subjectFilter ? byClass.filter((r) => r.subject === subjectFilter) : byClass;
  const byMarks = marksFilter ? bySubject.filter((r) => Number(r.marks) === Number(marksFilter)) : bySubject;

  const classOptions = uniqueValues(byType, 'className');
  const subjectOptions = uniqueValues(byClass, 'subject');
  const marksOptions = uniqueValues(byMarks, 'marks').sort((a, b) => Number(a) - Number(b));
  const typeOptions = uniqueValues(rows, 'type');

  const filtered = byMarks.filter((row) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      row.questionText.toLowerCase().includes(q) ||
      row.subject.toLowerCase().includes(q) ||
      row.className.toLowerCase().includes(q)
    );
  });

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

  const selectedRows = rows.filter((row) => selectedKeys.has(row.key));
  const allFilteredSelected = filtered.length > 0 && filtered.every((row) => selectedKeys.has(row.key));

  function toggleRow(key) {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleAll() {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) {
        filtered.forEach((row) => next.delete(row.key));
      } else {
        filtered.forEach((row) => next.add(row.key));
      }
      return next;
    });
  }

  function clearSelection() {
    setSelectedKeys(new Set());
  }

  const hasActiveFilters = Boolean(search || classFilter || subjectFilter || typeFilter || marksFilter);

  function resetAllFilters() {
    setSearch('');
    setClassFilter('');
    setSubjectFilter('');
    setTypeFilter('');
    setMarksFilter('');
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
          <p>Questions saved in your question papers.</p>
        </div>
      </div>

      <div className="qb-filter-card">
        <div className="qb-search-input-wrap">
          <Search size={16} className="qb-search-icon" />
          <input
            type="text"
            className="qb-search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search questions, subject or class…"
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
          <select
            className={`qb-filter-select${typeFilter ? ' is-active' : ''}`}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">All Types</option>
            {typeOptions.map((o) => (
              <option key={o} value={o}>
                {TYPE_LABELS[o] ?? o.replace('_', ' ')}
              </option>
            ))}
          </select>
          <select
            className={`qb-filter-select${marksFilter ? ' is-active' : ''}`}
            value={marksFilter}
            onChange={(e) => setMarksFilter(e.target.value)}
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
          {filtered.length} {filtered.length === 1 ? 'question' : 'questions'}
        </div>
      </div>

      {selectedKeys.size > 0 && (
        <div className="selection-bar qb-selection-bar-sticky">
          <span><strong>{selectedKeys.size}</strong> question{selectedKeys.size === 1 ? '' : 's'} selected</span>
          <button type="button" className="btn-secondary btn-sm" onClick={() => setShowAddModal(true)}>
            <FolderPlus size={13} style={{ verticalAlign: 'middle' }} /> Add to Paper
          </button>
          <button type="button" className="btn-ghost btn-sm" onClick={clearSelection}>
            <X size={13} style={{ verticalAlign: 'middle' }} /> Clear
          </button>
        </div>
      )}

      {papersQuery.isLoading && <div className="loading"><span className="spinner" /> Loading questions…</div>}
      {papersQuery.isError && <div className="alert alert-error">Could not load question papers.</div>}

      {!papersQuery.isLoading && !papersQuery.isError && sorted.length === 0 && (
        <div className="empty-state">No questions match your filters.</div>
      )}

      {sorted.length > 0 && (
        <div className="qb-table-wrap">
          <table className="data-table qb-table">
            <thead>
              <tr>
                <th style={{ width: 36 }}>
                  <input
                    type="checkbox"
                    checked={allFilteredSelected}
                    onChange={toggleAll}
                    aria-label="Select all filtered questions"
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
              {sorted.map((row) => {
                const isExpanded = expandedKeys.has(row.key);
                const hasExtraDetails = Boolean(row.question?.solution || (row.question?.answers?.length > 0));

                return (
                  <tr key={row.key} className={selectedKeys.has(row.key) ? 'row-selected' : undefined}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedKeys.has(row.key)}
                        onChange={() => toggleRow(row.key)}
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
                              <div style={{ marginTop: '0.25rem' }}>
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
                            <Eye size={13} style={{ verticalAlign: 'middle' }} /> {isExpanded ? 'Hide' : 'View'}
                          </button>
                        )}
                        <Link to={`/staff/paper-builder/${row.paperId}`}>
                          <button className="btn-secondary btn-sm"><Pencil size={13} style={{ verticalAlign: 'middle' }} /> Open Paper</button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showAddModal && (
        <AddToPaperModal
          rows={selectedRows}
          papers={papersQuery.data ?? []}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
}