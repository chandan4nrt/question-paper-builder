import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pencil, LayoutDashboard, Trash2, Sparkles, Link2, Check, Eye } from 'lucide-react';
import { listExams, deleteExam, saveExam } from '../storage';
import { copyTextToClipboard } from '../copy';
import { BlueprintChart } from '../components/BlueprintChart';
import { BLOOM_LEVELS, BLOOM_IDS } from '../bloom';

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function ExamCard({ exam, onDelete, onUpdate }) {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const counts = Object.fromEntries(BLOOM_IDS.map((id) => [id, 0]));
  (exam.questions ?? []).forEach((q) => {
    counts[q.bloomLevel] = (counts[q.bloomLevel] ?? 0) + 1;
  });
  const chartData = [{ name: 'Distribution', ...counts }];
  const legend = BLOOM_LEVELS.map((level) => ({
    id: level.id,
    label: level.label,
    color: level.color,
    count: counts[level.id] ?? 0,
    percent: exam.numQuestions ? Math.round(((counts[level.id] ?? 0) / exam.numQuestions) * 100) : 0,
  })).filter((row) => row.count > 0);

  const studentLink = `${window.location.origin}/test/${exam.examId}`;

  async function copyLink() {
    const ok = await copyTextToClipboard(studentLink);
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <article className="be-exam-card">
      <header className="be-exam-card-head">
        <div style={{ minWidth: 0 }}>
          <h3>{exam.title}</h3>
          <p className="muted">
            {[exam.config?.subject, exam.config?.gradeLevel, exam.config?.topic].filter(Boolean).join(' · ') || '—'}
          </p>
        </div>
        <span className={`be-status-chip ${exam.status === 'published' ? 'be-status-published' : 'be-status-draft'}`}>
          {exam.status === 'published' ? 'Published' : 'Draft'}
        </span>
      </header>

      <div className="be-exam-card-stats">
        <span>{exam.numQuestions} questions</span>
        <span>{exam.totalMarks} marks</span>
        <span>{exam.questions?.filter((q) => q.source === 'sample').length ?? 0} sample</span>
        <span>{formatDate(exam.createdAt)}</span>
      </div>

      <BlueprintChart data={chartData} legend={legend} />

      <div className="be-exam-card-actions">
        <button type="button" className="btn-secondary btn-sm" onClick={() => navigate(`/staff/bloom-generator/review/${exam.examId}`)}>
          <Pencil size={13} style={{ verticalAlign: 'middle' }} /> Review & Edit
        </button>
        <button
          type="button"
          className="btn-secondary btn-sm"
          onClick={() => {
            const published = exam.status === 'published';
            onUpdate({
              ...exam,
              status: published ? 'draft' : 'published',
              publishedAt: published ? null : new Date().toISOString(),
            });
          }}
        >
          {exam.status === 'published' ? (
            <>
              <Check size={13} style={{ verticalAlign: 'middle' }} /> Unpublish
            </>
          ) : (
            <>
              <Link2 size={13} style={{ verticalAlign: 'middle' }} /> Publish
            </>
          )}
        </button>
        <button type="button" className="btn-secondary btn-sm" onClick={() => navigate(`/staff/bloom-generator/analytics/${exam.examId}`)}>
          <LayoutDashboard size={13} style={{ verticalAlign: 'middle' }} /> Analytics
        </button>
        <span style={{ flex: 1 }} />
        {exam.status === 'published' && (
          <button type="button" className="btn-secondary btn-sm" onClick={copyLink} title={studentLink}>
            {copied ? <Check size={13} style={{ verticalAlign: 'middle' }} /> : <Eye size={13} style={{ verticalAlign: 'middle' }} />}
            {copied ? 'Copied' : 'Student link'}
          </button>
        )}
        <button type="button" className="btn-danger btn-sm" onClick={() => onDelete(exam.examId)}>
          <Trash2 size={13} style={{ verticalAlign: 'middle' }} /> Delete
        </button>
      </div>
    </article>
  );
}

export function ExamListPage() {
  const navigate = useNavigate();
  const [exams, setExams] = useState(() => listExams());

  function handleDelete(examId) {
    deleteExam(examId);
    setExams(listExams());
  }

  function handleUpdate(exam) {
    saveExam(exam);
    setExams(listExams());
  }

  const published = exams.filter((exam) => exam.status === 'published');
  const drafts = exams.filter((exam) => exam.status !== 'published');

  return (
    <div className="page be-page">
      <div className="page-header">
        <div>
          <h1>Generated Exams</h1>
          <p>Review drafts, publish papers, share student links and view analytics.</p>
        </div>
        <button type="button" onClick={() => navigate('/staff/bloom-generator')}>
          <Sparkles size={15} style={{ verticalAlign: 'middle' }} /> New exam
        </button>
      </div>

      {exams.length === 0 && (
        <div className="empty-state">
          <p>No exams generated yet. Create your first Bloom's-aligned paper with the AI Exam Generator.</p>
          <button type="button" onClick={() => navigate('/staff/bloom-generator')}>Go to generator</button>
        </div>
      )}

      {exams.length > 0 && (
        <div className="be-exams-list">
          {drafts.length > 0 && (
            <section>
              <h2 className="be-section-title">Drafts</h2>
              <div className="be-exams-grid">
                {drafts.map((exam) => <ExamCard key={exam.examId} exam={exam} onDelete={handleDelete} onUpdate={handleUpdate} />)}
              </div>
            </section>
          )}
          {published.length > 0 && (
            <section>
              <h2 className="be-section-title">Published</h2>
              <div className="be-exams-grid">
                {published.map((exam) => <ExamCard key={exam.examId} exam={exam} onDelete={handleDelete} onUpdate={handleUpdate} />)}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}