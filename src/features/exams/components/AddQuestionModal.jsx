import { useEffect, useState } from 'react';
import { useQuestionList } from '../../question-bank/hooks/useQuestions';

const QUESTION_TYPES = [
  'MCQ', 'MULTIPLE_SELECT', 'TRUE_FALSE', 'FILL_IN_THE_BLANK', 'MATCH_THE_FOLLOWING',
  'ONE_WORD', 'SHORT_ANSWER', 'LONG_ANSWER', 'IMAGE_BASED', 'IDENTIFY_AND_NAME', 'ARRANGE_IN_ORDER',
];

export function AddQuestionModal({
  examClassId,
  examSubjectId,
  existingQuestionIds,
  onAdd,
  onClose,
  adding,
  error,
}) {
  const [search, setSearch] = useState('');
  const [questionType, setQuestionType] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading } = useQuestionList({
    search: search || undefined,
    classId: examClassId,
    subjectId: examSubjectId,
    status: 'APPROVED',
    questionType: questionType || undefined,
    page,
    limit,
  });

  useEffect(() => setPage(1), [search, questionType]);

  const available = (data?.items ?? []).filter((q) => !existingQuestionIds.includes(q.id));
  const selected = (data?.items ?? []).find((q) => q.id === selectedId);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add Question from Question Bank</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="button-row" style={{ marginBottom: '1rem' }}>
          <input
            placeholder="Search questions…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1, minWidth: 180 }}
          />
          <select value={questionType} onChange={(e) => setQuestionType(e.target.value)}>
            <option value="">All types</option>
            {QUESTION_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {isLoading && <div className="loading"><span className="spinner" /> Loading questions…</div>}
        {!isLoading && available.length === 0 && (
          <div className="empty-state">
            No approved questions found matching this class and subject. Try adjusting the search.
          </div>
        )}
        {!isLoading && available.length > 0 && (
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 40 }} />
                <th>Question</th>
                <th>Type</th>
                <th>Marks</th>
              </tr>
            </thead>
            <tbody>
              {available.map((q) => (
                <tr
                  key={q.id}
                  onClick={() => setSelectedId(q.id)}
                  style={{ cursor: 'pointer', background: selectedId === q.id ? 'var(--primary-soft)' : undefined }}
                >
                  <td>
                    <input type="radio" name="question" checked={selectedId === q.id} readOnly />
                  </td>
                  <td style={{ maxWidth: 380 }}>{q.questionText.slice(0, 100)}</td>
                  <td>{q.questionType}</td>
                  <td>{q.marks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {data && data.totalPages > 1 && (
          <div className="pagination">
            <button className="btn-ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</button>
            <span>Page {data.page} of {data.totalPages}</span>
            <button className="btn-ghost" disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
          </div>
        )}

        {selected && (
          <div className="card" style={{ marginTop: '1rem', background: '#fafafa' }}>
            <strong>Selected question</strong>
            <p style={{ margin: '0.25rem 0', whiteSpace: 'pre-wrap' }}>{selected.questionText}</p>
            <div className="button-row" style={{ marginTop: '0.75rem', alignItems: 'flex-end' }}>
              <label className="field" style={{ marginBottom: 0, flex: '0 0 auto' }}>
                <span>Marks</span>
                <input
                  type="number"
                  min={0}
                  step="0.5"
                  defaultValue={selected.marks}
                  onChange={() => { /* read at submit */ }}
                  id="add-question-marks"
                  style={{ width: 80 }}
                />
              </label>
              <label className="field" style={{ marginBottom: 0, flex: 1 }}>
                <span>Section name</span>
                <input
                  id="add-question-section"
                  placeholder="Optional"
                  style={{ width: '100%' }}
                />
              </label>
              <button
                onClick={() => {
                  const marksInput = document.getElementById('add-question-marks');
                  const sectionInput = document.getElementById('add-question-section');
                  onAdd(
                    selected,
                    Number(marksInput?.value ?? selected.marks),
                    sectionInput?.value?.trim() ?? ''
                  );
                }}
                disabled={adding}
              >
                {adding ? 'Adding…' : 'Add Question'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}