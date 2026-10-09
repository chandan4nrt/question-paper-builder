import { useMemo, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Send,
  CheckCircle2,
  Download,
  Loader2,
  Info,
  User,
  Clock,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Bookmark,
  X,
  FileText,
  AlertCircle,
  Eye,
  Grid
} from 'lucide-react';
import { useGetPaperForStudent } from '../../hooks/useQuestionPapers';
import { extractPaperId, isPublishLink } from '../../api/questionPapersApi';
import { extractErrorMessage } from '../../../../services/api';
import { deserializePaper } from '../../deserializePaper';
import { StudentAnswerCard, isQuestionAnswered } from '../components/StudentQuestionView';
import { buildSubmission, saveSubmission, postSubmission,  downloadSubmissionPdf } from '../submission';
import { formatDate } from '../../helpers';
import { IbpsOnboarding } from '../components/IbpsOnboarding';
import { MarkdownText } from '../../components/MarkdownText';

export function StudentAnswerPage() {
  const navigate = useNavigate();
  const { paperId } = useParams();
  const validPublishLink = isPublishLink(paperId);
  const resolvedPaperId = validPublishLink ? extractPaperId(paperId) : null;
  const paperStudentQuery = useGetPaperForStudent(
    validPublishLink ? paperId : null,
  );

  const record = useMemo(
    () => (paperStudentQuery.data ? (paperStudentQuery.data.data ?? paperStudentQuery.data) : null),
    [paperStudentQuery.data],
  );

  const paper = useMemo(() => (record ? deserializePaper(record) : null), [record]);


  // Candidate Details & Onboarding Flow
  const [studentName, setStudentName] = useState(() => localStorage.getItem('be_student_name') || 'John Smith');
  const [rollNo, setRollNo] = useState(() => localStorage.getItem('be_student_roll') || '11111');
  const [onboardingComplete, setOnboardingComplete] = useState(false);

  // Exam State
  const [answers, setAnswers] = useState(() => ({}));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visited, setVisited] = useState(() => ({ 0: true }));
  const [markedForReview, setMarkedForReview] = useState(() => ({}));
  const [language, setLanguage] = useState('English');
  const [viewMode, setViewMode] = useState('ibps'); // 'ibps' | 'all'

  // Modals & Submission
  const [showInstructions, setShowInstructions] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submission, setSubmission] = useState(null);
  const [saving, setSaving] = useState(false);

  // Timer (30 minutes default countdown or count-up)
  const [timeLeft, setTimeLeft] = useState(1800);

  useEffect(() => {
    if (submission) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [submission]);

  // Mark current question as visited when index changes
  useEffect(() => {
    if (paper?.questions?.[currentIndex]) {
      const qId = paper.questions[currentIndex].id;
      setVisited((prev) => (prev[qId] ? prev : { ...prev, [qId]: true }));
    }
  }, [currentIndex, paper]);

  if (paperStudentQuery.isLoading) {
    return (
      <div className="sp-student-wrap">
        <div className="sp-student-state">
          <Loader2 size={28} className="sp-spin" />
          <p style={{ marginTop: '0.8rem', fontWeight: 600 }}>Loading examination paper…</p>
        </div>
      </div>
    );
  }

  if (paperStudentQuery.isError) {
    return (
      <div className="sp-student-wrap">
        <div className="sp-student-state">
          <h2>Paper could not be loaded</h2>
          <p className="muted">{extractErrorMessage(paperStudentQuery.error)}</p>
          <p className="muted">
            The API is unreachable or requires authentication. Please verify your connection.
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
          <p className="muted">The requested examination link is invalid or has been removed.</p>
        </div>
      </div>
    );
  }

  const isPublished =
    record?.published === true ||
    record?.paper_status === 'PUBLISHED' ||
    record?.paperStatus === 'PUBLISHED';

  if (record && !isPublished) {
    return (
      <div className="sp-student-wrap">
        <div className="sp-student-state">
          <h2>Examination Not Available</h2>
          <p className="muted">This test has not been published by your instructor yet.</p>
        </div>
      </div>
    );
  }

  const { header, questions } = paper;
  const totalQuestions = questions.length;
  const currentQuestion = questions[currentIndex] || questions[0];

  if (!onboardingComplete && !submission) {
    return (
      <IbpsOnboarding
        examTitle={header.exam || header.subject || 'Online Examination'}
        subjectName={header.subject || 'General Section'}
        numQuestions={questions.length}
        totalMarks={questions.reduce((sum, q) => sum + (Number(q.marks) || 1), 0)}
        durationMins={60}
        studentName={studentName}
        setStudentName={setStudentName}
        rollNo={rollNo}
        setRollNo={setRollNo}
        onReadyToBegin={() => setOnboardingComplete(true)}
      />
    );
  }

  function setAnswer(questionId, value) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  // Calculate Statuses for IBPS Legend & Palette
  const getQuestionStatus = (q) => {
    const answered = isQuestionAnswered(q, answers[q.id]);
    const isMarked = Boolean(markedForReview[q.id]);
    const isVis = Boolean(visited[q.id]);

    if (answered && isMarked) return 'ans-marked'; // Answered & Marked for Review
    if (!answered && isMarked) return 'marked';     // Marked for Review
    if (answered && !isMarked) return 'answered';   // Answered
    if (!answered && !isMarked && isVis) return 'not-answered'; // Visited but not answered
    return 'not-visited'; // Not Visited
  };

  const statusCounts = questions.reduce(
    (acc, q) => {
      const status = getQuestionStatus(q);
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    },
    { answered: 0, 'not-answered': 0, 'not-visited': 0, marked: 0, 'ans-marked': 0 }
  );

  const answeredTotal = statusCounts.answered + statusCounts['ans-marked'];
  const nameOk = studentName.trim().length > 0;

  // Actions
  function handleNext() {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  }

  function handlePrev() {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  }
  function handleSkip() {
  if (currentIndex < questions.length - 1) {
    setCurrentIndex((prev) => prev + 1);
  }
}

  function handleMarkForReview() {
    const qId = currentQuestion.id;
    setMarkedForReview((prev) => ({ ...prev, [qId]: !prev[qId] }));
    handleNext();
  }
const handlePrint = () => {
  window.print();
};
  function handleClearResponse() {
    const qId = currentQuestion.id;
    setAnswers((prev) => {
      const copy = { ...prev };
      delete copy[qId];
      return copy;
    });
    setMarkedForReview((prev) => ({ ...prev, [qId]: false }));
  }

  function handleSubmit() {
    if (!nameOk) {
      alert('Please enter your name before submitting.');
      setShowSubmitModal(true);
      return;
    }
    setSaving(true);
    const next = buildSubmission(paper, { name: studentName, rollNo }, answers);
    next.paperId = record.paperId ?? resolvedPaperId;
    saveSubmission(next);
    postSubmission(next, next.paperId);
    setSubmission(next);
    setSaving(false);
    setShowSubmitModal(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Submission Completed Screen
  if (submission) {
    return (
      <div className="ibps-wrapper">
        <header className="ibps-top-header">
          <div className="ibps-brand">
            <div className="ibps-logo" title="Paper Builder">PB</div>
            <div className="ibps-title-group">
              <h1>{header.subject || 'Paper Builder'}</h1>
              <p>{header.schoolName || 'Paper Builder Examination Portal'}</p>
            </div>
          </div>
          <span className="sp-status-chip sp-status-published">
            <CheckCircle2 size={15} /> Submitted Successfully
          </span>
        </header>

        <main style={{ padding: '2rem 1.5rem', maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
          <div className="sp-student-card" style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
            <div className="sp-student-head" style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: '1rem' }}>
              <div>
                <h1 style={{ color: '#1e3a8a', fontSize: '1.4rem' }}>
                  {header.subject || 'Test Summary'} — {header.exam || ''}
                </h1>
                <p className="muted" style={{ marginTop: '0.3rem' }}>
                  Candidate: <strong>{submission.studentName}</strong>
                  {submission.rollNo ? ` (Roll No: ${submission.rollNo})` : ''} · Submitted on{' '}
                  {new Date(submission.submittedAt).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="sp-student-note" style={{ background: '#f0fdf4', borderColor: '#bbf7d0', color: '#166534', margin: '1.25rem 0' }}>
              Your response sheet has been saved and registered successfully.
            </div>

            <div
  style={{
    display: "flex",
    gap: "1rem",
    flexWrap: "wrap",
    marginBottom: "1.5rem",
  }}
>
  <button
    type="button"
    className="sp-student-export"
    style={{
      background: "#0284c7",
      color: "#fff",
      border: "none",
      padding: "0.6rem 1.2rem",
      borderRadius: "6px",
      cursor: "pointer",
      fontWeight: 600,
      display: "inline-flex",
      alignItems: "center",
      gap: "0.5rem",
    }}
    onClick={handlePrint}
  >
    <Download size={16} />
    Download Response Sheet (PDF)
  </button>
</div>

            <h2 style={{ fontSize: '1.1rem', color: '#1e3a8a', marginBottom: '1rem' }}>Question Review</h2>
            <div className="sp-student-list">
              {questions.map((question) => (
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
        </main>
      </div>
    );
  }

  return (
    <div className="ibps-wrapper">
      {/* 1. TOP HEADER */}
      <header className="ibps-top-header">
        <div className="ibps-brand">
          <div className="ibps-logo" title="Paper Builder">PB</div>
          <div className="ibps-title-group">
            <h1>{header.exam || header.subject || 'Paper Builder'}</h1>
            <p>{header.schoolName || 'Paper Builder'}</p>
          </div>
        </div>

        <div className="ibps-top-actions">
          {/* View Mode Switcher */}
          <div className="ibps-view-toggle-bar">
            <button
              type="button"
              className={`ibps-toggle-btn ${viewMode === 'ibps' ? 'active' : ''}`}
              onClick={() => setViewMode('ibps')}
              title="Paper Builder Mode (1 Question at a time)"
            >
              <Grid size={13} style={{ verticalAlign: 'middle', marginRight: '3px' }} /> Paper Builder Mode
            </button>
            <button
              type="button"
              className={`ibps-toggle-btn ${viewMode === 'all' ? 'active' : ''}`}
              onClick={() => setViewMode('all')}
              title="Full Paper List Mode"
            >
              <Eye size={13} style={{ verticalAlign: 'middle', marginRight: '3px' }} /> All Questions
            </button>
          </div>

          <button
            type="button"
            className="ibps-btn-instructions"
            onClick={() => setShowInstructions(true)}
          >
            <Info size={15} /> Instructions
          </button>
        </div>
      </header>

      {/* 2. SUB HEADER BAR */}
      <div className="ibps-sub-bar">
        <div className="ibps-section-tabs">
          <button type="button" className="ibps-section-tab active">
            <BookOpen size={14} /> {header.subject || 'General Section'}
          </button>
        </div>

        <div className="ibps-bar-right">
          <div className="ibps-timer">
            <Clock size={16} /> Time Left : {formatTimer(timeLeft)}
          </div>
        </div>
      </div>

      {/* 3. MAIN BODY LAYOUT */}
      {viewMode === 'ibps' ? (
        <div className="ibps-main-layout">
          {/* LEFT: Question Container */}
          <div className="ibps-question-container">
            {/* Meta Bar */}
            <div className="ibps-q-meta-bar">
              <span className="ibps-q-type">
                Question Type: {currentQuestion.type}
              </span>
              <div className="ibps-q-lang">
                <span>View in:</span>
                <select
                  className="ibps-lang-select"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                >
                  <option value="English">English</option>
                  <option value="Hindi">Hindi</option>
                </select>
              </div>
            </div>

            {/* Banner Header */}
            <div className="ibps-q-header-banner">
              <div className="ibps-q-num-title">
                Question No. {currentIndex + 1}
              </div>
              {/* <span className="ibps-marks-badge">
                Marks: +{currentQuestion.marks || 1} / -0
              </span> */}
            </div>

            {/* Active Question Render Scroll Area */}
            <div className="ibps-q-scroll-area">
              <StudentAnswerCard
                question={currentQuestion}
                value={answers[currentQuestion.id]}
                onChange={(val) => setAnswer(currentQuestion.id, val)}
              />
            </div>

            {/* Bottom Action Bar */}
            <div className="ibps-q-bottom-bar">
              <div className="ibps-btn-group-left">
                <button
                  type="button"
                  className="ibps-btn ibps-btn-review"
                  onClick={handleMarkForReview}
                >
                  <Bookmark size={14} />
                  {markedForReview[currentQuestion.id] ? 'Unmark Review' : 'Mark for Review & Next'}
                </button>
                <button
                  type="button"
                  className="ibps-btn ibps-btn-clear"
                  onClick={handleClearResponse}
                >
                  <RotateCcw size={14} /> Clear Response
                </button>
              </div>

              <div className="ibps-btn-group-right">
                <button
                  type="button"
                  className="ibps-btn ibps-btn-prev"
                  onClick={handlePrev}
                  disabled={currentIndex === 0}
                >
                  <ChevronLeft size={15} /> Previous
                </button>
                 {/* Skip */}
                <button
                  type="button"
                  className="ibps-btn ibps-btn-skip"
                  onClick={handleSkip}
                  disabled={currentIndex === questions.length - 1}
                >
                  Skip
                </button>
                <button
                  type="button"
                  className="ibps-btn ibps-btn-savenext"
                  onClick={handleNext}
                >
                  Save & Next <ChevronRight size={15} />
                </button>
                <button
                  type="button"
                  className="ibps-btn ibps-btn-submit-main"
                  onClick={() => setShowSubmitModal(true)}
                >
                  Submit
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT: IBPS Question Palette Sidebar */}
          <aside className="ibps-sidebar">
            {/* Candidate Card */}
            <div className="ibps-candidate-card">
              <div className="ibps-candidate-avatar">
                <User size={30} />
              </div>
              <div className="ibps-candidate-details">
                <div className="ibps-candidate-name">{studentName.trim() || 'John Smith'}</div>
                {rollNo.trim() && <div className="ibps-candidate-roll">Roll No: {rollNo.trim()}</div>}
              </div>
            </div>

            {/* Status Legend Grid */}
            <div className="ibps-legend-container">
              <div className="ibps-legend-grid">
                <div className="ibps-legend-item">
                  <span className="ibps-legend-badge ibps-status-answered">
                    {statusCounts.answered}
                  </span>
                  <span>Answered</span>
                </div>
                <div className="ibps-legend-item">
                  <span className="ibps-legend-badge ibps-status-not-answered">
                    {statusCounts['not-answered']}
                  </span>
                  <span>Not Answered</span>
                </div>
                <div className="ibps-legend-item">
                  <span className="ibps-legend-badge ibps-status-not-visited">
                    {statusCounts['not-visited']}
                  </span>
                  <span>Not Visited</span>
                </div>
                <div className="ibps-legend-item">
                  <span className="ibps-legend-badge ibps-status-marked">
                    {statusCounts.marked}
                  </span>
                  <span>Marked for Review</span>
                </div>
                <div className="ibps-legend-item" style={{ gridColumn: 'span 2' }}>
                  <span className="ibps-legend-badge ibps-status-ans-marked">
                    {statusCounts['ans-marked']}
                  </span>
                  <span>Ans & Marked for Review</span>
                </div>
              </div>
            </div>

            {/* Question Palette Grid */}
            <div className="ibps-palette-header">
              {header.subject || 'Section'} — Choose a Question
            </div>

            <div className="ibps-palette-scroll">
              <div className="ibps-q-grid">
                {questions.map((q, idx) => {
                  const status = getQuestionStatus(q);
                  const isActive = idx === currentIndex;
                  return (
                    <button
                      key={q.id || idx}
                      type="button"
                      className={`ibps-q-btn ibps-status-${status} ${isActive ? 'active-q' : ''}`}
                      onClick={() => setCurrentIndex(idx)}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Footer Submit Button */}
            <div className="ibps-sidebar-footer">
              <button
                type="button"
                className="ibps-btn-full-submit"
                onClick={() => setShowSubmitModal(true)}
              >
                <Send size={15} /> Submit Test
              </button>
            </div>
          </aside>
        </div>
      ) : (
        /* FULL PAPER LIST VIEW (ALTERNATIVE MODE) */
        <main style={{ padding: '1.5rem', maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
          <div className="sp-student-card">
            <div className="sp-student-head">
              <div>
                <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1e3a8a' }}>
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
              <span>{answeredTotal} of {totalQuestions} answered</span>
              <div className="sp-student-progress-bar">
                <div style={{ width: `${totalQuestions ? (answeredTotal / totalQuestions) * 100 : 0}%` }} />
              </div>
            </div>

            <div className="sp-student-id-fields">
              <label className="sp-student-field">
                <span>Your Name *</span>
                <input value={studentName} onChange={(e) => setStudentName(e.target.value)} placeholder="Enter your full name" />
              </label>
              <label className="sp-student-field">
                <span>Roll No</span>
                <input value={rollNo} onChange={(e) => setRollNo(e.target.value)} placeholder="Optional" />
              </label>
            </div>

            <div className="sp-student-list">
              {questions.map((question) => (
                <StudentAnswerCard
                  key={question.id}
                  question={question}
                  value={answers[question.id]}
                  onChange={(value) => setAnswer(question.id, value)}
                />
              ))}
            </div>

            <div className="sp-student-submit-bar">
              <span style={{ flex: 1 }} />
              <button
                type="button"
                className="ibps-btn-full-submit"
                onClick={() => setShowSubmitModal(true)}
                style={{ width: 'auto', padding: '0.6rem 1.5rem' }}
              >
                Submit Exam <Send size={15} />
              </button>
            </div>
          </div>
        </main>
      )}

      {/* INSTRUCTIONS MODAL */}
      {showInstructions && (
        <div className="ibps-modal-overlay" onClick={() => setShowInstructions(false)}>
          <div className="ibps-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="ibps-modal-head">
              <h3><Info size={18} style={{ verticalAlign: 'middle', marginRight: '6px' }} /> Exam Instructions</h3>
              <button type="button" className="ibps-modal-close" onClick={() => setShowInstructions(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="ibps-modal-body">
              {header.instructions ? (
                <MarkdownText>{header.instructions}</MarkdownText>
              ) : (
                <p>No specific instructions provided for this paper. Please answer all questions carefully before submitting.</p>
              )}
              <hr style={{ margin: '1rem 0', borderColor: '#e2e8f0' }} />
              <h4>Question Palette Color Guidance:</h4>
              <ul style={{ fontSize: '0.88rem', color: '#475569', lineHeight: 1.6, paddingLeft: '1.2rem' }}>
                <li><strong style={{ color: '#22c55e' }}>Green:</strong> Answered question</li>
                <li><strong style={{ color: '#ef4444' }}>Red:</strong> Visited but unanswered question</li>
                <li><strong style={{ color: '#94a3b8' }}>Gray:</strong> Not visited question</li>
                <li><strong style={{ color: '#a855f7' }}>Purple:</strong> Marked for review</li>
              </ul>
            </div>
            <div className="ibps-modal-actions">
              <button
                type="button"
                className="ibps-btn ibps-btn-savenext"
                onClick={() => setShowInstructions(false)}
              >
                Close Instructions
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUBMIT CONFIRMATION MODAL */}
      {showSubmitModal && (
        <div className="ibps-modal-overlay" onClick={() => setShowSubmitModal(false)}>
          <div className="ibps-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="ibps-modal-head" style={{ background: '#0d9488' }}>
              <h3><FileText size={18} style={{ verticalAlign: 'middle', marginRight: '6px' }} /> Test Summary & Confirmation</h3>
              <button type="button" className="ibps-modal-close" onClick={() => setShowSubmitModal(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="ibps-modal-body">
              <p style={{ fontSize: '0.92rem', color: '#334155' }}>
                Are you sure you want to submit the examination? Below is your response summary:
              </p>

              <table className="ibps-summary-table">
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Count</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Total Questions</td>
                    <td><strong>{totalQuestions}</strong></td>
                  </tr>
                  <tr>
                    <td>Answered</td>
                    <td style={{ color: '#16a34a', fontWeight: 'bold' }}>{statusCounts.answered}</td>
                  </tr>
                  <tr>
                    <td>Answered & Marked for Review</td>
                    <td style={{ color: '#9333ea', fontWeight: 'bold' }}>{statusCounts['ans-marked']}</td>
                  </tr>
                  <tr>
                    <td>Marked for Review</td>
                    <td style={{ color: '#7e22ce' }}>{statusCounts.marked}</td>
                  </tr>
                  <tr>
                    <td>Not Answered</td>
                    <td style={{ color: '#dc2626' }}>{statusCounts['not-answered']}</td>
                  </tr>
                  <tr>
                    <td>Not Visited</td>
                    <td style={{ color: '#64748b' }}>{statusCounts['not-visited']}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="ibps-modal-actions">
              <button
                type="button"
                className="ibps-btn ibps-btn-clear"
                onClick={() => setShowSubmitModal(false)}
              >
                Back to Test
              </button>
              <button
                type="button"
                className="ibps-btn ibps-btn-submit-main"
                disabled={saving}
                onClick={handleSubmit}
              >
                {saving ? 'Submitting…' : 'Final Submit'} <Send size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}