function parseDurationToMinutes(duration) {
  if (!duration) return 30;
  const match = duration.match(/(\d+)/);
  if (!match) return 30;
  const mins = Number(match[1]);
  return Number.isFinite(mins) && mins > 0 ? mins : 30;
}

function dataURLToBlob(dataUrl) {
  const commaIndex = dataUrl.indexOf(',');
  const meta = commaIndex >= 0 ? dataUrl.slice(0, commaIndex) : '';
  const body = commaIndex >= 0 ? dataUrl.slice(commaIndex + 1) : dataUrl;
  const mimeMatch = /data:([^;]+)/.exec(meta);
  const mime = mimeMatch?.[1] ?? 'application/octet-stream';
  const binary = atob(body);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
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

export function buildSetPaperFormData(state) {
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
            images.push({ fileName, base64: item.image });
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
            images.push({ fileName, base64: option.image });
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
          images.push({ fileName, base64: q.image });
          labelImageMap[imgKey] = fileName;
          labelPicture = imgKey;
        }
        mappedQuestions.push({
          type: 'label-picture',
          questionId: questionCounter,
          totalMarks: Number(q.marks || 0),
          questionTitle: q.text,
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
    paperId: `paper-${Date.now()}`,
    subject: state.header.subject,
    classLevel: state.header.className,
    classSection: '',
    totalMarks,
    durationInMin: parseDurationToMinutes(state.header.duration),
    examTerm: state.header.exam,
    academicYear: state.header.academicYear,
    numberOfSectionsInPpr: includedSections.size,
  };

  if (state.header.logo) {
    const logoFileName = createUniqueName(usedNames, state.header.logoName, 'logo.png');
    payload.logo = logoFileName;
    payload.logoName = state.header.logoName || logoFileName;
    payload.template.images = { ...(payload.template.images ?? {}), LOGO: logoFileName };
    images.push({ fileName: logoFileName, base64: state.header.logo });
  }

  const formData = new FormData();
  formData.append('metadata', new Blob([JSON.stringify(payload)], { type: 'application/json' }));
  for (const image of images) {
    formData.append('files', dataURLToBlob(image.base64), image.fileName);
  }
  return { formData, payload };
}