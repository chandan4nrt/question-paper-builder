import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { BookOpen, Send, CheckCircle2, Download, Loader2 } from 'lucide-react';
import { useListPapersSmart } from '../../hooks/useQuestionPapers';
import { extractErrorMessage } from '../../../../services/api';
import { deserializePaper } from '../../deserializePaper';
import { StudentAnswerCard, isQuestionAnswered } from '../components/StudentQuestionView';
import { buildSubmission, saveSubmission, postSubmission, downloadSubmissionJson } from '../submission';
import { formatDate } from '../../helpers';
import { MarkdownText } from '../../components/MarkdownText';

export function StudentAnswerPage() {
  const { paperId } = useParams();
  const papersQuery = useListPapersSmart();

  const record = useMemo(
    () => papersQuery.data?.find((p) => p.paperId === paperId),
    [papersQuery.data, paperId],
  );

  const paper = useMemo(() => (record ? deserializePaper(record) : null), [record]);

  const [studentName, setStudentName] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [answers, setAnswers] = useState(() => ({}));
  const [submission, setSubmission] = useState(null);
  const [saving, setSaving] = useState(false);

  if (papersQuery.isLoading) {
    return (
      <div className="sp-student-wrap">
        <div className="sp-student-state">
          <Loader2 size={24} className="sp-spin" /> Loading paper…
        </div>
      </div>
    );
  }

  if (papersQuery.isError) {
    return (
      <div className="sp-student-wrap">
        <div className="sp-student-state">
          <h2>Paper could not be loaded</h2>
          <p className="muted">{extractErrorMessage(papersQuery.error)}</p>
          <p className="muted">
            The API is unreachable, or the API server is rejecting anonymous access. Check your internet/VPN and that the
            backend allows unauthenticated reads of the paper list.
          </p>
        </div>
      </div>
    );
  }

  if (!paper) {
    return (
      <div className="sp-student-wrap">
        <div className="sp-student-state">
          <h2>Paper not found</h2>
          <p className="muted">The link is invalid or the paper was removed.</p>
        </div>
      </div>
    );
  }

  if (record && record.published !== true) {
    return (
      <div className="sp-student-wrap">
        <div className="sp-student-state">
          <h2>This paper is not available yet</h2>
          <p className="muted">Ask your teacher to publish it before you can take it.</p>
        </div>
      </div>
    );
  }

  function setAnswer(questionId, value) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  const answeredCount = paper.questions.filter((q) => isQuestionAnswered(q, answers[q.id])).length;
  const allAnswered = answeredCount === paper.questions.length;
  const nameOk = studentName.trim().length > 0;
  const { header } = paper;
  const mathExample = '$x^2 + \\frac{a}{b}$';

  function handleSubmit() {
    if (!allAnswered || !nameOk || saving) return;
    setSaving(true);
    const next = buildSubmission(paper, { name: studentName, rollNo }, answers);
    next.paperId = record.paperId ?? paperId;
    saveSubmission(next);
    postSubmission(next, next.paperId);
    setSubmission(next);
    setSaving(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (submission) {
    return (
      <div className="sp-student-wrap">
        <div className="sp-student-card">
          <div className="sp-student-head">
            <div>
              <h1>{header.subject || 'Your answer sheet'} — {header.exam || ''}</h1>
              <p className="muted">
                {submission.studentName}{submission.rollNo ? ` · Roll: ${submission.rollNo}` : ''} · submitted{' '}
                {new Date(submission.submittedAt).toLocaleString()}
              </p>
            </div>
            <span className="sp-status-chip">
              <CheckCircle2 size={13} /> Submitted
            </span>
          </div>

          <div className="sp-student-note">
            Answers are saved and sent for evaluation. Download a copy now to keep it safe.
          </div>

          <button type="button" className="sp-student-export" onClick={() => downloadSubmissionJson(submission)}>
            <Download size={14} /> Download answer sheet (JSON)
          </button>

          <h2>Your answers</h2>
          <div className="sp-student-list">
            {paper.questions.map((question) => (
              <StudentAnswerCard
                key={question.id}
                question={question}
                value={answers[question.id]}
                onChange={() => {}}
                readOnly
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sp-student-wrap">
      <div className="sp-student-card">
        <div className="sp-student-head">
          <div>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BookOpen size={22} /> {header.subject || 'Paper'}
            </h1>
            <p className="muted">
              {[header.schoolName, header.className, header.exam, header.academicYear, header.date && formatDate(header.date)]
                .filter(Boolean)
                .join(' · ')}
            </p>
          </div>
        </div>

        {header.instructions && (
          <div className="sp-student-instructions">
            <strong>Instructions:</strong> <MarkdownText>{header.instructions}</MarkdownText>
          </div>
        )}

        <div className="sp-student-progress">
          <span>{answeredCount} of {paper.questions.length} answered</span>
          <div className="sp-student-progress-bar">
            <div style={{ width: `${paper.questions.length ? (answeredCount / paper.questions.length) * 100 : 0}%` }} />
          </div>
        </div>

        <div className="sp-student-id-fields">
          <label className="sp-student-field">
            <span>Your name</span>
            <input value={studentName} onChange={(e) => setStudentName(e.target.value)} placeholder="Enter your name" />
          </label>
          <label className="sp-student-field">
            <span>Roll No</span>
            <input value={rollNo} onChange={(e) => setRollNo(e.target.value)} placeholder="Optional" />
          </label>
        </div>

        <div className="sp-student-list">
          {paper.questions.map((question) => (
            <StudentAnswerCard
              key={question.id}
              question={question}
              value={answers[question.id]}
              onChange={(value) => setAnswer(question.id, value)}
            />
          ))}
        </div>

        <div className="sp-student-submit-bar">
          {!allAnswered && <span className="muted">Answer every question to submit.</span>}
          <span style={{ flex: 1 }} />
          <button type="button" onClick={handleSubmit} disabled={!allAnswered || !nameOk}>
            {saving ? 'Submitting…' : 'Submit exam'} <Send size={14} style={{ verticalAlign: 'middle', marginLeft: '0.3rem' }} />
          </button>
        </div>

        <div className="help-text" style={{ marginTop: '1rem' }}>
          Type Hindi on your device keyboard or use the in-app Hindi keyboard. Wrap math in $…$ (e.g. {mathExample})
          and use the math buttons above each box.
        </div>
      </div>
    </div>
  );
}