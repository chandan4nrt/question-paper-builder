import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { QUESTION_TYPES } from "./types";

export const DEFAULT_THEMES = [
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

export function loadThemes() {
  try {
    const saved = localStorage.getItem(THEMES_KEY);
    if (!saved) return DEFAULT_THEMES;
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) return DEFAULT_THEMES;
    return parsed;
  } catch {
    return DEFAULT_THEMES;
  }
}

export function saveThemes(themes) {
  localStorage.setItem(THEMES_KEY, JSON.stringify(themes));
}

export function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function fireConfetti() {
  const duration = 3000;
  const animationEnd = Date.now() + duration;

  const interval = window.setInterval(() => {
    const timeLeft = animationEnd - Date.now();
    if (timeLeft <= 0) return window.clearInterval(interval);
    window.dispatchEvent(new CustomEvent("paper-confetti"));
  }, 250);
}

export async function exportToPDF(elementId, filename = "question-paper.pdf") {
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

      return new Promise((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => resolve();
      });
    }),
  );

  /*
   * A4 dimensions
   */
  const A4_WIDTH = 210;
  const A4_HEIGHT = 297;

  /*
   * Work in CSS pixels (element space).
   */
  const contentWidth = element.scrollWidth;
  const contentHeight = element.scrollHeight;

  /*
   * How many CSS px wide one mm is, then
   * how tall one A4 page is in CSS px.
   */
  const pxPerMm = contentWidth / A4_WIDTH;
  const pageHeightCss = A4_HEIGHT * pxPerMm;

  /*
   * Find every complete question.
   */
  const questionElements = Array.from(element.querySelectorAll(".pdf-question-block"));

  const elementRect = element.getBoundingClientRect();

  const questions = questionElements.map((question) => {
    const rect = question.getBoundingClientRect();
    const top = rect.top - elementRect.top;
    const bottom = rect.bottom - elementRect.top;
    return { top, bottom, height: bottom - top };
  });

  /*
   * Build page boundaries in CSS px.
   *
   * Split at question boundaries so questions are never cut in half,
   * but never let a page exceed one A4 page (very tall questions are
   * split across pages).
   */
  const pages = [];

  let pageStart = 0;
  const MIN_PAGE_GAP = 4;

  while (pageStart < contentHeight - 1) {
    let pageEnd = Math.min(pageStart + pageHeightCss, contentHeight);

    /*
     * Question crosses the page bottom - move the ENTIRE question
     * to the next page when it can fit on one page.
     */
    const crossing = questions.find(
      (q) => q.top < pageEnd - 0.5 && q.bottom > pageEnd + 0.5,
    );

    if (crossing && crossing.height <= pageHeightCss && crossing.top > pageStart + MIN_PAGE_GAP) {
      pageEnd = crossing.top;
    }

    pages.push({ start: pageStart, end: pageEnd });

    if (pageEnd - pageStart <= MIN_PAGE_GAP) {
      break;
    }

    pageStart = pageEnd;
  }

  /*
   * Remove very small/empty pages.
   */
  const validPages = pages.filter((page) => page.end - page.start > MIN_PAGE_GAP);

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  });

  /*
   * Render each A4 page on its own small canvas. Rendering one page at
   * a time avoids the browser's maximum canvas size, so the entire paper
   * (any number of pages) is always captured.
   */
  const SCALE = 2;

  for (let index = 0; index < validPages.length; index += 1) {
    const page = validPages[index];

    if (index > 0) {
      pdf.addPage("a4", "portrait");
    }

    /*
     * Use the page's actual height (not a full A4 height) so a page that
     * ends early to keep a question intact does not bleed into the next
     * page's content.
     */
    const pageHeight = page.end - page.start;

    const canvas = await html2canvas(element, {
      scale: SCALE,
      useCORS: true,
      allowTaint: false,
      backgroundColor: "#FFFFFF",
      logging: false,

      width: contentWidth,
      height: pageHeight,

      windowWidth: contentWidth,
      windowHeight: contentHeight,

      scrollX: 0,
      scrollY: 0,

      x: 0,
      y: page.start,
    });

    const imgData = canvas.toDataURL("image/jpeg", 0.95);

    /*
     * Map the page canvas onto A4 at its natural scale.
     */
    const imageHeight = pageHeight / pxPerMm;

    pdf.addImage(imgData, "JPEG", 0, 0, A4_WIDTH, imageHeight, undefined, "FAST");
  }

  console.log("PDF pages:", validPages.length);

  pdf.save(filename);

  fireConfetti();
}