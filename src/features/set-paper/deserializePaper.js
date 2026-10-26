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
      themeId: null,
      fromTheme: null,
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

  const urlMap = { ...(template.urls ?? res.urls ?? {}) };
  const imagesMap = template.images ?? res.images ?? {};
  const questions = [];
  let maxId = 0;

  const rawQuestions = Array.isArray(template.sections) && template.sections.length > 0
    ? template.sections.flatMap((s) => s?.questions ?? [])
    : (Array.isArray(template.questions) ? template.questions : []);

  const sampleUrl = Object.values(urlMap).find((u) => typeof u === 'string' && u.startsWith('http'));
  let baseUrl = sampleUrl ? sampleUrl.substring(0, sampleUrl.lastIndexOf('/') + 1) : null;
  const pId = res.paperId || res.id;
  if (!baseUrl && pId) {
    baseUrl = `https://cargofile.s3.ap-south-1.amazonaws.com/primarySchool/${pId}/`;
  }

  // Pre-fill any missing keys in urlMap using raw.images from all questions
  for (const raw of rawQuestions) {
    if (!raw) continue;
    if (raw.images && typeof raw.images === 'object') {
      for (const [key, name] of Object.entries(raw.images)) {
        if (!urlMap[key] && name) {
          const clean = String(name).trim();
          const matchExisting = Object.values(urlMap).find((u) => {
            if (typeof u !== 'string') return false;
            const pathPart = u.split('?')[0].split('#')[0];
            const filePart = pathPart.substring(pathPart.lastIndexOf('/') + 1);
            return filePart === clean || filePart === encodeURI(clean) || decodeURIComponent(filePart) === clean;
          });
          if (matchExisting) {
            urlMap[key] = matchExisting;
          } else if (baseUrl) {
            urlMap[key] = `${baseUrl}${encodeURI(clean)}`;
          }
        }
      }
    }
  }

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
      logo: resolveImageUrl(urlMap, 'LOGO', imagesMap.LOGO ?? res.logoName) ?? res.logo ?? null,
      logoName: imagesMap.LOGO ?? res.logoName ?? null,
    },
    questions,
    theme: res.theme || 'colorful',
    themeId: res.themeId ?? res.theme_id ?? template?.themeId ?? (typeof res.fromTheme !== 'boolean' ? res.fromTheme : null) ?? null,
    fromTheme: res.fromTheme ?? res.themeId ?? res.theme_id ?? template?.themeId ?? null,
    nextId: maxId + 1,
    urls: urlMap,
  };
}

function resolveImageUrl(urlMap, key, imageName) {
  if (!key && !imageName) return null;
  if (key && urlMap && urlMap[key]) return urlMap[key];
  if (typeof key === 'string' && (key.startsWith('http://') || key.startsWith('https://') || key.startsWith('data:') || key.startsWith('blob:'))) {
    return key;
  }
  if (imageName && urlMap) {
    const clean = String(imageName).trim();
    const matchExisting = Object.values(urlMap).find((u) => {
      if (typeof u !== 'string') return false;
      const pathPart = u.split('?')[0].split('#')[0];
      const filePart = pathPart.substring(pathPart.lastIndexOf('/') + 1);
      return filePart === clean || filePart === encodeURI(clean) || decodeURIComponent(filePart) === clean;
    });
    if (matchExisting) return matchExisting;

    const sample = Object.values(urlMap).find((u) => typeof u === 'string' && u.startsWith('http'));
    if (sample) {
      const baseUrl = sample.substring(0, sample.lastIndexOf('/') + 1);
      return `${baseUrl}${encodeURI(clean)}`;
    }
  }
  return null;
}

