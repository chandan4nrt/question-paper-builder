import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, Loader2, X, Plus, ImagePlus, FileText, Trash2, Upload } from 'lucide-react';
import { usePaper } from '../context/PaperContext';
import { generateQuestions, extractGenerationError } from '../../../services/generationApi';
import {
  AI_ENDPOINTS,
  buildGenerationPayload,
  parseGeneratedQuestions,
  MAX_FILE_SIZE,
} from '../aiGeneration';

const DIFFICULTIES = ['easy', 'medium', 'hard'];

function formatBytes(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / 1024).toFixed(0)} KB`;
}

export function AiGenerateModal({ type, typeConfig, onClose }) {
  const { state, dispatch, showToast } = usePaper();
  const endpoint = AI_ENDPOINTS[type];

  const [topic, setTopic] = useState('');
  const [numQuestions, setNumQuestions] = useState(5);
  const [gradeLevel, setGradeLevel] = useState(state.header.className ?? '');
  const [subject, setSubject] = useState(state.header.subject ?? '');
  const [difficulty, setDifficulty] = useState('medium');
  const [extraInstructions, setExtraInstructions] = useState('');
  const [images, setImages] = useState([]);
  const [pdf, setPdf] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const canGenerate = (topic.trim().length > 0 || images.length > 0 || Boolean(pdf)) && !isLoading;

  function addBlankInstead() {
    dispatch({ type: 'ADD_QUESTION', payload: { type } });
    showToast('Blank question added.');
    onClose();
  }

  function handleAddImages(fileList) {
    const files = Array.from(fileList ?? []);
    if (files.length === 0) return;
    const oversized = files.filter((file) => file.size > MAX_FILE_SIZE);
    if (oversized.length > 0) {
      setError(`Image "${oversized[0].name}" exceeds the 20 MB limit.`);
      return;
    }
    setImages((prev) => [...prev, ...files]);
  }

  function handleAddPdf(file) {
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      setError(`PDF "${file.name}" exceeds the 20 MB limit.`);
      return;
    }
    if (file.type !== 'application/pdf') {
      setError('Only PDF files are allowed.');
      return;
    }
    setPdf(file);
  }

  async function handleGenerate() {
    setError('');
    setIsLoading(true);
    try {
      const payload = buildGenerationPayload({
        numQuestions,
        topic,
        gradeLevel,
        difficulty,
        subject,
        extraInstructions,
        images,
        pdf,
      });
      console.log('AI quiz payload:', {
        endpoint,
        fields: Object.fromEntries(payload.entries()),
        files: images.map((f) => ({ name: f.name, size: f.size, type: f.type })),
        pdf: pdf ? { name: pdf.name, size: pdf.size, type: pdf.type } : null,
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

          <div className="sp-ai-uploads">
            <label className="sp-field-label" style={{ display: 'block', marginBottom: '0.5rem' }}>
              Reference material (optional) — max 20 MB per file
            </label>

            <div className="sp-ai-upload-row">
              <label className="sp-ai-upload-btn">
                <Upload size={15} />
                <span>Upload image(s)</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    handleAddImages(e.target.files);
                    e.target.value = '';
                  }}
                />
              </label>
              <label className="sp-ai-upload-btn">
                <Upload size={15} />
                <span>Upload PDF</span>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => {
                    handleAddPdf(e.target.files?.[0]);
                    e.target.value = '';
                  }}
                />
              </label>
            </div>

            {images.length > 0 && (
              <div className="sp-ai-upload-list">
                {images.map((file, index) => (
                  <div key={`${file.name}-${index}`} className="sp-ai-upload-item">
                    <ImagePlus size={14} />
                    <span className="sp-ai-upload-name" title={file.name}>{file.name}</span>
                    <span className="sp-ai-upload-size">{formatBytes(file.size)}</span>
                    <button
                      type="button"
                      className="sp-ai-upload-remove"
                      onClick={() => setImages((prev) => prev.filter((_, i) => i !== index))}
                      disabled={isLoading}
                      aria-label="Remove image"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {pdf && (
              <div className="sp-ai-upload-list">
                <div className="sp-ai-upload-item">
                  <FileText size={14} />
                  <span className="sp-ai-upload-name" title={pdf.name}>{pdf.name}</span>
                  <span className="sp-ai-upload-size">{formatBytes(pdf.size)}</span>
                  <button
                    type="button"
                    className="sp-ai-upload-remove"
                    onClick={() => setPdf(null)}
                    disabled={isLoading}
                    aria-label="Remove PDF"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            )}
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