export function deserializePaper(res) {
  if (!res) {
    return {
      header: {
        schoolName: '',
        className: '',
        subject: '',
        exam: '',
        academicYear: '',
        date: '',
        totalMarks: 0,
        duration: '30 Minutes',
        teacherName: '',
        instructions: '',
        logo: null,
        logoName: null,
      },
      questions: [],
      theme: 'colorful',
      nextId: 1,
      urls: {},
    };
  }

  let template = res.template;
  if (typeof template === 'string') {
    try {
      template = JSON.parse(template);
    } catch (e) {
      console.warn('Failed to parse paper template JSON string:', e);
      template = {};
    }
  }

  if (!template || typeof template !== 'object') {
    if (Array.isArray(res.questions) || res.sections) {
      template = {
        questions: res.questions,
        sections: res.sections,
        urls: res.urls,
        images: res.images,
        title: res.title,
      };
    } else {
      template = {};
    }
  }

  const urlMap = template.urls ?? res.urls ?? {};
  const imagesMap = template.images ?? res.images ?? {};
  const questions = [];
  let maxId = 0;

  const rawQuestions = Array.isArray(template.sections) && template.sections.length > 0
    ? template.sections.flatMap((s) => s?.questions ?? [])
    : (Array.isArray(template.questions) ? template.questions : []);

  for (const raw of rawQuestions) {
    if (!raw) continue;
    const q = deserializeQuestion(raw, urlMap);
    if (q) {
      questions.push(q);
      if (q.id > maxId) maxId = q.id;
    }
  }

  return {
    header: {
      schoolName: res.schoolName ?? res.header?.schoolName ?? '',
      className: res.classLevel ?? res.className ?? res.header?.className ?? template.classLevel ?? '',
      subject: res.subject ?? res.header?.subject ?? template.subject ?? '',
      exam: res.examTerm ?? res.exam ?? res.header?.exam ?? template.examTerm ?? '',
      academicYear: res.academicYear ?? res.header?.academicYear ?? template.academicYear ?? '',
      date: res.date ?? res.header?.date ?? '',
      totalMarks: res.totalMarks ?? res.header?.totalMarks ?? template.totalMarks ?? 0,
      duration: res.duration ? res.duration : `${res.durationInMin ?? 30} Minutes`,
      teacherName: res.teacherName ?? res.header?.teacherName ?? '',
      instructions: res.instructions ?? res.header?.instructions ?? '',
      logo: resolveImageUrl(urlMap, 'LOGO') ?? res.logo ?? null,
      logoName: imagesMap.LOGO ?? res.logoName ?? null,
    },
    questions,
    theme: res.theme || 'colorful',
    nextId: maxId + 1,
    urls: urlMap,
  };
}

function resolveImageUrl(urlMap, key) {
  if (!urlMap || !key) return null;
  return urlMap[key] ?? null;
}

