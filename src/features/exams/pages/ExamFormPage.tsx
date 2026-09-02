import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useCreateExam } from '../hooks/useExams';
import { extractErrorMessage } from '../../../services/api';
import type { CreateExamPayload, ExamType } from '../types/exam';

// Same known limitation as the question form: no /classes or
// /academic-years list endpoint in the spec, so these are hardcoded to
// match the seed data. See the top-level README's "Known gaps" section.
const CLASSES = [
  { id: 1, name: 'Nursery' }, { id: 2, name: 'LKG' }, { id: 3, name: 'UKG' },
  { id: 4, name: 'Class 1' }, { id: 5, name: 'Class 2' }, { id: 6, name: 'Class 3' },
  { id: 7, name: 'Class 4' }, { id: 8, name: 'Class 5' },
];
const ACADEMIC_YEARS = [{ id: 1, label: '2025-26' }, { id: 2, label: '2026-27' }];
const EXAM_TYPES: ExamType[] = ['UNIT_TEST', 'PERIODIC_TEST', 'CLASS_TEST', 'HALF_YEARLY', 'ANNUAL', 'OTHER'];

export function ExamFormPage() {
  const { register, handleSubmit } = useForm<CreateExamPayload>({
    defaultValues: { examType: 'UNIT_TEST' },
  });
  const createMutation = useCreateExam();
  const navigate = useNavigate();

  function onSubmit(values: CreateExamPayload) {
    createMutation.mutate(
      {
        ...values,
        academicYearId: Number(values.academicYearId),
        classId: Number(values.classId),
        subjectId: Number(values.subjectId),
        duration: values.duration ? Number(values.duration) : undefined,
      },
      { onSuccess: (exam) => navigate(`/staff/exams/${exam.id}`) }
    );
  }

  return (
    <div className="page page-sm">
      <div className="page-header">
        <h1>New Exam</h1>
      </div>
      <form className="form-card" onSubmit={handleSubmit(onSubmit)}>
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
          <span>Subject ID</span>
          <input type="number" {...register('subjectId', { valueAsNumber: true })} />
          <span className="help-text">Numeric ID, until a /subjects lookup is wired in.</span>
        </label>
        <label className="field">
          <span>Exam Type</span>
          <select {...register('examType')}>
            {EXAM_TYPES.map((t) => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
          </select>
        </label>
        <label className="field">
          <span>Exam Name</span>
          <input {...register('name', { required: true })} />
        </label>
        <label className="field">
          <span>Duration (minutes)</span>
          <input type="number" {...register('duration')} />
        </label>
        <label className="field">
          <span>Exam Date (optional)</span>
          <input type="date" {...register('examDate')} />
        </label>
        <div className="button-row">
          <button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Creating…' : 'Create Exam'}
          </button>
        </div>
        {createMutation.isError && (
          <div className="alert alert-error">{extractErrorMessage(createMutation.error)}</div>
        )}
      </form>
    </div>
  );
}