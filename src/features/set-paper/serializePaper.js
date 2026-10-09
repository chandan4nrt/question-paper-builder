function parseDurationToMinutes(duration) {
  if (!duration) return 30;
  if (typeof duration === 'number') return duration > 0 ? duration : 30;
  const str = String(duration).toLowerCase().trim();

  let totalMinutes = 0;
  let matched = false;

  const hrMatch = str.match(/(\d+(?:\.\d+)?)\s*(?:hr|hour|h)s?/);
  if (hrMatch) {
    totalMinutes += Math.round(parseFloat(hrMatch[1]) * 60);
    matched = true;
  }

  const minMatch = str.match(/(\d+)\s*(?:min|minute|m)s?/);
  if (minMatch) {
    totalMinutes += parseInt(minMatch[1], 10);
    matched = true;
  }

  if (matched && totalMinutes > 0) {
    return totalMinutes;
  }

  const numMatch = str.match(/(\d+)/);
  if (numMatch) {
    const mins = parseInt(numMatch[1], 10);
    return mins > 0 ? mins : 30;
  }

  return 30;
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

function nextImageKey(counter) {
  counter.current += 1;
  return `IMG_${String(counter.current).padStart(3, '0')}`;
}

function getQuestionId(q, counterRef) {
  const candidate = Number(q.id ?? q.questionId);
  if (Number.isFinite(candidate) && candidate > 0) {
    return candidate;
  }
  counterRef.current += 1;
  return counterRef.current;
}

function normalizeAnswer(answer) {
  if (answer == null || answer.length === 0) return null;
  return Array.isArray(answer)
    ? answer.map((item) => String(item ?? '')).join(',')
    : String(answer);
}

function toQuestionRequest(question) {
  const images = Object.entries(question.images ?? {}).map(
    ([imageId, imageName]) => ({ imageId, imageName }),
  );

  return {
    questionId: Number(question.questionId),
    questionTitle: question.questionTitle ?? '',
    type: question.type ?? '',
    marks: Number(question.totalMarks ?? question.marks ?? 0),
    answer: normalizeAnswer(question.answers ?? question.answer),
    options: question.options ?? null,
    subQuestions: (question.subQuestions ?? []).map((subQuestion) => ({
      subQuestionId: Number(subQuestion.subQuestionId ?? 1),
      subQuestionTitle:
        subQuestion.subQuestionTitle ?? subQuestion.subQuestion ?? '',
      marks: subQuestion.marks ?? null,
      answer: normalizeAnswer(subQuestion.answer),
      options: subQuestion.options ?? null,
      images: subQuestion.images ?? null,
    })),
    images: images.length > 0 ? images : null,
  };
}

export function buildSetPaperFormData(state, paperId, existingPaper) {
  const images = [];
  const usedNames = new Set();
  const mappedQuestions = [];
  const maxExistingId = state.questions.reduce((max, q) => {
    const num = Number(q.id ?? q.questionId);
    return Number.isFinite(num) && num > max ? num : max;
  }, 0);
  const questionIdCounter = { current: maxExistingId };
  const imageKeyCounter = { current: 0 };

  for (const q of state.questions) {
    const qId = getQuestionId(q, questionIdCounter);
    switch (q.type) {
      case 'normal': {
        mappedQuestions.push({
          type: 'normal',
          questionId: qId,
          totalMarks: Number(q.marks || 0),
          questionTitle: q.text,
          solution: q.solution ?? '',
          subQuestions: [{ subQuestionId: 1, subQuestion: q.text, options: [], answer: q.answers ?? [] }],
        });
        break;
      }
      case 'match': {
        const imageMap = {};
        const pictures = [];
        const leftItems = [];
        const leftLabels = [];
        for (const item of q.leftItems ?? []) {
          const label = item.label ?? '';
          leftLabels.push(label);
          let imgKey = null;
          if (item.image) {
            imgKey = nextImageKey(imageKeyCounter);
            const fileName = createUniqueName(usedNames, item.imageName, `${item.id}.jpg`);
            if (item.imageBlob) images.push({ fileName, blob: item.imageBlob });
            imageMap[imgKey] = fileName;
            pictures.push(imgKey);
          }
          leftItems.push({
            label,
            imageKey: imgKey,
          });
        }
        mappedQuestions.push({
          type: 'matching-picture',
          questionId: qId,
          totalMarks: Number(q.marks || 0),
          questionTitle: q.text,
          solution: q.solution ?? '',
          letters: (q.rightItems ?? []).map((item) => item.label),
          images: imageMap,
          pictures,
          leftItems,
          leftLabels,
          matchPairs: q.matchPairs ?? {},
        });
        break;
      }
      case 'writing': {
        mappedQuestions.push({
          type: 'writing-practice',
          questionId: qId,
          totalMarks: Number(q.marks || 0),
          questionTitle: q.text,
          solution: q.solution ?? '',
          lines: q.lines,
          fragments: q.fragments,
          sampleText: q.sampleText,
          subQuestions: [{ subQuestionId: 1, subQuestion: q.text, options: [], answer: q.answers ?? [] }],
        });
        break;
      }
      case 'mcq': {
        const correctOption = (q.options ?? []).find((o) => o.id === q.correctOptionId);
        mappedQuestions.push({
          type: 'multiple-choice',
          questionId: qId,
          totalMarks: Number(q.marks || 0),
          questionTitle: q.text,
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
        const imgOptions = (q.options ?? []).filter((option) => option.image);
        for (const option of imgOptions) {
          if (option.image) {
            const imgKey = nextImageKey(imageKeyCounter);
            const fileName = createUniqueName(usedNames, option.imageName, `${option.id}.jpg`);
            if (option.imageBlob) images.push({ fileName, blob: option.imageBlob });
            imageMap[imgKey] = fileName;
            pictures.push(imgKey);
          }
        }
        if (pictures.length > 0) {
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
            questionId: qId,
            totalMarks: Number(q.marks || 0),
            questionTitle: q.text,
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
        mappedQuestions.push({
          type: 'fill-in-the-blank',
          questionId: qId,
          totalMarks: Number(q.marks || 0),
          questionTitle: q.text,
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
        const labelImageMap = {};
        let labelPicture;
        if (q.image) {
          const imgKey = nextImageKey(imageKeyCounter);
          const fileName = createUniqueName(usedNames, q.imageName, `${q.id}.jpg`);
          if (q.imageBlob) images.push({ fileName, blob: q.imageBlob });
          labelImageMap[imgKey] = fileName;
          labelPicture = imgKey;
        }
        mappedQuestions.push({
          type: 'label-picture',
          questionId: qId,
          totalMarks: Number(q.marks || 0),
          questionTitle: q.text,
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
        mappedQuestions.push({
          type: 'true-false',
          questionId: qId,
          totalMarks: Number(q.marks || 0),
          questionTitle: q.text,
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

  const effectivePaperId = paperId || `paper-${Date.now()}`;

  const paperTitle = [state.header.subject, state.header.className, state.header.exam, state.header.academicYear]
    .filter(Boolean)
    .join(' ') || 'Untitled Paper';

  const payload = {
    id: existingPaper?.id != null ? existingPaper.id : undefined,
    paperId: effectivePaperId,
    title: paperTitle,
    subject: state.header.subject ?? '',
    classLevel: state.header.className ?? '',
    classSection: state.header.classSection ?? '',
    schoolName: state.header.schoolName ?? '',
    date: state.header.date ?? '',
    teacherName: state.header.teacherName ?? '',
    instructions: state.header.instructions ?? '',
    totalMarks,
    totalQuestions: mappedQuestions.length,
    durationInMin: parseDurationToMinutes(state.header.duration),
    examTerm: state.header.exam ?? '',
    academicYear: state.header.academicYear ?? '',
    numberOfSectionsInPpr: includedSections.size,
    questions: mappedQuestions,
    paper_status: state.published === true ? 'PUBLISHED' : 'UNPUBLISHED',
    paperStatus: state.published === true ? 'PUBLISHED' : 'UNPUBLISHED',
    published: state.published === true,
    publishedAt: state.published === true ? (state.publishedAt ?? new Date().toISOString()) : null,
    publish_link:
      state.published === true
        ? (state.publish_link || state.publishLink || null)
        : null,
    publishLink:
      state.published === true
        ? (state.publish_link || state.publishLink || null)
        : null,
    active: true,
    template: {
      title: paperTitle,
      sectionId: null,
      questionCount: String(mappedQuestions.length),
      questions: mappedQuestions,
      schoolName: state.header.schoolName ?? '',
      date: state.header.date ?? '',
      teacherName: state.header.teacherName ?? '',
      instructions: state.header.instructions ?? '',
    },
  };

  if (existingPaper) {
    if (existingPaper.id != null) payload.id = existingPaper.id;
    if (existingPaper.createdAt) payload.createdAt = existingPaper.createdAt;
    if (existingPaper.updatedAt) payload.updatedAt = existingPaper.updatedAt;
    const urls = existingPaper.template?.urls ?? state.urls ?? {};
    if (Object.keys(urls).length > 0) payload.template.urls = urls;
  }

  if (state.header.logo) {
    const logoFileName = createUniqueName(usedNames, state.header.logoName, 'logo.png');
    payload.logo = logoFileName;
    payload.logoName = state.header.logoName || logoFileName;
    payload.template.images = { ...(payload.template.images ?? {}), LOGO: logoFileName };
    if (state.header.logoBlob) images.push({ fileName: logoFileName, blob: state.header.logoBlob });
  }

  const multipartPayload = {
    totalMarks: payload.totalMarks,
    academicYear: payload.academicYear,
    examBoard: payload.examBoard ?? '',
    paperId: payload.paperId,
    totalQuestions: payload.totalQuestions,
    examTerm: payload.examTerm,
    classLevel: payload.classLevel,
    subject: payload.subject,
    questions: mappedQuestions.map(toQuestionRequest),
    classSection: payload.classSection,
    title: payload.title,
    durationInMin: payload.durationInMin,
    numberOfSectionsInPpr: String(payload.numberOfSectionsInPpr),
  };

  const formData = new FormData();
  formData.append(
    'metadata',
    new Blob([JSON.stringify(multipartPayload)], {
      type: 'application/json',
    }),
  );

  for (const image of images) {
    if (image.blob) formData.append('files', image.blob, image.fileName);
  }
  return { formData, payload };
}

export function buildPublishPayload() {

 

  return {
   
    paperId: effectivePaperId,
    
  };
}