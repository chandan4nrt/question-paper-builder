import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useRef,
  useState,
} from 'react';
import { QUESTION_TYPES } from '../types';

const PaperContext = createContext(null);

const DRAFT_KEY = 'playschool-paper-draft';
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

export function clearDraft() {
  localStorage.removeItem(DRAFT_KEY);
}

function stripImagesForDraft(state) {
  const header = { ...state.header };
  delete header.logo;
  delete header.logoName;
  delete header.logoBlob;

  const questions = (state.questions ?? []).map((q) => {
    const copy = { ...q };
    delete copy.image;
    delete copy.imageName;
    delete copy.imageBlob;
    if (Array.isArray(copy.leftItems)) {
      copy.leftItems = copy.leftItems.map((item) => {
        const it = { ...item };
        delete it.image;
        delete it.imageName;
        delete it.imageBlob;
        return it;
      });
    }
    if (Array.isArray(copy.options)) {
      copy.options = copy.options.map((opt) => {
        const o = { ...opt };
        delete o.image;
        delete o.imageName;
        delete o.imageBlob;
        return o;
      });
    }
    return copy;
  });

  return { ...state, header, questions };
}

function collectImageUrls(state) {
  const urls = [];
  if (typeof state?.header?.logo === 'string') urls.push(state.header.logo);
  for (const q of state?.questions ?? []) {
    if (typeof q.image === 'string') urls.push(q.image);
    for (const item of q.leftItems ?? []) {
      if (typeof item.image === 'string') urls.push(item.image);
    }
    for (const opt of q.options ?? []) {
      if (typeof opt.image === 'string') urls.push(opt.image);
    }
  }
  return urls;
}

function today() {
  return new Date().toISOString().split('T')[0];
}

function defaultLabelMarkers(count) {
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

const initialState = {
  header: {
    schoolName: 'Sunshine Playschool',
    className: 'Nursery',
    subject: 'English',
    exam: 'Mid-Term',
    academicYear: '2026-2027',
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

function newQuestion(nextId, number, type) {
  const base = {
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

function paperReducer(state, action) {
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

    case 'ADD_GENERATED_QUESTIONS': {
      const incoming = action.payload.questions ?? [];
      if (incoming.length === 0) return state;
      let nextId = state.nextId;
      const added = incoming.map((q) => {
        const base = newQuestion(nextId, 0, q.type ?? QUESTION_TYPES.NORMAL);
        const merged = { ...base, ...q, id: nextId, number: 0 };
        nextId += 1;
        return merged;
      });
      const renumbered = [...state.questions, ...added].map((q, i) => ({ ...q, number: i + 1 }));
      return { ...state, questions: renumbered, nextId };
    }

    case 'UPDATE_QUESTION':
      return {
        ...state,
        questions: state.questions.map((q) => {
          if (q.id !== action.payload.id) return q;
          const data = { ...action.payload.data };
          if (data.marks != null) {
            data.marks = Math.max(0, Math.min(100, Number(data.marks) || 0));
          }
          return { ...q, ...data };
        }),
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
      const questions = [];
      let id = 1;
      let number = 1;
      action.payload.questions.forEach((cfg) => {
        if (cfg.count <= 0) return;
        for (let i = 0; i < cfg.count; i++) {
          const q = newQuestion(id, number, cfg.type);
          q.marks = Math.max(0, Math.min(100, Number(cfg.marks) || 0));
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

function loadInitial() {
  try {
    const saved = localStorage.getItem(DRAFT_KEY);
    if (!saved) return initialState;
    const parsed = JSON.parse(saved);
    return { ...initialState, ...stripImagesForDraft(parsed) };
  } catch {
    return initialState;
  }
}

export function PaperProvider({ children }) {
  const [state, dispatch] = useReducer(paperReducer, undefined, loadInitial);
  const [toast, setToast] = useState(null);
  const previousImageUrls = useRef([]);

  function showToast(message) {
    setToast(message);
    window.setTimeout(() => setToast(null), 4000);
  }

  useEffect(() => {
    const previous = new Set(previousImageUrls.current);
    const current = collectImageUrls(state);
    const currentSet = new Set(current);
    for (const url of previous) {
      if (url.startsWith('blob:') && !currentSet.has(url)) {
        URL.revokeObjectURL(url);
      }
    }
    previousImageUrls.current = current;
  }, [state]);

  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(stripImagesForDraft(state)));
    } catch {
      // Draft is a convenience only; a quota error must not break editing.
    }
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