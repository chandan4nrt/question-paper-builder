function today() {
  return new Date().toISOString().split('T')[0];
}

export function deserializePaper(res) {
  const template = res.template ?? {};
  const urlMap = template.urls ?? {};
  const questions = [];
  let maxId = 0;

  const rawQuestions = (template.sections?.length
    ? template.sections.flatMap((s) => s.questions ?? [])
    : (template.questions?.length ? template.questions : (res.questions ?? [])));

  for (const raw of rawQuestions) {
    const q = deserializeQuestion(raw, urlMap);
    questions.push(q);
    if (q.id > maxId) maxId = q.id;
  }

  return {
    header: {
      schoolName: res.schoolName ?? template.schoolName ?? 'Sunshine Playschool',
      className: res.classLevel ?? '',
      subject: res.subject ?? '',
      exam: res.examTerm ?? '',
      academicYear: res.academicYear ?? '',
      date: res.date ?? template.date ?? today(),
      totalMarks: res.totalMarks ?? 0,
      duration: `${res.durationInMin ?? 30} Minutes`,
      teacherName: res.teacherName ?? template.teacherName ?? '',
      instructions: res.instructions ?? template.instructions ?? 'Read each question carefully before answering.',
      logo: urlMap.LOGO ?? null,
      logoName: template.images?.LOGO ?? null,
    },
    questions,
    theme: 'colorful',
    nextId: maxId + 1,
    urls: template.urls ?? {},
    published: res.published === true || res.paper_status === 'PUBLISHED' || res.paperStatus === 'PUBLISHED',
    publishedAt: res.publishedAt ?? null,
    publish_link: res.publish_link || res.publishLink || null,
    active: res.active !== false,
  };
}

function resolveImageUrl(urlMap, key) {
  return key ? (urlMap[key] ?? null) : null;
}

function normalizeAnswerList(answer) {
  if (answer == null || answer === '') return [];
  if (Array.isArray(answer)) return answer;
  return String(answer).split(',').map((item) => item.trim());
}

export function deserializeQuestion(raw, urlMap) {
  const id = raw.questionId ?? 0;
  const base = {
    id,
    number: id,
    type: 'normal',
    text: raw.questionTitle ?? '',
    marks: raw.marks ?? raw.totalMarks ?? 0,
    solution: raw.solution ?? '',
  };

  switch (raw.type) {
    case 'normal': {
      base.type = 'normal';
      base.answers = raw.subQuestions?.[0]?.answer ?? [];
      break;
    }
    case 'matching-picture': {
      base.type = 'match';
      if (raw.leftItems?.length) {
        base.leftItems = raw.leftItems.map((item, i) => ({
          id: `l${i}`,
          label: item.label ?? '',
          image: resolveImageUrl(urlMap, item.imageKey ?? item.image),
          imageName: (item.imageKey ? raw.images?.[item.imageKey] : null) ?? item.imageName ?? null,
        }));
      } else if (raw.leftLabels?.length) {
        base.leftItems = raw.leftLabels.map((label, i) => {
          const key = raw.pictures?.[i];
          return {
            id: `l${i}`,
            label: label ?? '',
            image: resolveImageUrl(urlMap, key),
            imageName: key ? (raw.images?.[key] ?? null) : null,
          };
        });
      } else {
        base.leftItems = (raw.pictures ?? []).map((key, i) => ({
          id: `l${i}`,
          label: '',
          image: resolveImageUrl(urlMap, key),
          imageName: raw.images?.[key] ?? null,
        }));
      }
      base.rightItems = (raw.letters ?? []).map((label, i) => ({
        id: `r${i}`,
        label,
      }));
      base.matchPairs = raw.matchPairs ?? {};
      break;
    }
    case 'multiple-choice': {
      base.type = 'mcq';
      const opts = (raw.subQuestions?.[0]?.options ?? raw.options) ?? [];
      base.options = opts.map((label, i) => ({ id: `o${i}`, label }));
      const answerLabel = raw.subQuestions?.[0]?.answer?.[0] ?? (typeof raw.answer === 'string' ? raw.answer : raw.answer?.[0]);
      if (answerLabel) {
        const idx = opts.indexOf(answerLabel);
        if (idx >= 0) base.correctOptionId = `o${idx}`;
      }
      base.answers = raw.subQuestions?.[0]?.answer ?? (raw.answer ? (Array.isArray(raw.answer) ? raw.answer : [raw.answer]) : []);
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
      base.items = (raw.subQuestions ?? []).map(
        (sq) => sq.subQuestionTitle ?? sq.subQuestion ?? '',
      );
      base.answers = (raw.subQuestions ?? []).map(
        (sq) => normalizeAnswerList(sq.answer)[0] ?? '',
      );
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
      base.items = (raw.subQuestions ?? []).map(
        (sq) => sq.subQuestionTitle ?? sq.subQuestion ?? '',
      );
      base.answers = (raw.subQuestions ?? []).map(
        (sq) => normalizeAnswerList(sq.answer)[0] ?? '',
      );
      break;
    }
    default:
      base.type = 'normal';
      break;
  }

  return base;
}