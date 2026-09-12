import { Plus, AlignLeft, Shuffle, PenLine, ListChecks, CircleDot, Underline, Image, CheckCircle2 } from 'lucide-react';
import { usePaper } from '../context/PaperContext';
import { QUESTION_TYPES } from '../types';

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

  function addQuestion(type) {
    if (disabled) return;
    dispatch({ type: 'ADD_QUESTION', payload: { type } });
  }

  return (
    <div className={`sp-sidebar-card${disabled ? ' sp-sidebar-disabled' : ''}`}>
      <div className="sp-sidebar-title">
        <span>Add Question</span>
      </div>
      <div className="sp-sidebar-row">
        {TYPE_CONFIG.map((config) => (
          <button
            key={config.type}
            type="button"
            className={`sp-add-btn sp-sidebar-add ${config.colorClass}`}
            onClick={() => addQuestion(config.type)}
            disabled={disabled}
            title={disabled ? 'Switch to Editor to add questions' : undefined}
          >
            <span className={`sp-add-icon ${config.colorClass}`}>{config.icon}</span>
            <span className="sp-add-label">
              <b>{config.label}</b>
              <span>{config.desc}</span>
            </span>
            <Plus size={15} style={{ opacity: 0.6, marginLeft: 'auto' }} />
          </button>
        ))}
      </div>
    </div>
  );
}