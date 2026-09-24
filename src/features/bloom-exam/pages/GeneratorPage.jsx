import { Fragment, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Loader2, AlertTriangle, LayoutDashboard } from 'lucide-react';
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
    typeCounts: defaultTypeCounts(),
    typeMarks: defaultTypeMarks(),
    blueprint: defaultBlueprint(),
  });
  const [generating, setGenerating] = useState(false);
  const [status, setStatus] = useState('');

  const numQuestions = totalQuestions(config.typeCounts);
  const marks = totalMarks(config.typeCounts, config.typeMarks);
  const bloomSum = blueprintTotal(config.blueprint);
  const blueprintValid = bloomSum === 100;
  const hasContent = Boolean(config.topic.trim()) || Boolean(config.sourceText.trim());
  const canGenerate = !generating && numQuestions > 0 && blueprintValid && hasContent;

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
      navigate(`/staff/bloom-generator/review/${exam.examId}`);
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
            <div className="alert alert-warning">Add a topic or source/domain text to generate questions.</div>
          )}
          {!blueprintValid && (
            <div className="alert alert-warning">
              <AlertTriangle size={13} style={{ verticalAlign: 'middle', marginRight: '0.25rem' }} />
              Bloom's blueprint must total <strong>100%</strong> (currently {bloomSum}%).
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
        </aside>
      </div>

    </div>
  );
}