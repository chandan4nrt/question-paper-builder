import { useState } from 'react';
import { Plus, AlignLeft, Shuffle, PenLine, ListChecks, CircleDot, Underline, Image, CheckCircle2, Sparkles } from 'lucide-react';
import { usePaper } from '../context/PaperContext';
import { QUESTION_TYPES } from '../types';
import { hasAiGeneration } from '../aiGeneration';
import { AiGenerateModal } from './AiGenerateModal';

const TYPE_CONFIG = [
  {
    type: QUESTION_TYPES.NORMAL,
    label: 'Normal Question',
    icon: <AlignLeft size={18} />,
    colorClass: 'blue',
    desc: 'Text-based question',
  },
  {
    type: QUESTION_TYPES.MATCH,
    label: 'Match the Following',
    icon: <Shuffle size={18} />,
    colorClass: 'green',
    desc: 'Two-column matching',
  },
  {
    type: QUESTION_TYPES.WRITING,
    label: 'Writing Practice',
    icon: <PenLine size={18} />,
    colorClass: 'pink',
    desc: 'Notebook-style lines',
  },
  {
    type: QUESTION_TYPES.MCQ,
    label: 'MCQ / Multiple Choice',
    icon: <ListChecks size={18} />,
    colorClass: 'yellow',
    desc: 'Choose the correct answer',
  },
  {
    type: QUESTION_TYPES.IMAGE_MCQ,
    label: 'Image-MCQ / Circle It',
    icon: <CircleDot size={18} />,
    colorClass: 'red',
    desc: 'Circle the picture',
  },
  {
    type: QUESTION_TYPES.FILL_BLANK,
    label: 'Fill in the Blanks',
    icon: <Underline size={18} />,
    colorClass: 'teal',
    desc: 'Complete the sentence',
  },
  {
    type: QUESTION_TYPES.LABEL,
    label: 'Picture Labeling',
    icon: <Image size={18} />,
    colorClass: 'violet',
    desc: 'Label the diagram',
  },
  {
    type: QUESTION_TYPES.TRUE_FALSE,
    label: 'True / False',
    icon: <CheckCircle2 size={18} />,
    colorClass: 'green',
    desc: 'Answer True or False',
  },
];

export function AddQuestionBar({ disabled = false }) {
  const { dispatch } = usePaper();
  const [generateType, setGenerateType] = useState(null);

  function addQuestion(type) {
    if (disabled) return;
    dispatch({ type: 'ADD_QUESTION', payload: { type } });
  }

  function handleTypeClick(config) {
    if (disabled) return;
    if (hasAiGeneration(config.type)) {
      setGenerateType(config);
    } else {
      addQuestion(config.type);
    }
  }

  const generateConfig = generateType && hasAiGeneration(generateType.type) ? generateType : null;

  return (
    <div className={`sp-sidebar-card${disabled ? ' sp-sidebar-disabled' : ''}`}>
      <div className="sp-sidebar-title">
        <span>Add Question</span>
      </div>
      <div className="sp-sidebar-row">
        {TYPE_CONFIG.map((config) => {
          const ai = hasAiGeneration(config.type);
          return (
            <button
              key={config.type}
              type="button"
              className={`sp-add-btn sp-sidebar-add ${config.colorClass}`}
              onClick={() => handleTypeClick(config)}
              disabled={disabled}
              title={disabled ? 'Switch to Editor to add questions' : undefined}
            >
              <span className={`sp-add-icon ${config.colorClass}`}>{config.icon}</span>
              <span className="sp-add-label">
                <b>{config.label}</b>
                <span>
                  {config.desc}
                  {ai && <em className="sp-ai-badge"> Generate with AI</em>}
                </span>
              </span>
              {ai ? (
                <Sparkles size={15} style={{ opacity: 0.7, marginLeft: 'auto' }} />
              ) : (
                <Plus size={15} style={{ opacity: 0.6, marginLeft: 'auto' }} />
              )}
            </button>
          );
        })}
      </div>

      {generateConfig && (
        <AiGenerateModal type={generateConfig.type} typeConfig={generateConfig} onClose={() => setGenerateType(null)} />
      )}
    </div>
  );
}