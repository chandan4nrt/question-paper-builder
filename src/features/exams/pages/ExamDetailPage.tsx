import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import {
  useExam,
  useExamBlueprint,
  useExamQuestions,
  useSaveBlueprint,
  useGenerateQuestions,
  useAddExamQuestion,
  useRemoveExamQuestion,
  useFinalizeExam,
  useArchiveExam,
} from '../hooks/useExams';
import { AddQuestionModal } from '../components/AddQuestionModal';
import { ExamStatusBadge } from '../components/ExamStatusBadge';
import { extractErrorMessage } from '../../../services/api';
import { getStoredProfile } from '../../auth/hooks/useAuth';
import type { ExamBlueprintItem, GenerateQuestionsPayload } from '../types/exam';
import type { QuestionResponse } from '../../question-bank/types/question';

const QUESTION_TYPES = [
  'MCQ', 'MULTIPLE_SELECT', 'TRUE_FALSE', 'FILL_IN_THE_BLANK', 'MATCH_THE_FOLLOWING',
  'ONE_WORD', 'SHORT_ANSWER', 'LONG_ANSWER', 'IMAGE_BASED', 'IDENTIFY_AND_NAME', 'ARRANGE_IN_ORDER',
];

const EMPTY_ITEM: ExamBlueprintItem = {
  sectionName: '',
  questionType: 'MCQ',
  numberOfQuestions: 1,
  marksPerQuestion: 1,
  displayOrder: 1,
};

function isReuseConflict(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 409;
}

