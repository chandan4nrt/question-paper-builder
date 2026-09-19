import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Pencil, ArrowUp, ArrowDown, FolderPlus, X } from 'lucide-react';
import { useListPapers } from '../../set-paper/hooks/useQuestionPapers';
import { deserializeQuestion } from '../../set-paper/deserializePaper';
import { AddToPaperModal } from '../components/AddToPaperModal';

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
    const rawQuestions = paper.template?.sections?.length
      ? paper.template.sections.flatMap((s) => s.questions ?? [])
      : (paper.template?.questions ?? []);
    const urlMap = paper.template?.urls ?? {};
    for (const raw of rawQuestions) {
      const subText = raw.subQuestions?.[0]?.subQuestion ?? '';
      rows.push({
        key: `${paper.paperId}-${raw.questionId}`,
        questionText: raw.questionTitle || subText || '(untitled question)',
        type: raw.type ?? 'normal',
        marks: Number(raw.totalMarks ?? 0),
        paperId: paper.paperId,
        paperTitle: paper.template?.title || `${paper.subject ?? ''} ${paper.classLevel ?? ''}`.trim(),
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
  const [showAddModal, setShowAddModal] = useState(false);

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

      <div className="button-row qb-filter-bar">
        <input placeholder="Search question, subject or class…" onChange={(e) => setSearch(e.target.value)} />
        <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
          <option value="">All Classes</option>
          {classOptions.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        <select value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)}>
          <option value="">All Subjects</option>
          {subjectOptions.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="">All Types</option>
          {typeOptions.map((o) => <option key={o} value={o}>{TYPE_LABELS[o] ?? o.replace('_', ' ')}</option>)}
        </select>
        <select value={marksFilter} onChange={(e) => setMarksFilter(e.target.value)}>
          <option value="">All Marks</option>
          {marksOptions.map((o) => <option key={o} value={o}>{o} mark{o === '1' ? '' : 's'}</option>)}
        </select>
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
            {sorted.map((row) => (
              <tr key={row.key} className={selectedKeys.has(row.key) ? 'row-selected' : undefined}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedKeys.has(row.key)}
                    onChange={() => toggleRow(row.key)}
                    aria-label={`Select ${row.questionText.slice(0, 60)}`}
                  />
                </td>
                <td style={{ maxWidth: 340 }}>
                  <strong>{row.questionText.slice(0, 100)}</strong>
                  {row.paperTitle && <div className="muted text-sm" style={{ marginTop: '0.15rem' }}>{row.paperTitle}</div>}
                </td>
                <td>{row.className}</td>
                <td>{row.subject}</td>
                <td>{TYPE_LABELS[row.type] ?? row.type.replace('_', ' ')}</td>
                <td>{row.marks}</td>
                <td>
                  <div className="row-actions">
                    <Link to={`/staff/paper-builder/${row.paperId}`}>
                      <button className="btn-secondary btn-sm"><Pencil size={13} style={{ verticalAlign: 'middle' }} /> Open Paper</button>
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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