import { Fragment, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Loader2,
  AlertTriangle,
  LayoutDashboard,
  Upload,
  X,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  ListOrdered,
  ArrowRight,
  RefreshCw,
  Eye,
} from 'lucide-react';
import {
  BLOOM_LEVELS,
  BLOOM_IDS,
  QUESTION_TYPE_CONFIG,
  DIFFICULTIES,
  defaultTypeCounts,
  defaultTypeMarks,
  defaultBlueprint,
  blueprintTotal,
  totalQuestions,
  totalMarks,
  blueprintChartData,
} from '../bloom';
import { generateExam } from '../generation';
import { makeExamId, saveExam } from '../storage';
import { BlueprintChart } from '../components/BlueprintChart';
import { BloomLevelBadge } from '../components/BloomLevelBadge';
import { MarkdownText } from '../../set-paper/components/MarkdownText';

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

const PRESETS = [
  {
    id: 'balanced',
    label: 'Balanced',
    blueprint: { remember: 15, understand: 20, apply: 25, analyze: 20, evaluate: 10, create: 10 },
  },
  {
    id: 'application',
    label: 'Application-heavy',
    blueprint: { remember: 10, understand: 15, apply: 40, analyze: 20, evaluate: 10, create: 5 },
  },
  {
    id: 'assessment',
    label: 'Assessment (example)',
    blueprint: { remember: 20, understand: 0, apply: 50, analyze: 0, evaluate: 30, create: 0 },
  },
];

