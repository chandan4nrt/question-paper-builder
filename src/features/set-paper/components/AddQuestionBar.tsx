import { useState } from 'react';
import { Plus, ChevronDown, AlignLeft, Shuffle, PenLine, BookOpen, ListChecks, CircleDot, Underline, Image } from 'lucide-react';
import { usePaper } from '../context/PaperContext';
import { QUESTION_TYPES, type QuestionType } from '../types';
import { TEMPLATES, shuffleArray, type PaperTemplate } from '../helpers';
import { ThemePanel } from './ThemePanel';

const TYPE_CONFIG: {
  type: QuestionType;
  label: string;
  icon: React.ReactNode;
  colorClass: string;
  desc: string;
}[] = [
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
];

export function AddQuestionBar() {
  const { dispatch } = usePaper();
  const [showTemplates, setShowTemplates] = useState(false);
  const [typeConfigs, setTypeConfigs] = useState(TYPE_CONFIG);

  function shuffleTypes() {
    setTypeConfigs(shuffleArray(typeConfigs));
  }

  function addQuestion(type: QuestionType) {
    dispatch({ type: 'ADD_QUESTION', payload: { type } });
  }

  function loadTemplate(template: PaperTemplate) {
    template.questions.forEach((q, i) => {
      setTimeout(() => {
        dispatch({
          type: 'ADD_QUESTION',
          payload: {
            type: q.type,
            data: {
              text: q.text,
              marks: q.marks,
              ...(q.lines != null ? { lines: q.lines } : {}),
              ...(q.sampleText != null ? { sampleText: q.sampleText } : {}),
              ...(q.options ? { options: q.options.map((o) => ({ ...o })) } : {}),
              ...(q.image !== undefined ? { image: q.image } : {}),
              ...(q.blankCount != null ? { blankCount: q.blankCount } : {}),
              ...(q.partCount != null ? { partCount: q.partCount } : {}),
            },
          },
        });
      }, i * 100);
    });
    setShowTemplates(false);
  }

  return (
    <aside className="sp-sidebar">
      <div className="sp-sidebar-card">
        <div className="sp-sidebar-title">
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <BookOpen size={15} color="#FFB199" /> Add Question
          </span>
          <button
            type="button"
            className="sp-mini-btn blue"
            onClick={shuffleTypes}
            title="Shuffle question types"
            style={{ marginLeft: 'auto' }}
          >
            <Shuffle size={12} /> Shuffle
          </button>
        </div>
        <div className="sp-sidebar-row">
          {typeConfigs.map((config) => (
            <button
              key={config.type}
              type="button"
              className={`sp-add-btn sp-sidebar-add ${config.colorClass}`}
              onClick={() => addQuestion(config.type)}
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

      <ThemePanel />

      <div className="sp-sidebar-card">
        <button
          type="button"
          className="sp-sidebar-title"
          style={{ width: '100%', justifyContent: 'space-between', background: 'none', border: 'none', cursor: 'pointer' }}
          onClick={() => setShowTemplates((s) => !s)}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <BookOpen size={15} color="#E85D3F" /> Templates
          </span>
          <ChevronDown
            size={15}
            style={{ transform: showTemplates ? 'rotate(180deg)' : 'none' }}
          />
        </button>
        {showTemplates && (
          <div className="sp-template-stack">
            {TEMPLATES.map((template) => (
              <button
                key={template.name}
                type="button"
                className="sp-template-card"
                onClick={() => loadTemplate(template)}
              >
                <b>{template.name}</b>
                <span className="desc">{template.description}</span>
                <span className="qty">{template.questions.length} questions</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
