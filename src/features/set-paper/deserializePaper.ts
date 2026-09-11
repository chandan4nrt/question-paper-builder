import type { PaperBackendResponse, PaperState, Question } from './types';

interface BackendQuestion {
  type: string;
  questionId: number;
  totalMarks: number;
  questionTitle: string;
  subQuestions?: {
    subQuestionId: number;
    subQuestion: string;
    options: string[];
    answer: string[];
  }[];
  images?: Record<string, string>;
  picture?: string;
  pictures?: string[];
  letters?: string[];
  lines?: number;
  fragments?: number;
  sampleText?: string;
  labelMarkers?: { id: string; x: number; y: number }[];
  answers?: string[];
  matchPairs?: Record<string, string>;
  mode?: string;
}

export function deserializePaper(res: PaperBackendResponse): PaperState {
  const template = res.template;
  const questions: Question[] = [];
  let maxId = 0;

  for (const raw of (template.questions ?? []) as BackendQuestion[]) {
    const q = deserializeQuestion(raw);
    questions.push(q);
    if (q.id > maxId) maxId = q.id;
  }

  return {
    header: {
      schoolName: '',
      className: res.classLevel ?? '',
      subject: res.subject ?? '',
      exam: res.examTerm ?? '',
      academicYear: res.academicYear ?? '',
      date: '',
      totalMarks: res.totalMarks ?? 0,
      duration: `${res.durationInMin ?? 30} Minutes`,
      teacherName: '',
      instructions: '',
      logo: null,
      logoName: null,
    },
    questions,
    theme: 'colorful',
    nextId: maxId + 1,
  };
}

function deserializeQuestion(raw: BackendQuestion): Question {
  const id = raw.questionId;
  const base: Question = {
    id,
    number: id,
    type: 'normal',
    text: raw.questionTitle ?? '',
    marks: raw.totalMarks ?? 0,
  };

  switch (raw.type) {
    case 'normal': {
      base.type = 'normal';
      base.answers = raw.subQuestions?.[0]?.answer ?? [];
      break;
    }
    case 'matching-picture': {
      base.type = 'match';
      base.leftItems = (raw.pictures ?? []).map((key, i) => ({
        id: `l${i}`,
        label: '',
        image: raw.images?.[key] ?? null,
        imageName: null,
      }));
      base.rightItems = (raw.letters ?? []).map((label, i) => ({
        id: `r${i}`,
        label,
      }));
      base.matchPairs = raw.matchPairs ?? {};
      break;
    }
    case 'multiple-choice': {
      base.type = 'mcq';
      const opts = raw.subQuestions?.[0]?.options ?? [];
      base.options = opts.map((label, i) => ({ id: `o${i}`, label }));
      const answerLabel = raw.subQuestions?.[0]?.answer?.[0];
      if (answerLabel) {
        const idx = opts.indexOf(answerLabel);
        if (idx >= 0) base.correctOptionId = `o${idx}`;
      }
      base.answers = raw.subQuestions?.[0]?.answer ?? [];
      break;
    }
    case 'color-the-image': {
      base.type = 'image-mcq';
      const pics = raw.pictures ?? [];
      base.options = pics.map((key, i) => ({
        id: `o${i}`,
        label: '',
        image: raw.images?.[key] ?? null,
        imageName: null,
        writingLines: raw.mode === 'write',
      }));
      if (raw.mode === 'circle' && raw.answers?.[0]) {
        const idx = pics.indexOf(raw.answers[0]);
        if (idx >= 0) base.correctOptionId = `o${idx}`;
      }
      base.answers = raw.answers ?? [];
      break;
    }
    case 'fill-in-the-blank': {
      base.type = 'fill-blank';
      base.items = (raw.subQuestions ?? []).map((sq) => sq.subQuestion);
      base.answers = (raw.subQuestions ?? []).map((sq) => sq.answer?.[0] ?? '');
      base.blankCount = base.items.length;
      break;
    }
    case 'label-picture': {
      base.type = 'label';
      const firstPic = raw.pictures?.[0];
      base.image = firstPic ? (raw.images?.[firstPic] ?? null) : null;
      base.imageName = null;
      base.labelMarkers = (raw.labelMarkers ?? []).map((m) => ({
        id: m.id,
        x: m.x,
        y: m.y,
      }));
      base.partCount = base.labelMarkers.length || 4;
      base.answers = raw.answers ?? [];
      break;
    }
    case 'writing-practice': {
      base.type = 'writing';
      base.lines = raw.lines ?? 4;
      base.fragments = raw.fragments ?? 1;
      base.sampleText = raw.sampleText ?? '';
      base.answers = raw.subQuestions?.[0]?.answer ?? [];
      break;
    }
    case 'true-false': {
      base.type = 'true-false';
      base.items = (raw.subQuestions ?? []).map((sq) => sq.subQuestion);
      base.answers = (raw.subQuestions ?? []).map((sq) => sq.answer?.[0] ?? '');
      break;
    }
    default:
      base.type = 'normal';
      break;
  }

  return base;
}
