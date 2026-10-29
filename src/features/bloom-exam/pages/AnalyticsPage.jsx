import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ChevronDown, ChevronRight, ArrowLeft, Users } from 'lucide-react';
import { getExam, listSubmissionsForExam } from '../storage';
import { aggregateExam, bloomBreakdownRows } from '../scoring';
import { bloomColor } from '../bloom';

function formatDate(value) {
  return new Date(value).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export function AnalyticsPage() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const exam = useMemo(() => getExam(examId), [examId]);
  const submissions = useMemo(() => listSubmissionsForExam(examId), [examId]);
  const [expanded, setExpanded] = useState(null);

  const aggregate = useMemo(() => aggregateExam(submissions), [submissions]);

  const avgPercentage = submissions.length
    ? Math.round(submissions.reduce((sum, s) => sum + s.percentage, 0) / submissions.length)
    : 0;

  if (!exam) {
    return (
      <div className="page be-page">
        <div className="card">
          <h1>Exam not found</h1>
          <button type="button" onClick={() => navigate('/staff/bloom-generator/exams')}>Back to exams</button>
        </div>
      </div>
    );
  }

  return (
    <div className="page be-page">
      <div className="be-toolbar">
        <button type="button" className="btn-ghost btn-sm" onClick={() => navigate(`/staff/bloom-generator/review/${exam.examId}`)}>
          <ArrowLeft size={14} style={{ verticalAlign: 'middle' }} /> Review
        </button>
        <div className="be-toolbar-title"><Users size={16} /> Analytics</div>
        <div className="be-toolbar-actions">
          <button type="button" className="btn-secondary btn-sm" onClick={() => navigate('/staff/bloom-generator/exams')}>
            Exams
          </button>
        </div>
      </div>

      <div className="be-exam-meta-card">
        <div>
          <h2>{exam.title}</h2>
          <p className="muted">{submissions.length} submission{submissions.length === 1 ? '' : 's'} recorded</p>
        </div>
        <div className="be-meta-pills">
          <span className="be-meta-pill">{exam.numQuestions} questions</span>
          <span className="be-meta-pill">{exam.totalMarks} marks</span>
        </div>
      </div>

      <div className="be-kpi-grid">
        <div className="be-kpi"><strong>{submissions.length}</strong><span>students attempted</span></div>
        <div className="be-kpi"><strong>{avgPercentage}%</strong><span>average score</span></div>
        <div className="be-kpi">
          <strong>{submissions.reduce((sum, s) => sum + s.score, 0)}</strong>
          <span>total marks scored</span>
        </div>
        <div className="be-kpi">
          <strong>{submissions.reduce((sum, s) => sum + Object.values(s.grades ?? {}).filter((g) => g.correct).length, 0)}</strong>
          <span>correct answers</span>
        </div>
      </div>

      <section className="be-chart-card">
        <div className="be-section-title">Marks earned by Bloom's cognitive depth</div>
        {aggregate.length === 0 ? (
          <p className="muted">No submissions yet — share the student link to collect results.</p>
        ) : (
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={aggregate} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="earned" name="Marks scored" fill="#b43861" radius={[4, 4, 0, 0]} maxBarSize={46} />
                <Bar dataKey="max" name="Marks available" fill="#f1d1de" radius={[4, 4, 0, 0]} maxBarSize={46} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      {submissions.length > 0 && (
        <section className="be-submissions">
          <div className="be-section-title">Submissions</div>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 32 }} />
                <th>Student</th>
                <th>Submitted</th>
                <th>Score</th>
                <th>Percentage</th>
                <th>Accuracy</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((submission) => {
                const correct = Object.values(submission.grades ?? {}).filter((g) => g.correct).length;
                const total = exam.questions.length;
                const isOpen = expanded === submission.submissionId;
                return (
                  <SubmissionRows
                    key={submission.submissionId}
                    submission={submission}
                    total={total}
                    correct={correct}
                    isOpen={isOpen}
                    onToggle={() => setExpanded(isOpen ? null : submission.submissionId)}
                  />
                );
              })}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}

function SubmissionRows({ submission, total, correct, isOpen, onToggle }) {
  const rows = bloomBreakdownRows(submission.bloomTotals);
  return (
    <>
      <tr onClick={onToggle} style={{ cursor: 'pointer' }}>
        <td>{isOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}</td>
        <td><strong>{submission.studentName}</strong></td>
        <td className="muted">{formatDate(submission.submittedAt)}</td>
        <td>{submission.score} / {submission.totalMarks}</td>
        <td><strong>{submission.percentage}%</strong></td>
        <td>{correct} / {total} correct</td>
      </tr>
      {isOpen && (
        <tr className="be-submission-detail-row">
          <td colSpan={6}>
            <div className="be-submission-bloom">
              {rows.map((row) => {
                const color = bloomColor(row.id);
                const pct = row.percentage ?? 0;
                return (
                  <div key={row.id} className="be-bloom-result-row">
                    <div className="be-bloom-result-label">
                      <span className="be-level-dot" style={{ background: color }} />
                      <strong>{row.label}</strong>
                      <span className="muted">{row.earned}/{row.max} marks · {row.count} question{row.count === 1 ? '' : 's'}</span>
                    </div>
                    <div className="be-bloom-result-bar">
                      <div className="be-bloom-result-fill" style={{ width: `${pct}%`, background: color }} />
                    </div>
                    <span className="be-bloom-result-pct">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}