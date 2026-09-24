import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Sparkles, Check, Link2, LayoutDashboard } from 'lucide-react';
import { BLOOM_LEVELS, BLOOM_IDS } from '../bloom';
import { getExam, saveExam } from '../storage';
import { regenerateOne } from '../generation';
import { copyTextToClipboard } from '../copy';
import { ReviewQuestionCard } from '../components/ReviewQuestionCard';
import { BlueprintChart } from '../components/BlueprintChart';

export function ReviewPage() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(() => getExam(examId));
  const [copied, setCopied] = useState(false);

  const numQuestions = exam?.questions?.length ?? 0;
  const totalMarks = useMemo(
    () => (exam?.questions ?? []).reduce((sum, q) => sum + (Number(q.marks) || 0), 0),
    [exam],
  );

  const actual = useMemo(() => {
    const counts = Object.fromEntries(BLOOM_IDS.map((id) => [id, 0]));
    const marks = Object.fromEntries(BLOOM_IDS.map((id) => [id, 0]));
    (exam?.questions ?? []).forEach((q) => {
      const level = q.bloomLevel ?? 'remember';
      counts[level] = (counts[level] ?? 0) + 1;
      marks[level] = (marks[level] ?? 0) + (Number(q.marks) || 0);
    });
    return { counts, marks };
  }, [exam]);

  const chartData = useMemo(() => [{ name: 'Generated', ...actual.counts }], [actual.counts]);
  const legend = useMemo(
    () =>
      BLOOM_LEVELS.map((level) => ({
        id: level.id,
        label: level.label,
        color: level.color,
        count: actual.counts[level.id] ?? 0,
        percent: numQuestions ? Math.round(((actual.counts[level.id] ?? 0) / numQuestions) * 100) : 0,
        marksShare: actual.marks[level.id] ?? 0,
      })).filter((row) => row.count > 0),
    [actual, numQuestions],
  );

  if (!exam) {
    return (
      <div className="page be-page">
        <div className="card">
          <h1>Exam not found</h1>
          <p className="muted">This draft may have been deleted. Return to the generator to create a new one.</p>
          <button type="button" onClick={() => navigate('/staff/bloom-generator')}>
            Back to generator
          </button>
        </div>
      </div>
    );
  }

  function persist(next) {
    setExam(next);
    saveExam(next);
  }

  function updateQuestion(index, question) {
    const questions = exam.questions.map((q, i) => (i === index ? question : q));
    persist({ ...exam, questions });
  }

  async function handleRegenerate(index) {
    const fresh = await regenerateOne(exam, index);
    if (fresh) updateQuestion(index, fresh);
  }

  function togglePublish() {
    const published = exam.status === 'published';
    persist({
      ...exam,
      status: published ? 'draft' : 'published',
      publishedAt: published ? null : new Date().toISOString(),
    });
  }

  async function copyStudentLink() {
    const url = `${window.location.origin}/test/${exam.examId}`;
    const ok = await copyTextToClipboard(url);
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  }

  const studentLink = `${window.location.origin}/test/${exam.examId}`;

  return (
    <div className="page be-page">
      <div className="be-toolbar">
        <button type="button" className="btn-ghost btn-sm" onClick={() => navigate('/staff/bloom-generator')}>
          <ArrowLeft size={14} style={{ verticalAlign: 'middle' }} /> New exam
        </button>
        <div className="be-toolbar-title">
          <Sparkles size={16} /> Review & Edit Portal
        </div>
        <div className="be-toolbar-actions">
          <button
            type="button"
            className={exam.status === 'published' ? 'btn-ghost btn-sm' : 'btn-secondary btn-sm'}
            onClick={togglePublish}
          >
            {exam.status === 'published' ? (
              <>
                <Check size={13} style={{ verticalAlign: 'middle' }} /> Published
              </>
            ) : (
              <>
                <Link2 size={13} style={{ verticalAlign: 'middle' }} /> Publish exam
              </>
            )}
          </button>
          <button
            type="button"
            className="btn-secondary btn-sm"
            onClick={() => navigate(`/staff/bloom-generator/analytics/${exam.examId}`)}
          >
            <LayoutDashboard size={13} style={{ verticalAlign: 'middle' }} /> Analytics
          </button>
        </div>
      </div>

      <div className="be-exam-meta-card">
        <div>
          <h2>{exam.title}</h2>
          <p className="muted">
            {[exam.config?.subject, exam.config?.gradeLevel, exam.config?.topic].filter(Boolean).join(' · ')}
          </p>
        </div>
        <div className="be-meta-pills">
          <span className="be-meta-pill">{numQuestions} questions</span>
          <span className="be-meta-pill">{totalMarks} marks</span>
          <span className="be-meta-pill">{exam.config?.difficulty ?? 'medium'}</span>
        </div>
        {exam.status === 'published' && (
          <div className="be-student-link">
            <span className="help-text">Student link</span>
            <code>{studentLink}</code>
            <button type="button" className="btn-secondary btn-sm" onClick={copyStudentLink}>
              {copied ? <Check size={13} /> : <Link2 size={13} />} {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        )}
      </div>

      {exam.usedFallback && (
        <div className="alert alert-warning">
          The AI generation service was unreachable for some questions, so sample questions were generated to keep the
          demo flowing. Edit or regenerate them below.
        </div>
      )}

      <div className="be-layout be-layout-review">
        <div className="be-review-list">
          {exam.questions.map((question, index) => (
            <ReviewQuestionCard
              key={question.id}
              question={question}
              index={index}
              onUpdate={(next) => updateQuestion(index, next)}
              onRegenerate={handleRegenerate}
            />
          ))}
        </div>

        <aside className="be-blueprint-panel">
          <div className="be-section-title">
            <Sparkles size={15} /> Actual distribution
          </div>
          <p className="help-text">How the generated questions are spread across Bloom's levels.</p>
          <div className="be-blueprint-chart-box">
            <BlueprintChart data={chartData} legend={legend} />
          </div>
          <div className="be-summary-strip">
            <div><strong>{numQuestions}</strong><span>questions</span></div>
            <div><strong>{totalMarks}</strong><span>marks</span></div>
          </div>
          <p className="help-text">
            Tip: hit <RefreshCw size={11} style={{ verticalAlign: 'middle' }} /> Regenerate on any question you are not
            happy with — its Bloom level and marks are kept.
          </p>
        </aside>
      </div>
    </div>
  );
}