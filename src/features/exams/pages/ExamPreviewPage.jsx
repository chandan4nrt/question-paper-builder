import { Link, useParams } from 'react-router-dom';
import { useExamPreview } from '../hooks/useExams';
import { previewPdfUrl } from '../api/examsApi';

export function ExamPreviewPage() {
  const { id } = useParams();
  const examId = Number(id);
  const { data: preview, isLoading } = useExamPreview(examId);

  if (isLoading || !preview) return <div className="loading"><span className="spinner" /> Loading…</div>;

  return (
    <div className="page" style={{ maxWidth: 700 }}>
      <div className="button-row" style={{ justifyContent: 'space-between' }}>
        <Link to={`/staff/exams/${examId}`}>&larr; Back</Link>
        <a href={previewPdfUrl(examId)} target="_blank" rel="noreferrer">
          <button>Download PDF</button>
        </a>
      </div>

      <div className="card" style={{ marginTop: '1rem', fontFamily: 'Georgia, serif', padding: '2rem' }}>
        {preview.schoolName && <h2 style={{ textAlign: 'center' }}>{preview.schoolName}</h2>}
        {preview.schoolAddress && <p className="muted" style={{ textAlign: 'center' }}>{preview.schoolAddress}</p>}

        <h3 style={{ textAlign: 'center' }}>{preview.examName.toUpperCase()}</h3>
        <p className="muted" style={{ textAlign: 'center' }}>Academic Year {preview.academicYearLabel}</p>

        <p>Class: {preview.className}</p>
        <p>Subject: {preview.subjectName}</p>
        {preview.durationMinutes && <p>Time: {preview.durationMinutes} minutes</p>}
        {preview.totalMarks != null && <p>Maximum Marks: {preview.totalMarks}</p>}

        <p><strong>Instructions:</strong></p>
        <ol>
          {preview.instructions.map((instr, i) => <li key={i}>{instr}</li>)}
        </ol>

        {preview.sections.map((section) => (
          <div key={section.sectionName} style={{ marginTop: '1.5rem' }}>
            <h4>{section.sectionName}</h4>
            {section.questions.map((q) => (
              <div key={q.questionNumber} style={{ marginBottom: '0.75rem' }}>
                <p>{q.questionNumber}. {q.questionText} <span className="muted">[{q.marks}]</span></p>
                {q.optionTexts && (
                  <ol type="A" style={{ marginTop: '0.25rem' }}>
                    {q.optionTexts.map((opt, i) => <li key={i}>{opt}</li>)}
                  </ol>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}