export function deserializeQuestion(raw, urlMap = {}) {
  if (!raw || typeof raw !== 'object') return null;
  const id = raw.questionId ?? 0;
  const rawSubQuestions = Array.isArray(raw.subQuestions)
    ? raw.subQuestions
    : (Array.isArray(raw.sub_questions) ? raw.sub_questions : []);
  const firstSub = rawSubQuestions[0];
  const subText = typeof firstSub === 'string' ? firstSub : (firstSub?.subQuestion ?? firstSub?.text ?? '');
  const rawTitle = (raw.questionTitle ?? raw.title ?? '').trim();

  // If rawTitle is identical to subQuestion 1 (or any sub-question), it was duplicated by older serialization
  const isDuplicateOfSub = rawSubQuestions.some((sq) => {
    const text = (typeof sq === 'string' ? sq : (sq?.subQuestion ?? sq?.text ?? '')).trim();
    return text && (text === rawTitle || text.toLowerCase() === rawTitle.toLowerCase());
  }) || (raw.text && raw.text.trim().toLowerCase() === rawTitle.toLowerCase());

  const questionTitle = isDuplicateOfSub ? '' : rawTitle;

  const base = {
    id,
    number: id,
    type: 'normal',
    questionTitle,
    text: subText || raw.text || rawTitle || '',
    marks: raw.totalMarks ?? raw.marks ?? 0,
    solution: raw.solution ?? '',
  };

  switch (raw.type) {
    case 'normal': {
      base.type = 'normal';
      base.text = subText || raw.text || rawTitle || '';
      base.answers = raw.subQuestions?.[0]?.answer ?? (Array.isArray(raw.answers) ? raw.answers : []);
      break;
    }
    case 'matching-picture':
    case 'match': {
      base.type = 'match';
      base.leftItems = (raw.pictures ?? raw.leftItems ?? []).map((item, i) => {
        if (typeof item === 'object' && item !== null) {
          const key = item.pictureKey || (typeof item.image === 'string' && item.image.startsWith('IMG_') ? item.image : null);
          const imgName = item.imageName ?? (key && raw.images?.[key]) ?? null;
          const resolvedImg = resolveImageUrl(urlMap, key, imgName) || resolveImageUrl(urlMap, item.image, imgName) || (typeof item.image === 'string' && !item.image.startsWith('IMG_') ? item.image : null);
          return {
            id: item.id ?? `l${i}`,
            label: item.label ?? '',
            image: resolvedImg,
            imageName: imgName,
            pictureKey: key,
          };
        }
        const imgName = raw.images?.[item] ?? null;
        return {
          id: `l${i}`,
          label: '',
          image: resolveImageUrl(urlMap, item, imgName),
          imageName: imgName,
          pictureKey: item,
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
      base.text = subText || raw.text || rawTitle || '';
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
          const key = item.pictureKey ?? (typeof item.image === 'string' && item.image.startsWith('IMG_') ? item.image : null);
          const imgName = item.imageName ?? (key && raw.images?.[key]) ?? null;
          return {
            id: item.id ?? `o${i}`,
            label: item.label ?? '',
            image: item.image ?? resolveImageUrl(urlMap, key, imgName),
            imageName: imgName,
            pictureKey: key,
            writingLines: item.writingLines ?? false,
          };
        }
        const imgName = raw.images?.[item] ?? null;
        return {
          id: `o${i}`,
          label: '',
          image: resolveImageUrl(urlMap, item, imgName),
          imageName: imgName,
          pictureKey: item,
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
      base.items = rawSubQuestions.length
        ? rawSubQuestions.map((sq) => (typeof sq === 'string' ? sq : (sq.subQuestion ?? sq.text ?? '')))
        : (Array.isArray(raw.items) ? raw.items : (base.text ? [base.text] : ['']));
      base.answers = rawSubQuestions.length
        ? rawSubQuestions.map((sq) => sq.answer?.[0] ?? '')
        : (Array.isArray(raw.answers) ? raw.answers : []);
      base.blankCount = base.items.length || 1;
      base.text = '';
      break;
    }
    case 'label-picture':
    case 'label': {
      base.type = 'label';
      const firstPic = raw.pictures?.[0] ?? raw.picture;
      const imgName = raw.imageName ?? (firstPic ? (raw.images?.[firstPic] ?? null) : null);
      base.image = raw.image ?? resolveImageUrl(urlMap, firstPic, imgName);
      base.imageName = imgName;
      base.pictureKey = firstPic || (typeof base.image === 'string' && base.image.startsWith('IMG_') ? base.image : null);
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
      base.text = subText || raw.text || rawTitle || '';
      base.lines = raw.lines ?? 4;
      base.fragments = raw.fragments ?? 1;
      base.sampleText = raw.sampleText ?? '';
      base.answers = raw.subQuestions?.[0]?.answer ?? (Array.isArray(raw.answers) ? raw.answers : []);
      break;
    }
    case 'true-false': {
      base.type = 'true-false';
      base.items = rawSubQuestions.length
        ? rawSubQuestions.map((sq) => (typeof sq === 'string' ? sq : (sq.subQuestion ?? sq.text ?? '')))
        : (Array.isArray(raw.items) ? raw.items : (base.text ? [base.text] : ['']));
      base.answers = rawSubQuestions.length
        ? rawSubQuestions.map((sq) => sq.answer?.[0] ?? '')
        : (Array.isArray(raw.answers) ? raw.answers : []);
      base.text = '';
      break;
    }
    default:
      base.type = 'normal';
      base.answers = raw.subQuestions?.[0]?.answer ?? (Array.isArray(raw.answers) ? raw.answers : []);
      break;
  }

  return base;
}