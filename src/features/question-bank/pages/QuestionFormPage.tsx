import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { questionFormSchema, type QuestionFormSchema } from '../schemas/questionSchema';
import { useChapters, useCreateQuestion, useQuestion, useSubjects, useTopics, useUpdateQuestion } from '../hooks/useQuestions';
import { extractErrorMessage } from '../../../services/api';
import type { QuestionType } from '../types/question';

// Classes and academic years aren't exposed via a list endpoint in the
// Phase 1 REST spec (only subjects/chapters/topics are). Hardcoded here to
// match the seeded values; swap for a real dropdown once
// GET /question-bank/classes and /academic-years exist.
const CLASSES = [
  { id: 1, name: 'Nursery' }, { id: 2, name: 'LKG' }, { id: 3, name: 'UKG' },
  { id: 4, name: 'Class 1' }, { id: 5, name: 'Class 2' }, { id: 6, name: 'Class 3' },
  { id: 7, name: 'Class 4' }, { id: 8, name: 'Class 5' },
];
const ACADEMIC_YEARS = [{ id: 1, label: '2025-26' }, { id: 2, label: '2026-27' }];

const QUESTION_TYPES: QuestionType[] = [
  'MCQ', 'MULTIPLE_SELECT', 'TRUE_FALSE', 'FILL_IN_THE_BLANK', 'MATCH_THE_FOLLOWING',
  'ONE_WORD', 'SHORT_ANSWER', 'LONG_ANSWER', 'IMAGE_BASED', 'IDENTIFY_AND_NAME', 'ARRANGE_IN_ORDER',
];

const OPTION_BASED_TYPES: QuestionType[] = ['MCQ', 'MULTIPLE_SELECT', 'TRUE_FALSE'];
const ANSWER_BASED_TYPES: QuestionType[] = ['FILL_IN_THE_BLANK', 'ONE_WORD', 'SHORT_ANSWER', 'LONG_ANSWER'];

