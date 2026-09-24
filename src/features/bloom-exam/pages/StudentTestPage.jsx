import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { BookOpen, Send, CheckCircle2, ArrowRight } from 'lucide-react';
import { getExam, saveSubmission, getStudentName, setStudentName } from '../storage';
import { buildSubmission, bloomBreakdownRows } from '../scoring';
import { bloomColor } from '../bloom';
import { StudentQuestion } from '../components/StudentQuestion';

export function StudentTestPage() {
  const { examId } = useParams();
  const exam = useMemo(() => getExam(examId), [examId]);
  const [studentName, setStudent] = useState(() => getStudentName());
  const [answers, setAnswers] = useState(() => ({}));
  const [submission, setSubmission] = useState(null);
  const [saving, setSaving] = useState(false);

  if (!exam) {
    return (
      <div className="be-student-wrap">
        <div className="card" style={{ maxWidth: 520, margin: '4rem auto' }}>
          <h2>Exam not found</h2>
          <p className="muted">The exam link is invalid or the exam was deleted.</p>
        </div>
      </div>
    );
  }

  function setAnswer(questionId, value) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  const answeredCount = exam.questions.filter((q) =>
    q.type === 'mcq' ? Boolean(answers[q.id]) : Boolean(String(answers[q.id] ?? '').trim()),
  ).length;
  const allAnswered = answeredCount === exam.questions.length;
  const nameOk = studentName.trim().length > 0;

  function handleSubmit() {
    if (!allAnswered || !nameOk || saving) return;
    setSaving(true);
    setStudentName(studentName.trim());
    const next = buildSubmission(exam, studentName.trim(), answers);
    saveSubmission(next);
    setSubmission(next);
    setSaving(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (submission) {
    const rows = bloomBreakdownRows(submission.bloomTotals);
    return (
      <div className="be-student-wrap">
        <div className="be-student-header">
          <div>
            <h1>{exam.title}</h1>
            <p className="muted">{submission.studentName} · submitted {new Date(submission.submittedAt).toLocaleString()}</p>
          </div>
          <span className="be-status-chip be-status-published"><CheckCircle2 size={13} /> Submitted</span>
        </div>

        <div className="be-result-hero">
          <div className="be-result-score">
            <div className="be-result-percent">{submission.percentage}%</div>
            <div className="muted">{submission.score} / {submission.totalMarks} marks</div>
          </div>
          <div className="be-result-stats">
            <div><strong>{exam.questions.length}</strong><span>questions</span></div>
            <div><strong>{Object.values(submission.grades).filter((g) => g.correct).length}</strong><span>correct</span></div>
            <div><strong>{submission.bloomTotals ? Object.values(submission.bloomTotals).filter((b) => b.count > 0).length : 0}</strong><span>Bloom levels</span></div>
          </div>
        </div>

        <section className="be-result-bloom">
          <h2>Score by Bloom's cognitive depth</h2>
          {rows.map((row) => {
            const color = bloomColor(row.id);
            const pct = row.percentage ?? 0;
            return (
              <div key={row.id} className="be-bloom-result-row">
                <div className="be-bloom-result-label">
                  <span className="be-level-dot" style={{ background: color }} />
                  <strong>{row.label}</strong>
                  <span className="muted">{row.earned}/{row.max} marks</span>
                </div>
                <div className="be-bloom-result-bar">
                  <div
                    className="be-bloom-result-fill"
                    style={{ width: `${pct}%`, background: color }}
                  />
                </div>
                <span className="be-bloom-result-pct">{pct}%</span>
              </div>
            );
          })}
          {rows.length === 0 && <p className="muted">No graded results.</p>}
        </section>

        <h2>Your answers</h2>
        <div className="be-review-list">
          {exam.questions.map((question, index) => (
            <StudentQuestion
              key={question.id}
              question={question}
              index={index}
              value={answers[question.id]}
              onChange={() => {}}
              result={submission.grades[question.id]}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="be-student-wrap">
      <div className="be-student-header">
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BookOpen size={22} /> {exam.title}
          </h1>
          <p className="muted">
            {[exam.config?.subject, exam.config?.gradeLevel].filter(Boolean).join(' · ')} · {exam.numQuestions} questions · {exam.totalMarks} marks
          </p>
        </div>
      </div>

      <div className="be-student-progress">
        <span>{answeredCount} of {exam.questions.length} answered</span>
        <div className="be-student-progress-bar">
          <div style={{ width: `${(answeredCount / exam.questions.length) * 100}%` }} />
        </div>
      </div>

      <label className="be-field be-student-name">
        <span>Your name</span>
        <input
          value={studentName}
          onChange={(e) => setStudent(e.target.value)}
          placeholder="Enter your name to submit"
        />
      </label>

      <div className="be-review-list">
        {exam.questions.map((question, index) => (
          <StudentQuestion
            key={question.id}
            question={question}
            index={index}
            value={answers[question.id]}
            onChange={(value) => setAnswer(question.id, value)}
          />
        ))}
      </div>

      <div className="be-submit-bar">
        {!allAnswered && <span className="muted">Answer every question to submit.</span>}
        <span style={{ flex: 1 }} />
        <button type="button" onClick={handleSubmit} disabled={!allAnswered || !nameOk}>
          {saving ? 'Submitting…' : 'Submit exam'} <Send size={14} style={{ verticalAlign: 'middle', marginLeft: '0.3rem' }} />
        </button>
      </div>

      <div className="help-text" style={{ marginTop: '1rem' }}>
        <ArrowRight size={11} style={{ verticalAlign: 'middle' }} /> After submitting you will see your score broken down by Bloom's
        cognitive depth.
      </div>
    </div>
  );
}