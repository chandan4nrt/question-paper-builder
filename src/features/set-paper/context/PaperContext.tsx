import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useState,
  type ReactNode,
  type Dispatch,
} from 'react';
import { QUESTION_TYPES, type LabelMarker, type PaperState, type PaperTheme, type Question, type QuestionType } from '../types';

const PaperContext = createContext<{
  state: PaperState;
  dispatch: Dispatch<PaperAction>;
  totalMarks: number;
  QUESTION_TYPES: typeof QUESTION_TYPES;
  showToast: (message: string) => void;
} | null>(null);

const DRAFT_KEY = 'playschool-paper-draft';
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

function today(): string {
  return new Date().toISOString().split('T')[0];
}

function defaultLabelMarkers(count: number): LabelMarker[] {
  const spots = [
    { x: 30, y: 30 },
    { x: 70, y: 30 },
    { x: 30, y: 70 },
    { x: 70, y: 70 },
    { x: 50, y: 20 },
    { x: 20, y: 50 },
    { x: 80, y: 50 },
    { x: 50, y: 80 },
    { x: 15, y: 85 },
    { x: 85, y: 85 },
    { x: 85, y: 15 },
    { x: 15, y: 15 },
  ];
  return Array.from({ length: count }, (_, i) => ({
    id: `lm-${Date.now()}-${i}`,
    x: spots[i % spots.length].x,
    y: spots[i % spots.length].y,
  }));
}

const initialState: PaperState = {
  header: {
    schoolName: 'Sunshine Playschool',
    className: 'Nursery',
    subject: 'English',
    exam: 'Mid-Term',
    academicYear: '2025-2026',
    date: today(),
    totalMarks: 0,
    duration: '30 Minutes',
    teacherName: 'Mr. Chandan',
    instructions: 'Read each question carefully before answering.',
    logo: null,
  },
  questions: [],
  theme: 'colorful',
  nextId: 1,
};

export type PaperAction =
  | { type: 'SET_HEADER'; payload: Partial<PaperState['header']> }
  | { type: 'ADD_QUESTION'; payload: { type: QuestionType; data?: Partial<Question> } }
  | { type: 'UPDATE_QUESTION'; payload: { id: number; data: Partial<Question> } }
  | { type: 'DELETE_QUESTION'; payload: number }
  | { type: 'REORDER_QUESTIONS'; payload: Question[] }
  | { type: 'SET_THEME'; payload: PaperState['theme'] }
  | { type: 'GENERATE_FROM_THEME'; payload: PaperTheme }
  | { type: 'LOAD_DRAFT'; payload: PaperState }
  | { type: 'RESET' };

function newQuestion(nextId: number, number: number, type: QuestionType): Question {
  const base: Question = {
    id: nextId,
    number,
    type,
    text: '',
    marks: 1,
  };
  if (type === QUESTION_TYPES.MATCH) {
    base.leftItems = [
      { id: 'l1', label: '', image: null },
      { id: 'l2', label: '', image: null },
    ];
    base.rightItems = [
      { id: 'r1', label: 'Apple' },
      { id: 'r2', label: 'Banana' },
    ];
  }
  if (type === QUESTION_TYPES.MCQ) {
    base.options = [
      { id: 'o1', label: '' },
      { id: 'o2', label: '' },
      { id: 'o3', label: '' },
      { id: 'o4', label: '' },
    ];
  }
  if (type === QUESTION_TYPES.IMAGE_MCQ) {
    base.options = [
      { id: 'o1', label: '', image: null },
      { id: 'o2', label: '', image: null },
      { id: 'o3', label: '', image: null },
      { id: 'o4', label: '', image: null },
    ];
  }
  if (type === QUESTION_TYPES.FILL_BLANK) {
    base.blankCount = 1;
    base.items = [''];
  }
  if (type === QUESTION_TYPES.LABEL) {
    base.image = null;
    base.partCount = 4;
    base.labelMarkers = defaultLabelMarkers(4);
  }
  if (type === QUESTION_TYPES.WRITING) {
    base.lines = 4;
    base.sampleText = '';
  }
  return base;
}

function paperReducer(state: PaperState, action: PaperAction): PaperState {
  switch (action.type) {
    case 'SET_HEADER':
      return { ...state, header: { ...state.header, ...action.payload } };

    case 'ADD_QUESTION': {
      const q = newQuestion(state.nextId, state.questions.length + 1, action.payload.type);
      const merged = action.payload.data ? { ...q, ...action.payload.data } : q;
      return {
        ...state,
        questions: [...state.questions, merged],
        nextId: state.nextId + 1,
      };
    }

    case 'UPDATE_QUESTION':
      return {
        ...state,
        questions: state.questions.map((q) =>
          q.id === action.payload.id ? { ...q, ...action.payload.data } : q,
        ),
      };

    case 'DELETE_QUESTION': {
      const filtered = state.questions.filter((q) => q.id !== action.payload);
      return {
        ...state,
        questions: filtered.map((q, i) => ({ ...q, number: i + 1 })),
      };
    }

    case 'REORDER_QUESTIONS': {
      const reordered = action.payload.map((q, i) => ({ ...q, number: i + 1 }));
      return { ...state, questions: reordered };
    }

    case 'SET_THEME':
      return { ...state, theme: action.payload };

    case 'GENERATE_FROM_THEME': {
      const questions: Question[] = [];
      let id = 1;
      let number = 1;
      action.payload.questions.forEach((cfg) => {
        if (cfg.count <= 0) return;
        for (let i = 0; i < cfg.count; i++) {
          const q = newQuestion(id, number, cfg.type);
          q.marks = cfg.marks;
          questions.push(q);
          id += 1;
          number += 1;
        }
      });
      const totalMarks = questions.reduce((sum, q) => sum + Number(q.marks || 0), 0);
      return {
        ...state,
        questions,
        nextId: id,
        header: { ...state.header, totalMarks },
      };
    }

    case 'LOAD_DRAFT':
      return { ...action.payload };

    case 'RESET':
      return { ...initialState, nextId: state.nextId + 1 };

    default:
      return state;
  }
}

function loadInitial(): PaperState {
  try {
    const saved = localStorage.getItem(DRAFT_KEY);
    if (!saved) return initialState;
    const parsed = JSON.parse(saved) as PaperState;
    return { ...initialState, ...parsed };
  } catch {
    return initialState;
  }
}

export function PaperProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(paperReducer, undefined, loadInitial);
  const [toast, setToast] = useState<string | null>(null);

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 4000);
  }

  useEffect(() => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    document.body.className = document.body.className
      .split(' ')
      .filter((c) => !c.startsWith('sp-theme-'))
      .concat(`sp-theme-${state.theme}`)
      .join(' ');
  }, [state.theme]);

  const totalMarks = state.questions.reduce((sum, q) => sum + Number(q.marks || 0), 0);

  return (
    <PaperContext.Provider value={{ state, dispatch, totalMarks, QUESTION_TYPES, showToast }}>
      {children}
      {toast && (
        <div className="sp-toast sp-toast-error" role="alert">
          {toast}
        </div>
      )}
    </PaperContext.Provider>
  );
}

export function usePaper() {
  const ctx = useContext(PaperContext);
  if (!ctx) throw new Error('usePaper must be used within PaperProvider');
  return ctx;
}
