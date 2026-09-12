import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuestionList, useDuplicateQuestion } from '../hooks/useQuestions';
import { StatusBadge, UsageBadge } from '../components/Badges';

const QUESTION_TYPES = [
  'MCQ',
  'MULTIPLE_SELECT',
  'TRUE_FALSE',
  'FILL_IN_THE_BLANK',
  'MATCH_THE_FOLLOWING',
  'ONE_WORD',
  'SHORT_ANSWER',
  'LONG_ANSWER',
  'IMAGE_BASED',
  'IDENTIFY_AND_NAME',
  'ARRANGE_IN_ORDER',
];
const DIFFICULTIES = ['EASY', 'MEDIUM', 'HARD'];
const LANGUAGES = ['HINDI', 'ENGLISH', 'BILINGUAL'];
const STATUSES = ['DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'ARCHIVED'];

export function QuestionListPage() {
  const [filters, setFilters] = useState({ page: 1, limit: 20 });
  const { data, isLoading, isError } = useQuestionList(filters);
  const duplicateMutation = useDuplicateQuestion();

  function updateFilter(key, value) {
    setFilters((prev) => ({ ...prev, [key]: value || undefined, page: 1 }));
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Question Bank</h1>
          <p>Browse, filter, and manage question bank items.</p>
        </div>
        <Link to="/staff/question-bank/new">
          <button>+ New Question</button>
        </Link>
      </div>

      <div className="button-row" style={{ margin: '1rem 0' }}>
        <input
          placeholder="Search question text…"
          onChange={(e) => updateFilter('search', e.target.value)}
        />
        <select onChange={(e) => updateFilter('questionType', e.target.value)}>
          <option value="">All Types</option>
          {QUESTION_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <select onChange={(e) => updateFilter('difficulty', e.target.value)}>
          <option value="">All Difficulties</option>
          {DIFFICULTIES.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <select onChange={(e) => updateFilter('language', e.target.value)}>
          <option value="">All Languages</option>
          {LANGUAGES.map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
        <select onChange={(e) => updateFilter('status', e.target.value)}>
          <option value="">All Statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s.replace('_', ' ')}</option>
          ))}
        </select>
      </div>

      {isLoading && <div className="loading"><span className="spinner" /> Loading questions…</div>}
      {isError && <div className="alert alert-error">Could not load questions.</div>}

      {data && (
        <>
          {data.items.length === 0 ? (
            <div className="empty-state">No questions match your filters.</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Question</th>
                  <th>Class</th>
                  <th>Subject</th>
                  <th>Type</th>
                  <th>Marks</th>
                  <th>Status</th>
                  <th>Usage</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((q) => (
                  <tr key={q.id}>
                    <td style={{ maxWidth: 300 }}>
                      <Link to={`/staff/question-bank/${q.id}`}><strong>{q.questionText.slice(0, 80)}</strong></Link>
                    </td>
                    <td>{q.className}</td>
                    <td>{q.subjectName}</td>
                    <td>{q.questionType.replace('_', ' ')}</td>
                    <td>{q.marks}</td>
                    <td><StatusBadge status={q.status} /></td>
                    <td><UsageBadge usage={q.usage} /></td>
                    <td>
                      <div className="row-actions">
                        <Link to={`/staff/question-bank/${q.id}/edit`}>
                          <button className="btn-secondary btn-sm">Edit</button>
                        </Link>
                        <button className="btn-ghost btn-sm" onClick={() => duplicateMutation.mutate(q.id)}>
                          Duplicate
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div className="pagination">
            <button
              className="btn-ghost"
              disabled={(filters.page ?? 1) <= 1}
              onClick={() => setFilters((p) => ({ ...p, page: (p.page ?? 1) - 1 }))}
            >
              Previous
            </button>
            <span>
              Page {data.page} of {data.totalPages} ({data.totalItems} total)
            </span>
            <button
              className="btn-ghost"
              disabled={data.page >= data.totalPages}
              onClick={() => setFilters((p) => ({ ...p, page: (p.page ?? 1) + 1 }))}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}