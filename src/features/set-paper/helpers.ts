import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import confetti from 'canvas-confetti';
import { QUESTION_TYPES, type PaperTheme, type QuestionType } from './types';

export interface TemplateQuestion {
  type: QuestionType;
  text: string;
  marks: number;
  lines?: number;
  sampleText?: string;
  leftItems?: { id: string; label: string; image?: string | null }[];
  rightItems?: { id: string; label: string }[];
  options?: { id: string; label: string; image?: string | null }[];
  image?: string | null;
  blankCount?: number;
  partCount?: number;
}

export interface PaperTemplate {
  name: string;
  description: string;
  questions: TemplateQuestion[];
}

export const TEMPLATES: PaperTemplate[] = [
  {
    name: 'Basic English',
    description: 'Letters and words for beginners',
    questions: [
      { type: QUESTION_TYPES.NORMAL, text: 'Write your name.', marks: 2 },
      {
        type: QUESTION_TYPES.WRITING,
        text: 'Trace the letters A, B, C.',
        marks: 3,
        lines: 3,
        sampleText: 'A B C',
      },
      { type: QUESTION_TYPES.NORMAL, text: 'Circle the vowels: a, b, e, i, o, u, c', marks: 5 },
    ],
  },
  {
    name: 'Fun Maths',
    description: 'Numbers and counting',
    questions: [
      { type: QUESTION_TYPES.NORMAL, text: 'Count and write the number of apples', marks: 2 },
      { type: QUESTION_TYPES.NORMAL, text: 'Fill in the missing numbers: 1, 2, __, 4, __, 6', marks: 3 },
      {
        type: QUESTION_TYPES.MATCH,
        text: 'Match the numbers to the pictures.',
        marks: 5,
        leftItems: [
          { id: 'l1', label: '1', image: null },
          { id: 'l2', label: '2', image: null },
          { id: 'l3', label: '3', image: null },
        ],
        rightItems: [
          { id: 'r1', label: 'One' },
          { id: 'r2', label: 'Three' },
          { id: 'r3', label: 'Two' },
        ],
      },
    ],
  },
  {
    name: 'Nature & Science',
    description: 'Animals and plants',
    questions: [
      { type: QUESTION_TYPES.NORMAL, text: 'Name 3 animals that live in water.', marks: 3 },
      {
        type: QUESTION_TYPES.MATCH,
        text: 'Match the animal to where it lives.',
        marks: 5,
        leftItems: [
          { id: 'l1', label: 'Fish', image: null },
          { id: 'l2', label: 'Lion', image: null },
        ],
        rightItems: [
          { id: 'r1', label: 'Jungle' },
          { id: 'r2', label: 'Ocean' },
        ],
      },
      {
        type: QUESTION_TYPES.WRITING,
        text: 'Write the names of 3 flowers you know.',
        marks: 3,
        lines: 4,
        sampleText: '',
      },
    ],
  },
  {
    name: 'General Knowledge',
    description: 'Multiple choice questions',
    questions: [
      {
        type: QUESTION_TYPES.MCQ,
        text: 'Which animal says "meow"?',
        marks: 2,
        options: [
          { id: 'o1', label: 'Dog' },
          { id: 'o2', label: 'Cat' },
          { id: 'o3', label: 'Cow' },
          { id: 'o4', label: 'Lion' },
        ],
      },
      {
        type: QUESTION_TYPES.MCQ,
        text: 'How many days are in a week?',
        marks: 2,
        options: [
          { id: 'o1', label: '5' },
          { id: 'o2', label: '6' },
          { id: 'o3', label: '7' },
          { id: 'o4', label: '8' },
        ],
      },
      {
        type: QUESTION_TYPES.MCQ,
        text: 'Which is a fruit?',
        marks: 2,
        options: [
          { id: 'o1', label: 'Carrot' },
          { id: 'o2', label: 'Potato' },
          { id: 'o3', label: 'Apple' },
          { id: 'o4', label: 'Onion' },
        ],
      },
    ],
  },
  {
    name: 'Nursery Fun',
    description: 'Visual recognition and vocabulary',
    questions: [
      {
        type: QUESTION_TYPES.IMAGE_MCQ,
        text: 'Circle the apple.',
        marks: 2,
        options: [
          { id: 'o1', label: 'Apple', image: null },
          { id: 'o2', label: 'Banana', image: null },
          { id: 'o3', label: 'Carrot', image: null },
          { id: 'o4', label: 'Orange', image: null },
        ],
      },
      {
        type: QUESTION_TYPES.FILL_BLANK,
        text: 'Fill in the missing numbers: 1, 2, ___, 4, ___, 6',
        marks: 2,
        blankCount: 2,
      },
      {
        type: QUESTION_TYPES.LABEL,
        text: 'Label the parts of the plant.',
        marks: 3,
        image: null,
        partCount: 3,
      },
    ],
  },
];

