function parseDurationToMinutes(duration) {
  if (!duration) return 30;
  const match = duration.match(/(\d+)/);
  if (!match) return 30;
  const mins = Number(match[1]);
  return Number.isFinite(mins) && mins > 0 ? mins : 30;
}

function createUniqueName(used, base, fallback) {
  const fallbackClean = fallback.replace(/[\\/:*?"<>|]/g, '-').trim() || 'image.png';
  const clean = (base || fallbackClean)
    .replace(/[\\/:*?"<>|]/g, '-')
    .trim() || fallbackClean;
  let candidate = clean;
  let counter = 1;
  while (used.has(candidate.toLowerCase())) {
    const dot = clean.lastIndexOf('.');
    const stem = dot > 0 ? clean.slice(0, dot) : clean;
    const ext = dot > 0 ? clean.slice(dot) : '';
    candidate = `${stem}-${counter}${ext}`;
    counter += 1;
  }
  used.add(candidate.toLowerCase());
  return candidate;
}

function extractImageNumber(str) {
  if (typeof str !== 'string') return 0;
  const match = str.match(/IMG_(\d+)/i);
  return match ? parseInt(match[1], 10) : 0;
}

export const DEFAULT_COMMON_TITLES = {
  normal: 'Answer the following question',
  mcq: 'Choose the correct option',
  'fill-blank': 'Fill in the blanks',
  match: 'Match the following',
  'true-false': 'State whether True or False',
  writing: 'Writing Practice',
  'image-mcq': 'Choose the correct picture',
  label: 'Label the parts of the picture',
};

export function getQuestionTitle(q) {
  if (typeof q?.questionTitle === 'string' && q.questionTitle.trim()) {
    return q.questionTitle.trim();
  }
  if (typeof q?.title === 'string' && q.title.trim()) {
    return q.title.trim();
  }
  return DEFAULT_COMMON_TITLES[q?.type] || 'Answer the following question';
}

export function buildSetPaperFormData(state, paperId, existingPaper) {
  const images = [];
  const usedNames = new Set();
  const mappedQuestions = [];
  let questionCounter = 0;

  let existingTemplate = existingPaper?.template;
  if (typeof existingTemplate === 'string') {
    try {
      existingTemplate = JSON.parse(existingTemplate);
    } catch {
      existingTemplate = {};
    }
  }

  const existingUrls = {
    ...(state.urls ?? {}),
    ...(existingPaper?.urls ?? {}),
    ...(existingTemplate?.urls ?? {}),
  };

  const usedKeys = new Set();
  let maxImgNum = 0;

  const registerKey = (k) => {
    if (typeof k === 'string' && k.startsWith('IMG_')) {
      usedKeys.add(k);
      const num = extractImageNumber(k);
      if (num > maxImgNum) maxImgNum = num;
    }
  };

  Object.keys(existingUrls).forEach(registerKey);
  for (const q of state.questions) {
    if (q.pictureKey) registerKey(q.pictureKey);
    for (const item of q.leftItems ?? []) {
      if (item.pictureKey) registerKey(item.pictureKey);
      if (typeof item.image === 'string' && item.image.startsWith('IMG_')) registerKey(item.image);
    }
    for (const opt of q.options ?? []) {
      if (opt.pictureKey) registerKey(opt.pictureKey);
      if (typeof opt.image === 'string' && opt.image.startsWith('IMG_')) registerKey(opt.image);
    }
  }

  const rawExistingQuestions = Array.isArray(existingTemplate?.sections) && existingTemplate.sections.length > 0
    ? existingTemplate.sections.flatMap((s) => s?.questions ?? [])
    : (Array.isArray(existingTemplate?.questions) ? existingTemplate.questions : []);

  for (const raw of rawExistingQuestions) {
    if (raw?.images && typeof raw.images === 'object') {
      Object.keys(raw.images).forEach(registerKey);
    }
    if (Array.isArray(raw?.pictures)) {
      raw.pictures.forEach(registerKey);
    }
  }

  const imageKeyCounter = { current: maxImgNum };

  function getNextImageKey() {
    do {
      imageKeyCounter.current += 1;
    } while (usedKeys.has(`IMG_${String(imageKeyCounter.current).padStart(3, '0')}`));
    const key = `IMG_${String(imageKeyCounter.current).padStart(3, '0')}`;
    usedKeys.add(key);
    return key;
  }

  for (const q of state.questions) {
    switch (q.type) {
      case 'normal': {
        questionCounter += 1;
        mappedQuestions.push({
          type: 'normal',
          questionId: questionCounter,
          totalMarks: Number(q.marks || 0),
          questionTitle: getQuestionTitle(q),
          solution: q.solution ?? '',
          subQuestions: [{ subQuestionId: 1, subQuestion: q.text, options: [], answer: q.answers ?? [] }],
        });
        break;
      }
      case 'match': {
        const imageMap = {};
        const pictures = [];
        for (const item of q.leftItems ?? []) {
          if (item.image || item.imageBlob || item.pictureKey) {
            let imgKey = item.pictureKey;
            if (!imgKey || item.imageBlob) {
              imgKey = getNextImageKey();
            }
            usedKeys.add(imgKey);
            const fileName = createUniqueName(usedNames, item.imageName, `${item.id}.jpg`);
            if (item.imageBlob) {
              images.push({ fileName, blob: item.imageBlob });
              imageMap[imgKey] = fileName;
            } else {
              imageMap[imgKey] = item.imageName || fileName;
            }
            pictures.push(imgKey);
          }
        }
        questionCounter += 1;
        mappedQuestions.push({
          type: 'matching-picture',
          images: imageMap,
          letters: (q.rightItems ?? []).map((item) => (typeof item === 'object' ? item.label : String(item ?? ''))),
          pictures,
          solution: q.solution ?? '',
          matchPairs: q.matchPairs ?? {},
          questionId: questionCounter,
          totalMarks: Number(q.marks || 0),
          questionTitle: getQuestionTitle(q),
        });
        break;
      }
      case 'writing': {
        questionCounter += 1;
        mappedQuestions.push({
          type: 'writing-practice',
          questionId: questionCounter,
          totalMarks: Number(q.marks || 0),
          questionTitle: getQuestionTitle(q),
          solution: q.solution ?? '',
          lines: q.lines,
          fragments: q.fragments,
          sampleText: q.sampleText,
          subQuestions: [{ subQuestionId: 1, subQuestion: q.text, options: [], answer: q.answers ?? [] }],
        });
        break;
      }
      case 'mcq': {
        questionCounter += 1;
        const correctOption = (q.options ?? []).find((o) => o.id === q.correctOptionId);
        mappedQuestions.push({
          type: 'multiple-choice',
          questionId: questionCounter,
          totalMarks: Number(q.marks || 0),
          questionTitle: getQuestionTitle(q),
          solution: q.solution ?? '',
          subQuestions: [
            {
              subQuestionId: 1,
              subQuestion: q.text,
              options: (q.options ?? []).map((option) => option.label),
              answer: correctOption ? [correctOption.label] : [],
            },
          ],
        });
        break;
      }
      case 'image-mcq': {
        const imageMap = {};
        const pictures = [];
        const imgOptions = (q.options ?? []).filter((option) => option.image || option.imageBlob || option.pictureKey);
        for (const option of imgOptions) {
          if (option.image || option.imageBlob || option.pictureKey) {
            let imgKey = option.pictureKey;
            if (!imgKey || option.imageBlob) {
              imgKey = getNextImageKey();
            }
            usedKeys.add(imgKey);
            const fileName = createUniqueName(usedNames, option.imageName, `${option.id}.jpg`);
            if (option.imageBlob) {
              images.push({ fileName, blob: option.imageBlob });
              imageMap[imgKey] = fileName;
            } else {
              imageMap[imgKey] = option.imageName || fileName;
            }
            pictures.push(imgKey);
          }
        }
        if (pictures.length > 0) {
          questionCounter += 1;
          const writingMode = (q.options ?? []).some((option) => option.writingLines);
          let answers = [];
          if (writingMode) {
            answers = imgOptions.map((_, i) => q.answers?.[i] ?? '');
          } else {
            const correctIdx = imgOptions.findIndex((o) => o.id === q.correctOptionId);
            answers = correctIdx >= 0 ? [pictures[correctIdx]] : [];
          }
          mappedQuestions.push({
            type: 'color-the-image',
            mode: writingMode ? 'write' : 'circle',
            questionId: questionCounter,
            totalMarks: Number(q.marks || 0),
            questionTitle: getQuestionTitle(q),
            solution: q.solution ?? '',
            images: imageMap,
            pictures,
            answers,
          });
        }
        break;
      }
      case 'fill-blank': {
        const items = q.items ?? (q.text ? [q.text] : []);
        questionCounter += 1;
        mappedQuestions.push({
          type: 'fill-in-the-blank',
          questionId: questionCounter,
          totalMarks: Number(q.marks || 0),
          questionTitle: getQuestionTitle(q),
          solution: q.solution ?? '',
          subQuestions: items.map((item, index) => ({
            subQuestionId: index + 1,
            subQuestion: item,
            options: [],
            answer: q.answers?.[index] ? [q.answers[index]] : [],
          })),
        });
        break;
      }
      case 'label': {
        questionCounter += 1;
        const labelImageMap = {};
        let labelPicture;
        if (q.image || q.imageBlob || q.pictureKey) {
          let imgKey = q.pictureKey;
          if (!imgKey || q.imageBlob) {
            imgKey = getNextImageKey();
          }
          usedKeys.add(imgKey);
          const fileName = createUniqueName(usedNames, q.imageName, `${q.id}.jpg`);
          if (q.imageBlob) {
            images.push({ fileName, blob: q.imageBlob });
            labelImageMap[imgKey] = fileName;
          } else {
            labelImageMap[imgKey] = q.imageName || fileName;
          }
          labelPicture = imgKey;
        }
        mappedQuestions.push({
          type: 'label-picture',
          questionId: questionCounter,
          totalMarks: Number(q.marks || 0),
          questionTitle: getQuestionTitle(q),
          solution: q.solution ?? '',
          pictures: labelPicture ? [labelPicture] : [],
          images: labelImageMap,
          picture: labelPicture,
          labelMarkers: q.labelMarkers ?? [],
          answers: q.answers ?? [],
        });
        break;
      }
      case 'true-false': {
        const items = q.items ?? (q.text ? [q.text] : []);
        questionCounter += 1;
        mappedQuestions.push({
          type: 'true-false',
          questionId: questionCounter,
          totalMarks: Number(q.marks || 0),
          questionTitle: getQuestionTitle(q),
          solution: q.solution ?? '',
          subQuestions: items.map((item, index) => ({
            subQuestionId: index + 1,
            subQuestion: item,
            options: ['True', 'False'],
            answer: q.answers?.[index] ? [q.answers[index]] : [],
          })),
        });
        break;
      }
      default:
        break;
    }
  }

  const totalMarks = mappedQuestions.reduce(
    (sum, item) => sum + Number(item.totalMarks || 0),
    0,
  );
  const includedSections = new Set(
    state.questions.map((q) => q.number ?? 1),
  );

  const sampleUrl = Object.values(existingUrls).find((u) => typeof u === 'string' && u.startsWith('http'));
  let baseUrl = sampleUrl ? sampleUrl.substring(0, sampleUrl.lastIndexOf('/') + 1) : null;
  const pId = paperId || existingPaper?.paperId || existingPaper?.id;
  if (!baseUrl && pId) {
    baseUrl = `https://cargofile.s3.ap-south-1.amazonaws.com/primarySchool/${pId}/`;
  }

  // Ensure every image key used in mapped questions has a URL in existingUrls
  for (const q of mappedQuestions) {
    if (q.images && typeof q.images === 'object') {
      for (const [key, fName] of Object.entries(q.images)) {
        if (!existingUrls[key] && fName) {
          const clean = String(fName).trim();
          const matchExisting = Object.values(existingUrls).find((u) => {
            if (typeof u !== 'string') return false;
            const pathPart = u.split('?')[0].split('#')[0];
            const filePart = pathPart.substring(pathPart.lastIndexOf('/') + 1);
            return filePart === clean || filePart === encodeURI(clean) || decodeURIComponent(filePart) === clean;
          });
          if (matchExisting) {
            existingUrls[key] = matchExisting;
          } else if (baseUrl) {
            existingUrls[key] = `${baseUrl}${encodeURI(clean)}`;
          }
        }
      }
    }
  }

  const templateTitle =
    state.header.schoolName ||
    existingTemplate?.title ||
    [state.header.subject, state.header.className, state.header.exam, state.header.academicYear]
      .filter(Boolean)
      .join(' ') ||
    'Untitled Paper';

  const templateObj = {
    urls: Object.keys(existingUrls).length > 0 ? existingUrls : undefined,
    title: templateTitle,
    questions: mappedQuestions,
    sectionId: existingTemplate?.sectionId ?? null,
  };

  const payload = {};
  if (existingPaper?.id != null) {
    payload.id = existingPaper.id;
  }
  payload.template = templateObj;
  payload.subject = state.header.subject || existingPaper?.subject || '';
  payload.classLevel = state.header.className || existingPaper?.classLevel || '';
  payload.classSection = existingPaper?.classSection ?? '';
  payload.totalMarks = totalMarks || Number(state.header.totalMarks) || existingPaper?.totalMarks || 0;
  payload.totalQuestions = mappedQuestions.length;
  payload.durationInMin = parseDurationToMinutes(state.header.duration) || existingPaper?.durationInMin || 30;
  payload.examTerm = state.header.exam || existingPaper?.examTerm || '';
  payload.academicYear = state.header.academicYear || existingPaper?.academicYear || '';
  payload.numberOfSectionsInPpr = existingPaper?.numberOfSectionsInPpr ?? includedSections.size ?? 1;
  payload.exam_board = existingPaper?.exam_board ?? null;
  payload.fromTheme = existingPaper?.fromTheme ?? null;
  payload.published = existingPaper?.published ?? null;
  payload.publishedAt = existingPaper?.publishedAt ?? null;
  payload.publish_link = existingPaper?.publish_link ?? null;
  payload.createdAt = existingPaper?.createdAt ?? null;
  payload.updatedAt = existingPaper?.updatedAt ?? null;
  payload.paperId = paperId || existingPaper?.paperId || `paper-${Date.now()}`;

  if (state.header.logo) {
    const logoFileName = createUniqueName(usedNames, state.header.logoName, 'logo.png');
    payload.logo = logoFileName;
    payload.logoName = state.header.logoName || logoFileName;
    payload.template.images = { ...(payload.template.images ?? {}), LOGO: logoFileName };
    if (baseUrl && !existingUrls.LOGO) {
      existingUrls.LOGO = `${baseUrl}${encodeURI(logoFileName)}`;
      payload.template.urls = existingUrls;
    }
    if (state.header.logoBlob) images.push({ fileName: logoFileName, blob: state.header.logoBlob });
  }

  const formData = new FormData();
  const jsonBlob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
  formData.append('metadata', jsonBlob);

  let hasFiles = false;
  for (const image of images) {
    if (image.blob) {
      formData.append('files', image.blob, image.fileName);
      hasFiles = true;
    }
  }
  if (!hasFiles) {
    formData.append('files', 'string');
  }

  return { formData, payload };
}