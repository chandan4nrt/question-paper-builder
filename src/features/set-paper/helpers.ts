import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { QUESTION_TYPES, type PaperTheme } from "./types";

export const DEFAULT_THEMES: PaperTheme[] = [
  {
    id: "theme-nursery",
    name: "Nursery Worksheet",
    description: "Shapes, letters and picture-based fun",
    questions: [
      { type: QUESTION_TYPES.NORMAL, count: 2, marks: 2 },
      { type: QUESTION_TYPES.WRITING, count: 1, marks: 3 },
      { type: QUESTION_TYPES.IMAGE_MCQ, count: 2, marks: 2 },
      { type: QUESTION_TYPES.FILL_BLANK, count: 1, marks: 2 },
      { type: QUESTION_TYPES.MCQ, count: 1, marks: 2 },
    ],
  },
  {
    id: "theme-primary",
    name: "Primary Assessment",
    description: "Balanced mix for a quick test",
    questions: [
      { type: QUESTION_TYPES.NORMAL, count: 4, marks: 2 },
      { type: QUESTION_TYPES.MATCH, count: 1, marks: 5 },
      { type: QUESTION_TYPES.MCQ, count: 3, marks: 1 },
      { type: QUESTION_TYPES.FILL_BLANK, count: 2, marks: 1 },
    ],
  },
  {
    id: "theme-science",
    name: "Science / EVS Paper",
    description: "Diagrams and labeling focus",
    questions: [
      { type: QUESTION_TYPES.NORMAL, count: 3, marks: 2 },
      { type: QUESTION_TYPES.LABEL, count: 1, marks: 4 },
      { type: QUESTION_TYPES.FILL_BLANK, count: 2, marks: 1 },
      { type: QUESTION_TYPES.MATCH, count: 1, marks: 4 },
    ],
  },
];

const THEMES_KEY = "playschool-paper-themes";

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
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
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
    window.dispatchEvent(new CustomEvent("paper-confetti"));
  }, 250);
}

export async function exportToPDF(elementId: string, filename = "question-paper.pdf"): Promise<void> {
  const element = document.getElementById(elementId);

  if (!element) {
    console.error(`Element with id "${elementId}" not found`);
    return;
  }

  // Wait for fonts
  await document.fonts.ready;

  // Wait for images
  const images = Array.from(element.querySelectorAll("img"));

  await Promise.all(
    images.map((img) => {
      if (img.complete) {
        return Promise.resolve();
      }

      return new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => resolve();
      });
    }),
  );

  /*
   * Render the complete paper.
   */
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    allowTaint: false,
    backgroundColor: "#FFFFFF",
    logging: false,

    width: element.scrollWidth,
    height: element.scrollHeight,

    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight,
  });

  /*
   * A4 dimensions
   */
  const A4_WIDTH = 210;
  const A4_HEIGHT = 297;

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  });

  /*
   * Canvas width -> A4 width
   *
   * Example:
   * canvas = 1587px wide
   * A4     = 210mm wide
   */
  const pxPerMm = canvas.width / A4_WIDTH;

  /*
   * How many canvas pixels fit vertically
   * inside one A4 page.
   */
  const pageHeightPx = A4_HEIGHT * pxPerMm;

  /*
   * Find every complete question.
   */
  const questionElements = Array.from(element.querySelectorAll<HTMLElement>(".pdf-question-block"));

  const elementRect = element.getBoundingClientRect();

  /*
   * Convert browser positions into canvas positions.
   */
  const questions = questionElements.map((question) => {
    const rect = question.getBoundingClientRect();

    const scaleX = canvas.width / element.scrollWidth;

    const top = (rect.top - elementRect.top) * scaleX;

    const bottom = (rect.bottom - elementRect.top) * scaleX;

    return {
      top,
      bottom,
      height: bottom - top,
    };
  });

  /*
   * Build page boundaries.
   */
  const pages: Array<{
    start: number;
    end: number;
  }> = [];

  let pageStart = 0;
  let pageEnd = pageHeightPx;

  for (const question of questions) {
    /*
     * Question crosses the current page.
     */
    if (question.top < pageEnd && question.bottom > pageEnd) {
      /*
       * If the question can fit on one page,
       * move the ENTIRE question to the next page.
       */
      if (question.height <= pageHeightPx) {
        pages.push({
          start: pageStart,
          end: question.top,
        });

        pageStart = question.top;
        pageEnd = pageStart + pageHeightPx;
      }
    }
  }

  /*
   * Add final page.
   */
  pages.push({
    start: pageStart,
    end: canvas.height,
  });

  /*
   * Remove very small/empty pages.
   */
  const validPages = pages.filter((page) => page.end - page.start > 20);

  /*
   * Create PDF pages.
   */
  validPages.forEach((page, index) => {
    if (index > 0) {
      pdf.addPage("a4", "portrait");
    }

    const pageHeight = page.end - page.start;

    const pageCanvas = document.createElement("canvas");

    pageCanvas.width = canvas.width;
    pageCanvas.height = Math.ceil(pageHeight);

    const ctx = pageCanvas.getContext("2d");

    if (!ctx) {
      throw new Error("Could not create canvas context");
    }

    /*
     * White page background.
     */
    ctx.fillStyle = "#FFFFFF";

    ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);

    /*
     * Copy only this page from the
     * complete canvas.
     */
    ctx.drawImage(
      canvas,

      // SOURCE
      0,
      page.start,
      canvas.width,
      pageHeight,

      // DESTINATION
      0,
      0,
      canvas.width,
      pageHeight,
    );

    const imgData = pageCanvas.toDataURL("image/jpeg", 0.95);

    /*
     * Convert canvas height to mm.
     */
    const imageHeight = pageHeight / pxPerMm;

    /*
     * A4 width = exactly 210mm.
     */
    pdf.addImage(imgData, "JPEG", 0, 0, A4_WIDTH, imageHeight, undefined, "FAST");
  });

  console.log("PDF pages:", validPages.length);

  console.log("Canvas:", canvas.width, "x", canvas.height);

  pdf.save(filename);

  fireConfetti();
}