export const DEFAULT_THEMES: PaperTheme[] = [
  {
    id: 'theme-nursery',
    name: 'Nursery Worksheet',
    description: 'Shapes, letters and picture-based fun',
    questions: [
      { type: QUESTION_TYPES.NORMAL, count: 2, marks: 2 },
      { type: QUESTION_TYPES.WRITING, count: 1, marks: 3 },
      { type: QUESTION_TYPES.IMAGE_MCQ, count: 2, marks: 2 },
      { type: QUESTION_TYPES.FILL_BLANK, count: 1, marks: 2 },
      { type: QUESTION_TYPES.MCQ, count: 1, marks: 2 },
    ],
  },
  {
    id: 'theme-primary',
    name: 'Primary Assessment',
    description: 'Balanced mix for a quick test',
    questions: [
      { type: QUESTION_TYPES.NORMAL, count: 4, marks: 2 },
      { type: QUESTION_TYPES.MATCH, count: 1, marks: 5 },
      { type: QUESTION_TYPES.MCQ, count: 3, marks: 1 },
      { type: QUESTION_TYPES.FILL_BLANK, count: 2, marks: 1 },
    ],
  },
  {
    id: 'theme-science',
    name: 'Science / EVS Paper',
    description: 'Diagrams and labeling focus',
    questions: [
      { type: QUESTION_TYPES.NORMAL, count: 3, marks: 2 },
      { type: QUESTION_TYPES.LABEL, count: 1, marks: 4 },
      { type: QUESTION_TYPES.FILL_BLANK, count: 2, marks: 1 },
      { type: QUESTION_TYPES.MATCH, count: 1, marks: 4 },
    ],
  },
];

const THEMES_KEY = 'playschool-paper-themes';

export function loadThemes(): PaperTheme[] {
  try {
    const saved = localStorage.getItem(THEMES_KEY);
    if (!saved) return DEFAULT_THEMES;
    const parsed = JSON.parse(saved) as PaperTheme[];
    if (!Array.isArray(parsed)) return DEFAULT_THEMES;
    return parsed;
  } catch {
    return DEFAULT_THEMES;
  }
}

export function saveThemes(themes: PaperTheme[]): void {
  localStorage.setItem(THEMES_KEY, JSON.stringify(themes));
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function fireConfetti(): void {
  const duration = 3000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

  const interval = window.setInterval(() => {
    const timeLeft = animationEnd - Date.now();
    if (timeLeft <= 0) return window.clearInterval(interval);
    const particleCount = 50 * (timeLeft / duration);
    confetti({
      ...defaults,
      particleCount,
      origin: { x: Math.random() * 0.2 + 0.1, y: Math.random() - 0.2 },
      colors: ['#FF9A8B', '#FFB199', '#FF8E53', '#FFD06B', '#FFE29A'],
    });
    confetti({
      ...defaults,
      particleCount,
      origin: { x: Math.random() * 0.2 + 0.7, y: Math.random() - 0.2 },
      colors: ['#FF9A8B', '#FFB199', '#FF8E53', '#FFD06B', '#FFE29A'],
    });
  }, 250);
}

export async function exportToPDF(
  elementId: string,
  filename = 'question-paper.pdf',
): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) return;

  const canvas = await html2canvas(element, {
    scale: 3,
    useCORS: true,
    backgroundColor: '#FFFFFF',
    logging: false,
  });

  const imgData = canvas.toDataURL('image/jpeg', 0.95);
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = canvas.width;
  const imgHeight = canvas.height;
  const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
  const imgX = (pdfWidth - imgWidth * ratio) / 2;

  pdf.addImage(imgData, 'PNG', imgX, 0, imgWidth * ratio, imgHeight * ratio);

  let heightLeft = imgHeight - pdfHeight / ratio;
  while (heightLeft >= 0) {
    const position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', imgX, position * ratio, imgWidth * ratio, imgHeight * ratio);
    heightLeft -= pdfHeight / ratio;
  }

  pdf.save(filename);
  fireConfetti();
}