export function QuestionFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const { id } = useParams();
  const questionId = id ? Number(id) : undefined;
  const navigate = useNavigate();

  const existing = useQuestion(questionId ?? 0);
  const createMutation = useCreateQuestion();
  const updateMutation = useUpdateQuestion(questionId ?? 0);

  const { register, control, handleSubmit, watch, reset, formState } = useForm<QuestionFormSchema>({
    resolver: zodResolver(questionFormSchema),
    defaultValues: {
      questionType: 'MCQ',
      difficulty: 'EASY',
      language: 'ENGLISH',
      marks: 1,
      options: [
        { optionText: '', isCorrect: false, displayOrder: 1 },
        { optionText: '', isCorrect: false, displayOrder: 2 },
      ],
    },
  });

  const { fields, append, remove, replace } = useFieldArray({ control, name: 'options' });
  const questionType = watch('questionType');
  const subjectId = watch('subjectId');
  const classId = watch('classId');
  const chapterId = watch('chapterId');

  const { data: subjects } = useSubjects();
  const { data: chapters } = useChapters(subjectId, classId);
  const { data: topics } = useTopics(chapterId);

  useEffect(() => {
    if (mode === 'edit' && existing.data) {
      reset({
        academicYearId: existing.data.academicYearId,
        classId: existing.data.classId,
        subjectId: existing.data.subjectId,
        chapterId: existing.data.chapterId,
        topicId: existing.data.topicId,
        questionType: existing.data.questionType,
        difficulty: existing.data.difficulty,
        language: existing.data.language,
        questionText: existing.data.questionText,
        explanation: existing.data.explanation ?? '',
        expectedAnswer: existing.data.expectedAnswer ?? '',
        evaluationGuidance: existing.data.evaluationGuidance ?? '',
        marks: existing.data.marks,
        options: existing.data.options,
      });
    }
  }, [mode, existing.data, reset]);

  // Reset options to a sensible default whenever the question type changes
  // into/out of the option-based family, so stale options from a previous
  // type selection don't linger (e.g. switching MCQ -> Short Answer).
  function handleTypeChange(type: QuestionType) {
    if (type === 'TRUE_FALSE') {
      replace([
        { optionText: 'True', isCorrect: false, displayOrder: 1 },
        { optionText: 'False', isCorrect: false, displayOrder: 2 },
      ]);
    } else if (OPTION_BASED_TYPES.includes(type) && fields.length === 0) {
      replace([
        { optionText: '', isCorrect: false, displayOrder: 1 },
        { optionText: '', isCorrect: false, displayOrder: 2 },
      ]);
    } else if (!OPTION_BASED_TYPES.includes(type)) {
      replace([]);
    }
  }

  const mutation = mode === 'create' ? createMutation : updateMutation;

  function onSubmit(values: QuestionFormSchema) {
    mutation.mutate(values, {
      onSuccess: (result) => navigate(`/staff/question-bank/${result.id}`),
    });
  }

  return (
    <div className="page" style={{ maxWidth: 760 }}>
      <div className="page-header">
        <h1>{mode === 'create' ? 'New Question' : 'Edit Question'}</h1>
      </div>
      <form className="form-card" onSubmit={handleSubmit(onSubmit)}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <label className="field">
            <span>Academic Year</span>
            <select {...register('academicYearId', { valueAsNumber: true })}>
              <option value="">Select…</option>
              {ACADEMIC_YEARS.map((y) => <option key={y.id} value={y.id}>{y.label}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Class</span>
            <select {...register('classId', { valueAsNumber: true })}>
              <option value="">Select…</option>
              {CLASSES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Subject</span>
            <select {...register('subjectId', { valueAsNumber: true })}>
              <option value="">Select…</option>
              {subjects?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Chapter</span>
            <select {...register('chapterId', { valueAsNumber: true })} disabled={!subjectId || !classId}>
              <option value="">Select…</option>
              {chapters?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Topic</span>
            <select {...register('topicId', { valueAsNumber: true })} disabled={!chapterId}>
              <option value="">Select…</option>
              {topics?.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Question Type</span>
            <Controller
              control={control}
              name="questionType"
              render={({ field }) => (
                <select
                  {...field}
                  onChange={(e) => {
                    field.onChange(e.target.value);
                    handleTypeChange(e.target.value as QuestionType);
                  }}
                >
                  {QUESTION_TYPES.map((t) => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                </select>
              )}
            />
          </label>
          <label className="field">
            <span>Difficulty</span>
            <select {...register('difficulty')}>
              <option value="EASY">Easy</option>
              <option value="MEDIUM">Medium</option>
              <option value="HARD">Hard</option>
            </select>
          </label>
          <label className="field">
            <span>Language</span>
            <select {...register('language')}>
              <option value="HINDI">Hindi</option>
              <option value="ENGLISH">English</option>
              <option value="BILINGUAL">Bilingual</option>
            </select>
          </label>
          <label className="field">
            <span>Marks</span>
            <input type="number" step="0.5" {...register('marks', { valueAsNumber: true })} />
          </label>
        </div>

        <label className="field" style={{ marginTop: '0.25rem' }}>
          <span>Question</span>
          <textarea rows={3} style={{ width: '100%' }} {...register('questionText')} />
          {formState.errors.questionText && <span className="error-text">{formState.errors.questionText.message}</span>}
        </label>

        <label className="field">
          <span>Explanation (optional)</span>
          <textarea rows={2} style={{ width: '100%' }} {...register('explanation')} />
        </label>

        {OPTION_BASED_TYPES.includes(questionType) && (
          <fieldset style={{ marginTop: '1rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '1rem' }}>
            <legend><strong>Options</strong></legend>
            {fields.map((field, index) => (
              <div key={field.id} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                <input
                  placeholder={`Option ${index + 1}`}
                  {...register(`options.${index}.optionText` as const)}
                  disabled={questionType === 'TRUE_FALSE'}
                />
                <label>
                  <input type="checkbox" {...register(`options.${index}.isCorrect` as const)} /> Correct
                </label>
                {questionType !== 'TRUE_FALSE' && fields.length > 2 && (
                  <button type="button" className="btn-danger btn-sm" onClick={() => remove(index)}>Remove</button>
                )}
              </div>
            ))}
            {questionType !== 'TRUE_FALSE' && (
              <button
                type="button"
                className="btn-ghost"
                onClick={() => append({ optionText: '', isCorrect: false, displayOrder: fields.length + 1 })}
              >
                + Add Option
              </button>
            )}
            {formState.errors.options && (
              <span className="error-text">{formState.errors.options.message as string}</span>
            )}
          </fieldset>
        )}

        {ANSWER_BASED_TYPES.includes(questionType) && (
          <>
            <label className="field">
              <span>Expected Answer</span>
              <textarea rows={2} style={{ width: '100%' }} {...register('expectedAnswer')} />
              {formState.errors.expectedAnswer && (
                <span className="error-text">{formState.errors.expectedAnswer.message}</span>
              )}
            </label>
            {(questionType === 'SHORT_ANSWER' || questionType === 'LONG_ANSWER') && (
              <label className="field">
                <span>Evaluation Guidance</span>
                <textarea rows={2} style={{ width: '100%' }} {...register('evaluationGuidance')} />
              </label>
            )}
          </>
        )}

        {questionType === 'IMAGE_BASED' && (
          <div className="alert alert-warning">
            Image upload will be available once attachment storage is wired up (Section 14 of the spec —
            storage provider stays swappable behind the API).
          </div>
        )}

        <div className="button-row" style={{ marginTop: '1.5rem' }}>
          <button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving…' : 'Save as Draft'}
          </button>
        </div>
        {mutation.isError && <div className="alert alert-error">{extractErrorMessage(mutation.error)}</div>}
      </form>
    </div>
  );
}