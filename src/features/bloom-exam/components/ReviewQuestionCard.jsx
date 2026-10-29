import { useState } from 'react';
import { ChevronDown, ChevronRight, RefreshCw, Lightbulb, Sparkles } from 'lucide-react';
import { BloomLevelBadge } from './BloomLevelBadge';
import { QUESTION_TYPE_CONFIG } from '../bloom';

const DIFFICULTY_LABELS = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };

export function ReviewQuestionCard({ question, index, onUpdate, onRegenerate }) {
  const [explanationOpen, setExplanationOpen] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const typeConfig = QUESTION_TYPE_CONFIG.find((type) => type.id === question.type);
  const typeLabel = typeConfig?.label ?? question.type;

  function set(patch) {
    onUpdate({ ...question, ...patch });
  }

  function setOption(optionId, label) {
    set({
      options: question.options.map((option) =>
        option.id === optionId ? { ...option, label } : option,
      ),
    });
  }

  async function handleRegenerate() {
    if (!onRegenerate || isRegenerating) return;
    setIsRegenerating(true);
    try {
      await onRegenerate(index);
    } finally {
      setIsRegenerating(false);
    }
  }

  return (
    <article className="be-review-card">
      <header className="be-review-head">
        <span className="be-q-no">{index + 1}</span>
        <span className="be-type-chip">{typeLabel}</span>
        <BloomLevelBadge level={question.bloomLevel} onSelect={(level) => set({ bloomLevel: level })} />
        <span className={`be-difficulty be-difficulty-${question.difficulty ?? 'medium'}`}>
          {DIFFICULTY_LABELS[question.difficulty] ?? 'Medium'}
        </span>
        {question.source === 'sample' && (
          <span className="be-sample-badge" title="Generated from sample data because the AI service was unreachable.">
            <Sparkles size={11} /> sample
          </span>
        )}
        <span className="be-mark-pill">{question.marks} mark{question.marks === 1 ? '' : 's'}</span>
        <span style={{ flex: 1 }} />
        <button
          type="button"
          className="be-regenerate"
          onClick={handleRegenerate}
          disabled={isRegenerating}
          title="Regenerate this question"
        >
          <RefreshCw size={14} className={isRegenerating ? 'be-spin' : ''} />
          {isRegenerating ? 'Regenerating…' : 'Regenerate'}
        </button>
      </header>

      <div className="be-review-body">
        <label className="be-field">
          <span>Question</span>
          <textarea
            rows={question.type === 'scenario' ? 4 : 3}
            value={question.text}
            onChange={(e) => set({ text: e.target.value })}
          />
        </label>

        {question.type === 'mcq' && (
          <div className="be-options-editor">
            <span className="be-field-label">Options</span>
            {question.options?.map((option) => {
              const isCorrect = question.correctOptionId === option.id;
              return (
                <div key={option.id} className={`be-option-row ${isCorrect ? 'be-option-correct' : ''}`}>
                  <label className="be-option-radio" title="Mark as correct answer">
                    <input
                      type="radio"
                      name={`correct-${question.id}`}
                      checked={isCorrect}
                      onChange={() => set({ correctOptionId: option.id })}
                    />
                  </label>
                  <input
                    type="text"
                    value={option.label}
                    onChange={(e) => setOption(option.id, e.target.value)}
                  />
                  {isCorrect && <span className="be-option-tag">correct</span>}
                </div>
              );
            })}
          </div>
        )}

        {(question.type === 'short' || question.type === 'scenario') && (
          <label className="be-field">
            <span>Expected answer</span>
            <textarea
              rows={question.type === 'scenario' ? 3 : 2}
              value={question.expectedAnswer}
              onChange={(e) => set({ expectedAnswer: e.target.value })}
            />
          </label>
        )}

        <button
          type="button"
          className="be-explanation-toggle"
          onClick={() => setExplanationOpen((open) => !open)}
        >
          {explanationOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          <Lightbulb size={14} />
          Explanation
          <span className="be-explanation-badge">{explanationOpen ? 'hide' : 'show'}</span>
        </button>
        {explanationOpen && (
          <label className="be-field be-explanation-field">
            <span>Explanation</span>
            <textarea
              rows={3}
              value={question.explanation}
              onChange={(e) => set({ explanation: e.target.value })}
              placeholder="Explain why this is correct and what a good response should demonstrate…"
            />
          </label>
        )}

        <div className="be-meta-row">
          <label>
            <span>Marks</span>
            <input
              type="number"
              min="0"
              step="0.5"
              value={question.marks}
              onChange={(e) => set({ marks: Number(e.target.value) })}
            />
          </label>
          <label>
            <span>Difficulty</span>
            <select
              value={question.difficulty ?? 'medium'}
              onChange={(e) => set({ difficulty: e.target.value })}
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </label>
        </div>
      </div>
    </article>
  );
}