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

function nextImageKey(counter) {
  counter.current += 1;
  return `IMG_${String(counter.current).padStart(3, '0')}`;
}

export function buildSetPaperFormData(state, paperId, existingPaper) {
  const images = [];
  const usedNames = new Set();
  const mappedQuestions = [];
  let questionCounter = 0;
  const imageKeyCounter = { current: 0 };

  for (const q of state.questions) {
    switch (q.type) {
      case 'normal': {
        questionCounter += 1;
        mappedQuestions.push({
          type: 'normal',
          questionId: questionCounter,
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
        for (const item of q.leftItems ?? []) {
          if (item.image) {
            const imgKey = nextImageKey(imageKeyCounter);
            const fileName = createUniqueName(usedNames, item.imageName, `${item.id}.jpg`);
            if (item.imageBlob) images.push({ fileName, blob: item.imageBlob });
            imageMap[imgKey] = fileName;
            pictures.push(imgKey);
          }
        }
        questionCounter += 1;
        mappedQuestions.push({
          type: 'matching-picture',
          questionId: questionCounter,
          totalMarks: Number(q.marks || 0),
          questionTitle: q.text,
          solution: q.solution ?? '',
          letters: (q.rightItems ?? []).map((item) => item.label),
          images: imageMap,
          pictures,
          matchPairs: q.matchPairs ?? {},
        });
        break;
      }
      case 'writing': {
        questionCounter += 1;
        mappedQuestions.push({
          type: 'writing-practice',
          questionId: questionCounter,
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
        questionCounter += 1;
        const correctOption = (q.options ?? []).find((o) => o.id === q.correctOptionId);
        mappedQuestions.push({
          type: 'multiple-choice',
          questionId: questionCounter,
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
            totalMarks: Number(q.marks || 0) * pictures.length,
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
        questionCounter += 1;
        mappedQuestions.push({
          type: 'fill-in-the-blank',
          questionId: questionCounter,
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
        questionCounter += 1;
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
          questionId: questionCounter,
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
        questionCounter += 1;
        mappedQuestions.push({
          type: 'true-false',
          questionId: questionCounter,
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

  const payload = {
    template: {
      title: [state.header.subject, state.header.className, state.header.exam, state.header.academicYear]
        .filter(Boolean)
        .join(' ') || 'Untitled Paper',
      sectionId: null,
      questionCount: String(mappedQuestions.length),
      questions: mappedQuestions,
    },
    paperId: paperId || `paper-${Date.now()}`,
    subject: state.header.subject,
    classLevel: state.header.className,
    classSection: '',
    totalMarks,
    durationInMin: parseDurationToMinutes(state.header.duration),
    examTerm: state.header.exam,
    academicYear: state.header.academicYear,
    numberOfSectionsInPpr: includedSections.size,
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

  const formData = new FormData();
  if (existingPaper) {
    formData.append('dto', new Blob([JSON.stringify(payload)], { type: 'application/json' }));
    formData.append('paperId', payload.paperId);
  } else {
    formData.append('metadata', new Blob([JSON.stringify(payload)], { type: 'application/json' }));
  }
  for (const image of images) {
    if (image.blob) formData.append('files', image.blob, image.fileName);
  }
  return { formData, payload };
}