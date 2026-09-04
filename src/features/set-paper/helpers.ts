import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { QUESTION_TYPES, type PaperTheme } from './types';

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

  const interval = window.setInterval(() => {
    const timeLeft = animationEnd - Date.now();
    if (timeLeft <= 0) return window.clearInterval(interval);
    window.dispatchEvent(new CustomEvent('paper-confetti'));
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
