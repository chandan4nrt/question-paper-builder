import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, Loader2, X, Plus } from 'lucide-react';
import { usePaper } from '../context/PaperContext';
import { generateQuestions, extractGenerationError } from '../../../services/generationApi';
import {
  AI_ENDPOINTS,
  buildGenerationPayload,
  parseGeneratedQuestions,
} from '../aiGeneration';

const DIFFICULTIES = ['EASY', 'MEDIUM', 'HARD'];

export function AiGenerateModal({ type, typeConfig, onClose }) {
  const { state, dispatch, showToast } = usePaper();
  const endpoint = AI_ENDPOINTS[type];

  const [topic, setTopic] = useState('');
  const [numQuestions, setNumQuestions] = useState(5);
  const [gradeLevel, setGradeLevel] = useState(state.header.className ?? '');
  const [subject, setSubject] = useState(state.header.subject ?? '');
  const [difficulty, setDifficulty] = useState('MEDIUM');
  const [provider, setProvider] = useState('');
  const [extraInstructions, setExtraInstructions] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const canGenerate = topic.trim().length > 0 && !isLoading;

  function addBlankInstead() {
    dispatch({ type: 'ADD_QUESTION', payload: { type } });
    showToast('Blank question added.');
    onClose();
  }

  async function handleGenerate() {
    setError('');
    setIsLoading(true);
    try {
      const payload = buildGenerationPayload({
        numQuestions,
        topic,
        provider,
        gradeLevel,
        difficulty,
        subject,
        extraInstructions,
      });
      const data = await generateQuestions(endpoint, payload);
      const questions = parseGeneratedQuestions(type, data);
      if (questions.length === 0) {
        setError('The API returned no questions. Try a different topic or instructions.');
        return;
      }
      dispatch({ type: 'ADD_GENERATED_QUESTIONS', payload: { questions } });
      showToast(`✨ Added ${questions.length} ${typeConfig.label} question(s) from "${topic.trim()}".`);
      onClose();
    } catch (err) {
      setError(extractGenerationError(err));
    } finally {
      setIsLoading(false);
    }
  }

  return createPortal(
    <div className="modal-overlay" onClick={!isLoading ? onClose : undefined}>
      <div className="modal sp-ai-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span className={`sp-add-icon ${typeConfig.colorClass}`}><Sparkles size={16} /></span>
            Generate {typeConfig.label} with AI
          </h2>
          <button type="button" className="modal-close" onClick={onClose} disabled={isLoading} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="sp-ai-form">
          <label className="sp-field-label" style={{ display: 'block', marginBottom: '0.5rem' }}>
            Topic *
            <input
              className="sp-input"
              style={{ marginTop: '0.3rem' }}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Photosynthesis in plants"
              autoFocus
            />
          </label>

          <div className="sp-ai-grid">
            <label className="sp-field-label">
              Questions
              <input
                className="sp-input"
                type="number"
                min="1"
                max="50"
                value={numQuestions}
                onChange={(e) => setNumQuestions(Number(e.target.value))}
              />
            </label>

            <label className="sp-field-label">
              Grade Level
              <input
                className="sp-input"
                value={gradeLevel}
                onChange={(e) => setGradeLevel(e.target.value)}
                placeholder="e.g. Class 4"
              />
            </label>

            <label className="sp-field-label">
              Subject
              <input
                className="sp-input"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Science"
              />
            </label>

            <label className="sp-field-label">
              Difficulty
              <select className="sp-input" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                {DIFFICULTIES.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </label>

            <label className="sp-field-label">
              Provider (optional)
              <input
                className="sp-input"
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                placeholder="e.g. openai"
              />
            </label>

            <label className="sp-field-label">
              Additional text / context (optional)
              <textarea
                className="sp-input"
                rows="2"
                value={extraInstructions}
                onChange={(e) => setExtraInstructions(e.target.value)}
                placeholder="Extra instructions for the generator…"
              />
            </label>
          </div>
        </div>

        {error && <div className="alert alert-error" style={{ marginTop: '0.5rem' }}>{error}</div>}

        <div className="sp-theme-modal-actions sp-ai-actions">
          <button type="button" className="btn-ghost" onClick={addBlankInstead} disabled={isLoading}>
            <Plus size={15} /> Add empty question instead
          </button>
          <span style={{ flex: 1 }} />
          <button type="button" className="btn-secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </button>
          <button type="button" onClick={handleGenerate} disabled={!canGenerate}>
            {isLoading ? <Loader2 size={15} className="sp-spin" style={{ verticalAlign: 'middle' }} /> : <Sparkles size={15} style={{ verticalAlign: 'middle' }} />}
            <span style={{ marginLeft: '0.35rem' }}>{isLoading ? 'Generating…' : 'Generate'}</span>
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}