export function ExamDetailPage() {
  const { id } = useParams();
  const examId = Number(id);

  const { data: exam, isLoading: examLoading } = useExam(examId);
  const { data: blueprint } = useExamBlueprint(examId);
  const { data: questions, isLoading: questionsLoading } = useExamQuestions(examId);

  const [items, setItems] = useState<ExamBlueprintItem[]>(blueprint?.items ?? []);
  const [genSettings, setGenSettings] = useState<GenerateQuestionsPayload>({
    avoidPreviousAcademicYear: true,
    avoidPreviousTwoAcademicYears: false,
    avoidCurrentAcademicYear: false,
  });
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [pendingReuse, setPendingReuse] = useState<{
    question: QuestionResponse;
    marks: number;
    sectionName: string;
  } | null>(null);

  const saveBlueprintMutation = useSaveBlueprint(examId);
  const generateMutation = useGenerateQuestions(examId);
  const addMutation = useAddExamQuestion(examId);
  const removeMutation = useRemoveExamQuestion(examId);
  const finalizeMutation = useFinalizeExam(examId);
  const archiveMutation = useArchiveExam(examId);

  const profile = getStoredProfile();
  const canManage = profile?.role === 'ADMIN' || profile?.role === 'REVIEWER';
  const isDraft = exam?.status === 'DRAFT';

  const addError =
    addMutation.isError && !isReuseConflict(addMutation.error)
      ? extractErrorMessage(addMutation.error)
      : undefined;

  const displayItems = items.length > 0 ? items : blueprint?.items ?? [];

  function updateItem(index: number, patch: Partial<ExamBlueprintItem>) {
    const base = items.length > 0 ? items : blueprint?.items ?? [];
    const next = base.map((item, i) => (i === index ? { ...item, ...patch } : item));
    setItems(next);
  }

  function addItem() {
    const base = items.length > 0 ? items : blueprint?.items ?? [];
    setItems([...base, { ...EMPTY_ITEM, displayOrder: base.length + 1 }]);
  }

  function removeItem(index: number) {
    const base = items.length > 0 ? items : blueprint?.items ?? [];
    setItems(base.filter((_, i) => i !== index));
  }

  function handleAdd(question: QuestionResponse, marks: number, sectionName: string) {
    addMutation.mutate(
      { questionId: question.id, marks, sectionName: sectionName || undefined },
      {
        onError: (err) => {
          if (isReuseConflict(err)) {
            setPendingReuse({ question, marks, sectionName });
          }
        },
      }
    );
  }

  function confirmReuse() {
    if (!pendingReuse) return;
    addMutation.mutate({
      questionId: pendingReuse.question.id,
      confirmReuse: true,
      marks: pendingReuse.marks,
      sectionName: pendingReuse.sectionName || undefined,
    });
    setPendingReuse(null);
  }

  if (examLoading || !exam) return <div className="loading"><span className="spinner" /> Loading…</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>{exam.name}</h1>
          <p>
            {exam.className} · {exam.subjectName} · {exam.examType.replace('_', ' ')} ·{' '}
            {exam.academicYearLabel} · {exam.totalMarks ?? 0} marks
            {exam.duration ? ` · ${exam.duration} min` : ''}
          </p>
        </div>
        <ExamStatusBadge status={exam.status} />
      </div>

      <div className="button-row" style={{ marginBottom: '1.5rem' }}>
        <Link to={`/staff/exams/${examId}/preview`}><button className="btn-secondary">Preview</button></Link>
        {canManage && <Link to={`/staff/exams/${examId}/answer-key`}><button className="btn-secondary">Answer Key</button></Link>}
        {canManage && isDraft && (
          <button onClick={() => finalizeMutation.mutate()} disabled={finalizeMutation.isPending}>
            {finalizeMutation.isPending ? 'Finalizing…' : 'Finalize'}
          </button>
        )}
        {profile?.role === 'ADMIN' && exam.status !== 'ARCHIVED' && (
          <button className="btn-danger" onClick={() => archiveMutation.mutate()} disabled={archiveMutation.isPending}>
            Archive
          </button>
        )}
      </div>
      {(finalizeMutation.isError || archiveMutation.isError) && (
        <div className="alert alert-error">{extractErrorMessage(finalizeMutation.error ?? archiveMutation.error)}</div>
      )}

      {isDraft && canManage && (
        <section className="card" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ marginTop: 0 }}>Blueprint</h2>
          {displayItems.map((item, index) => (
            <div key={index} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                className="text-input"
                placeholder="Section name"
                value={item.sectionName}
                onChange={(e) => updateItem(index, { sectionName: e.target.value })}
                style={{ width: 170 }}
              />
              <select value={item.questionType} onChange={(e) => updateItem(index, { questionType: e.target.value })}>
                {QUESTION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <input
                type="number"
                min={1}
                value={item.numberOfQuestions}
                onChange={(e) => updateItem(index, { numberOfQuestions: Number(e.target.value) })}
                style={{ width: 60 }}
                title="Number of questions"
              />
              <span className="muted">×</span>
              <input
                type="number"
                step="0.5"
                value={item.marksPerQuestion}
                onChange={(e) => updateItem(index, { marksPerQuestion: Number(e.target.value) })}
                style={{ width: 60 }}
                title="Marks per question"
              />
              <button type="button" className="btn-danger btn-sm" onClick={() => removeItem(index)}>Remove</button>
            </div>
          ))}
          <div className="button-row" style={{ marginTop: '0.5rem' }}>
            <button type="button" className="btn-ghost" onClick={addItem}>+ Add Blueprint Line</button>
            <button
              type="button"
              onClick={() => saveBlueprintMutation.mutate(displayItems.map((it, i) => ({ ...it, displayOrder: i + 1 })))}
              disabled={saveBlueprintMutation.isPending || displayItems.length === 0}
            >
              {saveBlueprintMutation.isPending ? 'Saving…' : 'Save Blueprint'}
            </button>
          </div>
          {saveBlueprintMutation.isError && (
            <div className="alert alert-error">{extractErrorMessage(saveBlueprintMutation.error)}</div>
          )}

          <h3>Automatic Generation</h3>
          <label className="kbd-chip" style={{ display: 'block', width: '100%', marginBottom: '0.35rem', background: 'transparent', color: 'inherit', padding: 0 }}>
            <input
              type="checkbox"
              checked={genSettings.avoidPreviousAcademicYear}
              onChange={(e) => setGenSettings((s) => ({ ...s, avoidPreviousAcademicYear: e.target.checked }))}
              style={{ marginRight: '0.5rem' }}
            />
            Avoid Previous Academic Year
          </label>
          <label className="kbd-chip" style={{ display: 'block', width: '100%', marginBottom: '0.35rem', background: 'transparent', color: 'inherit', padding: 0 }}>
            <input
              type="checkbox"
              checked={genSettings.avoidPreviousTwoAcademicYears}
              onChange={(e) => setGenSettings((s) => ({ ...s, avoidPreviousTwoAcademicYears: e.target.checked }))}
              style={{ marginRight: '0.5rem' }}
            />
            Avoid Previous 2 Academic Years
          </label>
          <label className="kbd-chip" style={{ display: 'block', width: '100%', marginBottom: '0.35rem', background: 'transparent', color: 'inherit', padding: 0 }}>
            <input
              type="checkbox"
              checked={genSettings.avoidCurrentAcademicYear}
              onChange={(e) => setGenSettings((s) => ({ ...s, avoidCurrentAcademicYear: e.target.checked }))}
              style={{ marginRight: '0.5rem' }}
            />
            Avoid Current Academic Year
          </label>
          <div className="button-row" style={{ marginTop: '0.5rem' }}>
            <button onClick={() => generateMutation.mutate(genSettings)} disabled={generateMutation.isPending}>
              {generateMutation.isPending ? 'Generating…' : 'Generate Questions'}
            </button>
            <button className="btn-secondary" onClick={() => setAddModalOpen(true)}>
              + Add Question Manually
            </button>
          </div>

          {generateMutation.data && !generateMutation.data.complete && (
            <div className="alert alert-warning" style={{ marginTop: '0.75rem' }}>
              <strong>Blueprint not fully satisfied:</strong>
              <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.25rem' }}>
                {generateMutation.data.shortfalls.map((s, i) => (
                  <li key={i}>
                    {s.sectionName} — {s.questionType}
                    {s.difficulty ? ` (${s.difficulty})` : ''}: needed {s.requested}, only {s.available} available.
                    Add questions manually or adjust the blueprint.
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      <div className="page-header" style={{ marginTop: '1.5rem' }}>
        <h2 style={{ margin: 0 }}>Questions</h2>
        {isDraft && canManage && (
          <button className="btn-secondary btn-sm" onClick={() => setAddModalOpen(true)}>+ Add Question</button>
        )}
      </div>
      {questionsLoading && <div className="loading"><span className="spinner" /> Loading…</div>}
      {questions && questions.length === 0 && (
        <div className="empty-state">No questions added yet. Generate from a blueprint or add manually.</div>
      )}
      {questions && questions.length > 0 && (
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Section</th>
              <th>Question</th>
              <th>Type</th>
              <th>Marks</th>
              <th>Usage</th>
              {isDraft && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {questions.map((q) => (
              <tr key={q.examQuestionId}>
                <td>{q.questionOrder}</td>
                <td>{q.sectionName ?? '—'}</td>
                <td style={{ maxWidth: 320 }}>{q.questionText.slice(0, 80)}</td>
                <td>{q.questionType}</td>
                <td>{q.marks}</td>
                <td>
                  {q.usage.status === 'USED_PREVIOUS_YEAR'
                    ? <span><span className="badge status-rejected">Previous Year</span>{q.usage.previousYearHighlight && <span className="text-sm muted"> {q.usage.previousYearHighlight}</span>}</span>
                    : q.usage.status === 'NEVER_USED'
                    ? <span className="badge status-approved">Never Used</span>
                    : <span className="badge status-pending_review">Used Before</span>}
                </td>
                {isDraft && (
                  <td>
                    <button className="btn-danger btn-sm" onClick={() => removeMutation.mutate(q.questionId)} disabled={removeMutation.isPending}>
                      Remove
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {isDraft && canManage && addModalOpen && (
        <AddQuestionModal
          examClassId={exam.classId}
          examSubjectId={exam.subjectId}
          existingQuestionIds={questions?.map((q) => q.questionId) ?? []}
          onAdd={handleAdd}
          onClose={() => setAddModalOpen(false)}
          adding={addMutation.isPending}
          error={addError}
        />
      )}

      {pendingReuse && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 480 }}>
            <h3 style={{ marginTop: 0, color: '#b45309' }}>Confirm question reuse</h3>
            <div className="alert alert-warning" style={{ marginTop: 0 }}>
              This question was used in a previous academic year. Reusing it could reduce exam
              quality. Do you still want to add it?
            </div>
            <p style={{ whiteSpace: 'pre-wrap', background: '#fafafa', padding: '0.75rem', borderRadius: 6 }}>
              {pendingReuse.question.questionText}
            </p>
            <div className="button-row" style={{ justifyContent: 'flex-end' }}>
              <button className="btn-ghost" onClick={() => setPendingReuse(null)}>Cancel</button>
              <button
                onClick={confirmReuse}
                disabled={addMutation.isPending}
                className="btn-warning"
              >
                {addMutation.isPending ? 'Adding…' : 'Yes, add it anyway'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}