export function deserializeQuestion(raw, urlMap = {}) {
  if (!raw || typeof raw !== 'object') return null;
  const id = raw.questionId ?? 0;
  const base = {
    id,
    number: id,
    type: 'normal',
    text: raw.questionTitle ?? raw.text ?? '',
    marks: raw.totalMarks ?? raw.marks ?? 0,
    solution: raw.solution ?? '',
  };

  switch (raw.type) {
    case 'normal': {
      base.type = 'normal';
      base.answers = raw.subQuestions?.[0]?.answer ?? (Array.isArray(raw.answers) ? raw.answers : []);
      break;
    }
    case 'matching-picture':
    case 'match': {
      base.type = 'match';
      base.leftItems = (raw.pictures ?? raw.leftItems ?? []).map((item, i) => {
        if (typeof item === 'object' && item !== null) {
          return {
            id: item.id ?? `l${i}`,
            label: item.label ?? '',
            image: item.image ?? resolveImageUrl(urlMap, item.pictureKey),
            imageName: item.imageName ?? null,
          };
        }
        return {
          id: `l${i}`,
          label: '',
          image: resolveImageUrl(urlMap, item),
          imageName: raw.images?.[item] ?? null,
        };
      });
      base.rightItems = (raw.letters ?? raw.rightItems ?? []).map((item, i) => {
        if (typeof item === 'object' && item !== null) {
          return { id: item.id ?? `r${i}`, label: item.label ?? '' };
        }
        return { id: `r${i}`, label: String(item ?? '') };
      });
      base.matchPairs = raw.matchPairs ?? {};
      break;
    }
    case 'multiple-choice':
    case 'mcq': {
      base.type = 'mcq';
      const opts = raw.subQuestions?.[0]?.options ?? (Array.isArray(raw.options) ? raw.options : []);
      base.options = opts.map((item, i) => {
        if (typeof item === 'object' && item !== null) {
          return { id: item.id ?? `o${i}`, label: item.label ?? '' };
        }
        return { id: `o${i}`, label: String(item ?? '') };
      });
      const answerLabel = raw.subQuestions?.[0]?.answer?.[0] ?? (Array.isArray(raw.answers) ? raw.answers[0] : raw.answers);
      if (answerLabel) {
        const idx = opts.findIndex((o) => (typeof o === 'object' ? o.label === answerLabel : o === answerLabel));
        if (idx >= 0) base.correctOptionId = `o${idx}`;
      } else if (raw.correctOptionId) {
        base.correctOptionId = raw.correctOptionId;
      }
      base.answers = raw.subQuestions?.[0]?.answer ?? (Array.isArray(raw.answers) ? raw.answers : []);
      break;
    }
    case 'color-the-image':
    case 'image-mcq': {
      base.type = 'image-mcq';
      const pics = raw.pictures ?? (Array.isArray(raw.options) ? raw.options : []);
      base.options = pics.map((item, i) => {
        if (typeof item === 'object' && item !== null) {
          return {
            id: item.id ?? `o${i}`,
            label: item.label ?? '',
            image: item.image ?? resolveImageUrl(urlMap, item.pictureKey),
            imageName: item.imageName ?? null,
            writingLines: item.writingLines ?? false,
          };
        }
        return {
          id: `o${i}`,
          label: '',
          image: resolveImageUrl(urlMap, item),
          imageName: raw.images?.[item] ?? null,
          writingLines: raw.mode === 'write',
        };
      });
      if (raw.mode === 'circle' && raw.answers?.[0]) {
        const idx = pics.indexOf(raw.answers[0]);
        if (idx >= 0) base.correctOptionId = `o${idx}`;
      } else if (raw.correctOptionId) {
        base.correctOptionId = raw.correctOptionId;
      }
      base.answers = raw.answers ?? [];
      break;
    }
    case 'fill-in-the-blank':
    case 'fill-blank': {
      base.type = 'fill-blank';
      base.items = raw.subQuestions?.length
        ? raw.subQuestions.map((sq) => sq.subQuestion ?? '')
        : (Array.isArray(raw.items) ? raw.items : [base.text]);
      base.answers = raw.subQuestions?.length
        ? raw.subQuestions.map((sq) => sq.answer?.[0] ?? '')
        : (Array.isArray(raw.answers) ? raw.answers : []);
      base.blankCount = base.items.length || 1;
      break;
    }
    case 'label-picture':
    case 'label': {
      base.type = 'label';
      const firstPic = raw.pictures?.[0] ?? raw.picture;
      base.image = raw.image ?? resolveImageUrl(urlMap, firstPic);
      base.imageName = raw.imageName ?? (firstPic ? (raw.images?.[firstPic] ?? null) : null);
      base.labelMarkers = (raw.labelMarkers ?? []).map((m) => ({
        id: m.id,
        x: m.x,
        y: m.y,
      }));
      base.partCount = base.labelMarkers.length || 4;
      base.answers = raw.answers ?? [];
      break;
    }
    case 'writing-practice':
    case 'writing': {
      base.type = 'writing';
      base.lines = raw.lines ?? 4;
      base.fragments = raw.fragments ?? 1;
      base.sampleText = raw.sampleText ?? '';
      base.answers = raw.subQuestions?.[0]?.answer ?? (Array.isArray(raw.answers) ? raw.answers : []);
      break;
    }
    case 'true-false': {
      base.type = 'true-false';
      base.items = raw.subQuestions?.length
        ? raw.subQuestions.map((sq) => sq.subQuestion ?? '')
        : (Array.isArray(raw.items) ? raw.items : (base.text ? [base.text] : []));
      base.answers = raw.subQuestions?.length
        ? raw.subQuestions.map((sq) => sq.answer?.[0] ?? '')
        : (Array.isArray(raw.answers) ? raw.answers : []);
      break;
    }
    default:
      base.type = 'normal';
      base.answers = raw.subQuestions?.[0]?.answer ?? (Array.isArray(raw.answers) ? raw.answers : []);
      break;
  }

  return base;
}