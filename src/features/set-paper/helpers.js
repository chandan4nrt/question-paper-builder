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

/*
 * Decode a blob: <img> into an equivalent <canvas>. html2canvas 1.4.1 cannot
 * capture blob: images when useCORS is enabled, but it renders <canvas>
 * elements natively.
 */
async function canvasFromImageElement(img) {
  const src = img.getAttribute("src") || img.src;
  if (!src || !src.startsWith("blob:")) return null;
  if (!img.complete || !img.naturalWidth) return null;

  const draw = (source) => {
    const output = document.createElement("canvas");
    output.width = img.naturalWidth;
    output.height = img.naturalHeight;
    const context = output.getContext("2d");
    context.drawImage(source, 0, 0);
    const rect = img.getBoundingClientRect();
    if (rect.width) output.style.width = `${rect.width}px`;
    if (rect.height) output.style.height = `${rect.height}px`;
    return output;
  };

  try {
    const blob = await fetch(src).then((res) => res.blob());
    if (typeof createImageBitmap === "function") {
      const bitmap = await createImageBitmap(blob);
      const canvas = draw(bitmap);
      bitmap.close?.();
      return canvas;
    }
    const bitmapLike = await new Promise((resolve, reject) => {
      const temporary = new Image();
      temporary.onload = () => resolve(temporary);
      temporary.onerror = () => reject(new Error("image decode failed"));
      temporary.src = URL.createObjectURL(blob);
    });
    const canvas = draw(bitmapLike);
    return canvas;
  } catch {
    return null;
  }
}

const A4_WIDTH = 210;
const A4_HEIGHT = 297;
const MIN_PAGE_GAP = 4;

/*
 * Convert one print root into A4 page fragments, splitting at question
 * boundaries so questions are never cut in half.
 */
function buildPageFragments(element) {
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

  /*
   * The print-area element carries its own vertical padding, which supplies
   * the top/bottom margins on its first page. Reserve the same amount on
   * every page so later pages are not flush against the page edge.
   */
  const computedStyle = getComputedStyle(element);
  const topMarginPx = parseFloat(computedStyle.paddingTop) || 0;
  const bottomMarginPx = parseFloat(computedStyle.paddingBottom) || 0;
  const pageHeightCss = (A4_HEIGHT * pxPerMm) - topMarginPx - bottomMarginPx;

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
   */
  const pages = [];

  let pageStart = 0;

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

  return { element, contentWidth, contentHeight, pxPerMm, topMarginPx, validPages };
}

/*
 * Render one or more print roots ("print-area", "answer-key-area", ...) into
 * a single A4 PDF. Accepts either an element id or an array of element ids.
 */
export async function exportToPDF(elementIds, filename = "question-paper.pdf") {
  const ids = Array.isArray(elementIds) ? elementIds : [elementIds];
  const roots = ids.map((id) => document.getElementById(id)).filter(Boolean);

  if (roots.length === 0) {
    console.error(`exportToPDF: none of these elements found: ${ids.join(", ")}`);
    return;
  }

  // Wait for fonts
  await document.fonts.ready;

  // Wait for images across all roots
  const images = roots.flatMap((root) => Array.from(root.querySelectorAll("img")));

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
   * Temporarily replace blob: images with canvas copies so html2canvas can
   * rasterize them, then restore the original <img> elements afterwards.
   */
  const restored = [];
  for (const img of images) {
    const canvas = await canvasFromImageElement(img);
    if (!canvas) continue;
    img.replaceWith(canvas);
    restored.push({ canvas, img });
  }

  const sections = roots.map(buildPageFragments);

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
  let renderedPages = 0;

  try {
    for (const section of sections) {
      let isFirstPageOfSection = true;
      for (const page of section.validPages) {
        if (renderedPages > 0) {
          pdf.addPage("a4", "portrait");
        }
        renderedPages += 1;

        /*
         * Use the page's actual height (not a full A4 height) so a page that
         * ends early to keep a question intact does not bleed into the next
         * page's content.
         */
        const pageHeight = page.end - page.start;

        const canvas = await html2canvas(section.element, {
          scale: SCALE,
          useCORS: true,
          allowTaint: false,
          backgroundColor: "#FFFFFF",
          logging: false,

          width: section.contentWidth,
          height: pageHeight,

          windowWidth: section.contentWidth,
          windowHeight: section.contentHeight,

          scrollX: 0,
          scrollY: 0,

          x: 0,
          y: page.start,
        });

        /*
         * Map the page canvas onto A4 at its natural scale.
         * jsPDF accepts the canvas directly (it encodes internally).
         */
        const imageHeight = pageHeight / section.pxPerMm;

        /*
         * The first page already has a margin thanks to the print-area's own
         * padding; later pages are cropped from the element, so push them down
         * by the same top padding to keep margins consistent.
         */
        const topMarginMm = section.topMarginPx / section.pxPerMm;
        const drawY = isFirstPageOfSection ? 0 : topMarginMm;

        pdf.addImage(canvas, "JPEG", 0, drawY, A4_WIDTH, imageHeight, undefined, "FAST");
        isFirstPageOfSection = false;
      }
    }
  } finally {
    for (const { canvas, img } of restored) {
      canvas.replaceWith(img);
    }
  }

  console.log("PDF pages:", renderedPages);

  pdf.save(filename);

  fireConfetti();
}