export function GeneratorPage() {
  const navigate = useNavigate();
  const [config, setConfig] = useState({
    title: '',
    subject: '',
    gradeLevel: '',
    topic: '',
    sourceText: '',
    difficulty: 'medium',
    extraInstructions: '',
    images: [],
    pdf: null,
    typeCounts: defaultTypeCounts(),
    typeMarks: defaultTypeMarks(),
    blueprint: defaultBlueprint(),
  });
  const [generating, setGenerating] = useState(false);
  const [status, setStatus] = useState('');
  const [fileError, setFileError] = useState('');
  const [genError, setGenError] = useState('');
  const [generatedExam, setGeneratedExam] = useState(null);
  const [rightSideTab, setRightSideTab] = useState('blueprint'); // 'blueprint' | 'questions'

  const numQuestions = totalQuestions(config.typeCounts);
  const marks = totalMarks(config.typeCounts, config.typeMarks);
  const bloomSum = blueprintTotal(config.blueprint);
  const blueprintValid = bloomSum === 100;
  const hasContent =
    Boolean(config.topic.trim()) ||
    Boolean(config.sourceText.trim()) ||
    (config.images && config.images.length > 0) ||
    Boolean(config.pdf);
  const canGenerate = !generating && numQuestions > 0 && blueprintValid && hasContent;

  function handleAddImages(fileList) {
    setFileError('');
    const files = Array.from(fileList ?? []);
    if (files.length === 0) return;
    const oversized = files.filter((file) => file.size > MAX_FILE_SIZE);
    if (oversized.length > 0) {
      setFileError(`Image "${oversized[0].name}" exceeds the 20 MB limit.`);
      return;
    }
    patch({ images: [...(config.images ?? []), ...files] });
  }

  function handleRemoveImage(index) {
    const next = [...(config.images ?? [])];
    next.splice(index, 1);
    patch({ images: next });
  }

  function handleAddPdf(file) {
    setFileError('');
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      setFileError(`PDF "${file.name}" exceeds the 20 MB limit.`);
      return;
    }
    if (file.type !== 'application/pdf') {
      setFileError('Only PDF files are allowed.');
      return;
    }
    patch({ pdf: file });
  }

  function handleRemovePdf() {
    patch({ pdf: null });
  }

  const chartData = useMemo(() => blueprintChartData(config.blueprint, numQuestions), [config.blueprint, numQuestions]);

  const legend = useMemo(() => {
    const avgMarks = numQuestions > 0 ? marks / numQuestions : 0;
    return BLOOM_LEVELS.map((level) => {
      const count = chartData[0][level.id];
      return {
        id: level.id,
        label: level.label,
        color: level.color,
        count,
        percent: Number(config.blueprint[level.id]) || 0,
        marksShare: count > 0 ? Math.round(avgMarks * count) : 0,
      };
    }).filter((row) => row.count > 0);
  }, [chartData, config.blueprint, marks, numQuestions]);

  function patch(piece) {
    setConfig((prev) => ({ ...prev, ...piece }));
  }

  function setTypeCount(typeId, value) {
    patch({ typeCounts: { ...config.typeCounts, [typeId]: Math.max(0, Math.min(50, value || 0)) } });
  }

  function setTypeMarks(typeId, value) {
    patch({ typeMarks: { ...config.typeMarks, [typeId]: Math.max(0.5, value || 0) } });
  }

  function setBloom(id, value) {
    const next = Math.max(0, Math.min(100, Number(value) || 0));
    patch({ blueprint: { ...config.blueprint, [id]: next } });
  }

  async function handleGenerate() {
    if (!canGenerate) return;
    setGenerating(true);
    setStatus('');
    setGenError('');
    try {
      const result = await generateExam(config, { onStatus: (text) => setStatus(text) });
      const exam = {
        examId: makeExamId(),
        title: config.title.trim() || `${config.topic.trim() || config.subject.trim() || 'Assessment'}`,
        config: {
          topic: config.topic.trim(),
          subject: config.subject.trim(),
          gradeLevel: config.gradeLevel.trim(),
          difficulty: config.difficulty,
          sourceText: config.sourceText.trim(),
          extraInstructions: config.extraInstructions.trim(),
          typeCounts: config.typeCounts,
          typeMarks: config.typeMarks,
          blueprint: config.blueprint,
        },
        numQuestions: result.questions.length,
        totalMarks: result.questions.reduce((sum, q) => sum + (Number(q.marks) || 0), 0),
        questions: result.questions,
        usedFallback: result.usedFallback,
        status: 'draft',
        publishedAt: null,
        createdAt: new Date().toISOString(),
      };
      saveExam(exam);
      setGeneratedExam(exam);
      setRightSideTab('questions');
    } catch (err) {
      setGenError(err?.message || 'Failed to generate questions using AI. Please try again.');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="page be-page">
      <div className="page-header">
        <div>
          <h1>AI Exam Generator</h1>
          <p>Configure the paper, tune the Bloom's blueprint, then generate a draft exam.</p>
        </div>
      </div>

      <div className="be-layout">
        <section className="be-config-card">
          <div className="be-section-title">
            <Sparkles size={15} /> Question plan
          </div>
          <div className="be-grid-2">
            <label className="be-field">
              <span>Assessment title</span>
              <input
                value={config.title}
                onChange={(e) => patch({ title: e.target.value })}
                placeholder="e.g. Term 1 Science Exam"
              />
            </label>
            <label className="be-field">
              <span>Subject</span>
              <input
                value={config.subject}
                onChange={(e) => patch({ subject: e.target.value })}
                placeholder="e.g. Science"
              />
            </label>
            <label className="be-field">
              <span>Grade level</span>
              <input
                value={config.gradeLevel}
                onChange={(e) => patch({ gradeLevel: e.target.value })}
                placeholder="e.g. Class 6"
              />
            </label>
            <label className="be-field">
              <span>Difficulty</span>
              <select value={config.difficulty} onChange={(e) => patch({ difficulty: e.target.value })}>
                {DIFFICULTIES.map((option) => (
                  <option key={option.id} value={option.id}>{option.label}</option>
                ))}
              </select>
            </label>
          </div>

          <label className="be-field">
            <span>Topic</span>
            <input
              value={config.topic}
              onChange={(e) => patch({ topic: e.target.value })}
              placeholder="e.g. Photosynthesis"
            />
          </label>

          <label className="be-field">
            <span>Source / domain text</span>
            <textarea
              rows={4}
              value={config.sourceText}
              onChange={(e) => patch({ sourceText: e.target.value })}
              placeholder="Paste a lesson excerpt, chapter text or domain paragraph the questions should be drawn from (optional)."
            />
          </label>

          <div className="be-field">
            <span>Reference material (optional) — max 20 MB per file</span>
            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center', marginTop: '0.35rem' }}>
              <label
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.45rem 0.85rem',
                  borderRadius: 8,
                  border: '1px dashed #cbd5e1',
                  background: '#f8fafc',
                  fontSize: '0.82rem',
                  fontWeight: 500,
                  color: '#475569',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <Upload size={14} /> Upload image(s)
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  style={{ display: 'none' }}
                  onChange={(e) => handleAddImages(e.target.files)}
                />
              </label>

              <label
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.45rem 0.85rem',
                  borderRadius: 8,
                  border: '1px dashed #cbd5e1',
                  background: '#f8fafc',
                  fontSize: '0.82rem',
                  fontWeight: 500,
                  color: '#475569',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <Upload size={14} /> Upload PDF
                <input
                  type="file"
                  accept="application/pdf"
                  style={{ display: 'none' }}
                  onChange={(e) => handleAddPdf(e.target.files?.[0])}
                />
              </label>
            </div>

            {((config.images && config.images.length > 0) || config.pdf) && (
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.6rem' }}>
                {(config.images ?? []).map((file, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.25rem 0.55rem',
                      borderRadius: 6,
                      background: '#eff6ff',
                      border: '1px solid #bfdbfe',
                      fontSize: '0.78rem',
                      color: '#1e40af',
                    }}
                  >
                    <ImageIcon size={13} />
                    <span>{file.name}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      style={{ border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', color: '#1e40af', display: 'flex' }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
                {config.pdf && (
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.25rem 0.55rem',
                      borderRadius: 6,
                      background: '#fef2f2',
                      border: '1px solid #fecaca',
                      fontSize: '0.78rem',
                      color: '#991b1b',
                    }}
                  >
                    <FileText size={13} />
                    <span>{config.pdf.name}</span>
                    <button
                      type="button"
                      onClick={handleRemovePdf}
                      style={{ border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', color: '#991b1b', display: 'flex' }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}
              </div>
            )}

            {fileError && (
              <div className="alert alert-error" style={{ marginTop: '0.5rem', padding: '0.4rem 0.6rem', fontSize: '0.8rem' }}>
                {fileError}
              </div>
            )}
          </div>

          <div className="be-section-title-small">Question types</div>
          <div className="be-type-rows">
            {QUESTION_TYPE_CONFIG.map((type) => (
              <div key={type.id} className="be-type-row">
                <div className="be-type-info">
                  <strong>{type.label}</strong>
                  <span className="help-text">{type.hint}</span>
                </div>
                <label className="be-num">
                  <span>Count</span>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={config.typeCounts[type.id]}
                    onChange={(e) => setTypeCount(type.id, Number(e.target.value))}
                  />
                </label>
                <label className="be-num">
                  <span>Marks</span>
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={config.typeMarks[type.id]}
                    onChange={(e) => setTypeMarks(type.id, Number(e.target.value))}
                  />
                </label>
              </div>
            ))}
          </div>

          <label className="be-field">
            <span>Extra instructions (optional)</span>
            <textarea
              rows={2}
              value={config.extraInstructions}
              onChange={(e) => patch({ extraInstructions: e.target.value })}
              placeholder="Any additional guidance for the generator…"
            />
          </label>

          <div className="be-presets">
            <span className="be-field-label">Blueprint presets</span>
            <div className="be-preset-row">
              {PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  className="be-preset-btn"
                  onClick={() => patch({ blueprint: { ...preset.blueprint } })}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="be-blank" />

          {!hasContent && (
            <div className="alert alert-warning">Add a topic, source text, image, or PDF reference material to generate questions.</div>
          )}
          {!blueprintValid && (
            <div className="alert alert-warning">
              <AlertTriangle size={13} style={{ verticalAlign: 'middle', marginRight: '0.25rem' }} />
              Bloom's blueprint must total <strong>100%</strong> (currently {bloomSum}%).
            </div>
          )}

          {genError && (
            <div className="alert alert-error" style={{ marginBottom: '1rem', padding: '0.6rem 0.8rem', fontSize: '0.85rem' }}>
              <AlertTriangle size={14} style={{ verticalAlign: 'middle', marginRight: '0.35rem' }} />
              {genError}
            </div>
          )}

          <div className="be-generate-row">
            <button type="button" className="be-generate-btn" onClick={handleGenerate} disabled={!canGenerate}>
              {generating ? <Loader2 size={16} className="be-spin" /> : <LayoutDashboard size={16} />}
              {generating ? status || 'Generating…' : 'Generate Exam'}
            </button>
          </div>
        </section>

        <aside className="be-blueprint-panel">
          {generatedExam && (
            <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
              <button
                type="button"
                className={`btn-secondary btn-sm ${rightSideTab === 'blueprint' ? 'active' : ''}`}
                style={{ flex: 1, fontWeight: rightSideTab === 'blueprint' ? 700 : 500 }}
                onClick={() => setRightSideTab('blueprint')}
              >
                Blueprint
              </button>
              <button
                type="button"
                className={`btn-secondary btn-sm ${rightSideTab === 'questions' ? 'active' : ''}`}
                style={{ flex: 1, fontWeight: rightSideTab === 'questions' ? 700 : 500, background: rightSideTab === 'questions' ? '#f0fdf4' : undefined, color: rightSideTab === 'questions' ? '#166534' : undefined }}
                onClick={() => setRightSideTab('questions')}
              >
                Questions ({generatedExam.questions.length})
              </button>
            </div>
          )}

          {rightSideTab === 'questions' && generatedExam ? (
            <div>
              <div className="be-section-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span><ListOrdered size={15} /> Question Menu</span>
                <span className="be-meta-pill" style={{ fontSize: '0.75rem', background: '#dcfce7', color: '#15803d', fontWeight: 700 }}>
                  {generatedExam.questions.length} Items
                </span>
              </div>
              <p className="help-text">Click any question to view details below or open full review.</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '420px', overflowY: 'auto', margin: '0.75rem 0' }}>
                {generatedExam.questions.map((q, idx) => (
                  <a
                    key={q.id || idx}
                    href={`#gen-q-${idx}`}
                    style={{
                      padding: '0.55rem 0.75rem',
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '0.82rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      textDecoration: 'none',
                      color: 'inherit',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <strong style={{ color: '#1e293b', minWidth: '1.4rem' }}>Q{idx + 1}</strong>
                    <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#334155' }}>
                      {q.text}
                    </span>
                    <BloomLevelBadge level={q.bloomLevel} />
                  </a>
                ))}
              </div>

              <button
                type="button"
                className="be-generate-btn"
                style={{ width: '100%', marginTop: '0.5rem', fontSize: '0.88rem' }}
                onClick={() => navigate(`/staff/bloom-generator/review/${generatedExam.examId}`)}
              >
                Review & Publish <ArrowRight size={14} style={{ verticalAlign: 'middle', marginLeft: '4px' }} />
              </button>
            </div>
          ) : (
            <>
              <div className="be-section-title">
                <Sparkles size={15} /> Assessment blueprint
              </div>
              <p className="help-text">
                Percentage distribution of questions across Bloom's cognitive levels. Tune the sliders below — the chart
                updates before the exam is generated.
              </p>

              <div className="be-blueprint-editors">
                {BLOOM_IDS.map((id) => {
                  const level = BLOOM_LEVELS.find((l) => l.id === id);
                  const value = Number(config.blueprint[id]) || 0;
                  return (
                    <Fragment key={id}>
                      <div className="be-level-editor">
                        <span className="be-level-dot" style={{ background: level.color }} />
                        <span className="be-level-label">{level.label}</span>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="5"
                          value={value}
                          onChange={(e) => setBloom(id, e.target.value)}
                          style={{ accentColor: level.color }}
                        />
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="5"
                          value={value}
                          onChange={(e) => setBloom(id, e.target.value)}
                          className="be-pct-input"
                        />
                        <span className="be-pct-symbol">%</span>
                      </div>
                    </Fragment>
                  );
                })}
              </div>

              <div className={`be-blueprint-total ${blueprintValid ? 'be-blueprint-ok' : 'be-blueprint-bad'}`}>
                Total: <strong>{bloomSum}%</strong> {blueprintValid ? '· ready to generate' : '· must equal 100%'}
              </div>

              <div className="be-blueprint-chart-box">
                <BlueprintChart data={chartData} legend={legend} />
              </div>

              <div className="be-summary-strip">
                <div><strong>{numQuestions}</strong><span>questions</span></div>
                <div><strong>{marks}</strong><span>marks</span></div>
                {numQuestions > 0 && (
                  <div><strong>{(marks / numQuestions).toFixed(1)}</strong><span>avg marks</span></div>
                )}
              </div>
            </>
          )}
        </aside>
      </div>

      {/* GENERATED QUESTIONS MENU & SHOWCASE CARD ON GENERATOR PAGE */}
      {generatedExam && (
        <section
          style={{
            marginTop: '2rem',
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '12px',
            padding: '1.5rem',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
          }}
        >
          <header
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.25rem',
              flexWrap: 'wrap',
              gap: '0.75rem',
              borderBottom: '1px solid #e2e8f0',
              paddingBottom: '1rem',
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  color: '#0f172a',
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                }}
              >
                <CheckCircle2 size={22} color="#16a34a" /> Generated Questions List ({generatedExam.questions.length})
              </h2>
              <p className="muted" style={{ fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>
                {generatedExam.title} · {generatedExam.totalMarks} total marks · {[generatedExam.config?.subject, generatedExam.config?.gradeLevel].filter(Boolean).join(' · ')}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
              <button
                type="button"
                className="btn-secondary btn-sm"
                onClick={() => setGeneratedExam(null)}
              >
                <RefreshCw size={13} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                Generate New
              </button>
              <button
                type="button"
                className="be-generate-btn"
                style={{ padding: '0.5rem 1.1rem', fontSize: '0.88rem' }}
                onClick={() => navigate(`/staff/bloom-generator/review/${generatedExam.examId}`)}
              >
                Open Full Review & Publish <ArrowRight size={14} style={{ verticalAlign: 'middle', marginLeft: '4px' }} />
              </button>
            </div>
          </header>

          <div className="be-review-list" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {generatedExam.questions.map((question, index) => (
              <article
                id={`gen-q-${index}`}
                key={question.id || index}
                className="be-review-card"
                style={{
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: '10px',
                  padding: '1.25rem',
                }}
              >
                <header
                  className="be-review-head"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    marginBottom: '0.85rem',
                    flexWrap: 'wrap',
                  }}
                >
                  <span className="be-q-no" style={{ fontWeight: 800, color: '#1e293b' }}>
                    Q{index + 1}
                  </span>
                  <span className="be-type-chip">
                    {QUESTION_TYPE_CONFIG.find((t) => t.id === question.type)?.label ?? question.type}
                  </span>
                  <BloomLevelBadge level={question.bloomLevel} />
                  <span style={{ flex: 1 }} />
                  <span className="be-mark-pill">
                    {question.marks} mark{question.marks === 1 ? '' : 's'}
                  </span>
                </header>

                <div className="be-review-body">
                  <div
                    style={{
                      fontSize: '1rem',
                      fontWeight: 600,
                      color: '#0f172a',
                      marginBottom: '0.75rem',
                      lineHeight: 1.5,
                    }}
                  >
                    <MarkdownText>{question.text}</MarkdownText>
                  </div>

                  {question.type === 'mcq' && Array.isArray(question.options) && (
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                        gap: '0.6rem',
                        marginTop: '0.6rem',
                      }}
                    >
                      {question.options.map((opt, oi) => {
                        const isCorrect = question.correctOptionId === opt.id;
                        return (
                          <div
                            key={opt.id || oi}
                            style={{
                              padding: '0.55rem 0.85rem',
                              borderRadius: '6px',
                              fontSize: '0.88rem',
                              background: isCorrect ? '#f0fdf4' : '#ffffff',
                              border: isCorrect ? '1.5px solid #22c55e' : '1px solid #cbd5e1',
                              color: isCorrect ? '#15803d' : '#334155',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                            }}
                          >
                            <strong style={{ opacity: 0.7 }}>
                              {String.fromCharCode(65 + oi)}.
                            </strong>
                            <MarkdownText inline>{opt.label}</MarkdownText>
                            {isCorrect && (
                              <span
                                style={{
                                  marginLeft: 'auto',
                                  fontWeight: 700,
                                  fontSize: '0.75rem',
                                  color: '#16a34a',
                                }}
                              >
                                ✓ Correct
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {question.expectedAnswer && (
                    <div
                      style={{
                        marginTop: '0.75rem',
                        fontSize: '0.88rem',
                        background: '#ffffff',
                        padding: '0.65rem 0.85rem',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        color: '#1e293b',
                      }}
                    >
                      <strong style={{ color: '#0f172a' }}>Expected Answer: </strong>
                      <MarkdownText inline>{question.expectedAnswer}</MarkdownText>
                    </div>
                  )}

                  {question.explanation && (
                    <div
                      style={{
                        marginTop: '0.75rem',
                        fontSize: '0.85rem',
                        background: '#eff6ff',
                        padding: '0.65rem 0.85rem',
                        borderRadius: '6px',
                        borderLeft: '4px solid #3b82f6',
                        color: '#1e40af',
                      }}
                    >
                      <strong>Explanation: </strong>
                      <MarkdownText inline>{question.explanation}</MarkdownText>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}