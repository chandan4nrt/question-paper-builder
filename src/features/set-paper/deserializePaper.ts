import type { PaperBackendResponse, PaperState, Question, BackendQuestion } from './types';

export function deserializePaper(res: PaperBackendResponse): PaperState {
  const template = res.template;
  const urlMap = template.urls ?? {};
  const questions: Question[] = [];
  let maxId = 0;

  const rawQuestions = (template.sections?.length
    ? template.sections.flatMap((s) => s.questions ?? [])
    : (template.questions ?? [])) as BackendQuestion[];

  for (const raw of rawQuestions) {
    const q = deserializeQuestion(raw, urlMap);
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
      logo: urlMap.LOGO ?? null,
      logoName: template.images?.LOGO ?? null,
    },
    questions,
    theme: 'colorful',
    nextId: maxId + 1,
  };
}

function resolveImageUrl(urlMap: Record<string, string>, key?: string): string | null {
  return key ? (urlMap[key] ?? null) : null;
}

function deserializeQuestion(raw: BackendQuestion, urlMap: Record<string, string>): Question {
  const id = raw.questionId ?? 0;
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
        image: resolveImageUrl(urlMap, key),
        imageName: raw.images?.[key] ?? null,
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
        image: resolveImageUrl(urlMap, key),
        imageName: raw.images?.[key] ?? null,
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
      base.items = (raw.subQuestions ?? []).map((sq) => sq.subQuestion ?? '');
      base.answers = (raw.subQuestions ?? []).map((sq) => sq.answer?.[0] ?? '');
      base.blankCount = base.items.length;
      break;
    }
    case 'label-picture': {
      base.type = 'label';
      const firstPic = raw.pictures?.[0];
      base.image = resolveImageUrl(urlMap, firstPic);
      base.imageName = firstPic ? (raw.images?.[firstPic] ?? null) : null;
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
      base.items = (raw.subQuestions ?? []).map((sq) => sq.subQuestion ?? '');
      base.answers = (raw.subQuestions ?? []).map((sq) => sq.answer?.[0] ?? '');
      break;
    }
    default:
      base.type = 'normal';
      break;
  }

  return base;
}