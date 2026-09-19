import { QUESTION_TYPES } from './types';

// Maps paper-builder question types to the LLM generation endpoints.
// Types without an endpoint (image-mcq, label, true-false, writing) are added
// as empty questions directly and do not open the AI generation flow.
export const AI_ENDPOINTS = {
  [QUESTION_TYPES.NORMAL]: '/api/v1/generate/short-question-answer',
  [QUESTION_TYPES.MATCH]: '/api/v1/generate/match-the-following',
  [QUESTION_TYPES.MCQ]: '/api/v1/generate/mcq',
  [QUESTION_TYPES.FILL_BLANK]: '/api/v1/generate/fill-in-the-blanks',
};

export function hasAiGeneration(type) {
  return Boolean(AI_ENDPOINTS[type]);
}

// Builds the multipart/form-data generation payload per the LLM API contract.
export const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB per file

export function buildGenerationPayload({
  numQuestions = 5,
  topic = '',
  gradeLevel = '',
  difficulty = 'medium',
  subject = '',
  text = null,
  extraInstructions = '',
  images = [],
  pdf = null,
} = {}) {
  const formData = new FormData();
  formData.append('num_questions', String(Number(numQuestions) || 5));
  formData.append('topic', topic);
  formData.append('grade_level', gradeLevel);
  formData.append('difficulty', difficulty);
  formData.append('subject', subject);
  if (text) formData.append('text', text);
  formData.append('extra_instructions', extraInstructions);
  asArray(images).forEach((file) => {
    if (file) formData.append('images', file);
  });
  if (pdf) formData.append('pdf', pdf);
  return formData;
}

function asArray(value) {
  if (Array.isArray(value)) return value;
  if (value == null) return [];
  return [value];
}

function firstString(obj, keys) {
  if (!obj || typeof obj !== 'object') return '';
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

function firstArray(obj, keys) {
  if (!obj || typeof obj !== 'object') return [];
  for (const key of keys) {
    const value = obj[key];
    if (Array.isArray(value)) return value;
  }
  return [];
}

function optionLabel(value) {
  if (typeof value === 'string') return value.trim();
  if (value && typeof value === 'object') {
    return (
      value.label ??
      value.text ??
      value.optionText ??
      value.value ??
      value.choice ??
      JSON.stringify(value)
    );
  }
  return String(value ?? '');
}

function extractOptions(item) {
  const raw = firstArray(item, ['options', 'choices', 'choiceList', 'answerOptions', 'mcq_options']);
  if (Array.isArray(raw)) {
    const nested = raw[0] && typeof raw[0] === 'object' && Array.isArray(raw[0].options) ? raw[0].options : null;
    const labels = (nested ?? raw).map(optionLabel).filter(Boolean);
    if (labels.length > 0) return labels;
  }
  if (!item || typeof item !== 'object') return [];
  for (const key of ['options', 'choices', 'choiceList', 'answerOptions', 'mcq_options']) {
    const value = item[key];
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return Object.values(value).map(optionLabel).filter(Boolean);
    }
  }
  return [];
}

function normalizeLetter(value) {
  const text = String(value ?? '').trim();
  const exact = text.match(/^[\(]?([A-Za-z])[\)\.]?\s*$/);
  if (exact) return exact[1].toUpperCase().charCodeAt(0) - 65;
  const prefixed = text.match(/^[\(]?([A-Za-z])[\)\.:]\s/);
  if (prefixed) return prefixed[1].toUpperCase().charCodeAt(0) - 65;
  return -1;
}

function findCorrectIndex(item, options) {
  const explicitFlagIndex = firstArray(item, ['options', 'choices', 'choiceList'])
    .findIndex((opt) => opt && typeof opt === 'object' && (opt.isCorrect === true || opt.correct === true));
  if (explicitFlagIndex >= 0) return explicitFlagIndex;

  const indexValue = firstString(item, ['correctIndex', 'correct_option_index', 'correctOptionIndex', 'answerIndex', 'answer_index']);
  if (indexValue !== '') {
    const parsed = Number(indexValue);
    if (Number.isInteger(parsed) && parsed >= 0 && parsed < options.length) return parsed;
  }

  const answerValue =
    firstString(item, ['answer', 'answer_key', 'correctAnswer', 'correct_answer', 'correct', 'answerKey']) ||
    (item.correct && typeof item.correct === 'object'
      ? firstString(item.correct, ['text', 'label', 'value'])
      : '');
  if (!answerValue) return -1;

  const byLetter = normalizeLetter(answerValue);
  if (byLetter >= 0 && byLetter < options.length) return byLetter;

  const byNumber = Number(answerValue);
  if (Number.isInteger(byNumber) && byNumber >= 1 && byNumber <= options.length) return byNumber - 1;

  const byText = options.findIndex((label) => label.toLowerCase() === answerValue.toLowerCase());
  if (byText >= 0) return byText;

  return -1;
}

function extractCorrectAnswer(item) {
  let answer =
    firstString(item, ['answer', 'answer_text', 'correctAnswer', 'expectedAnswer', 'modelAnswer', 'correct', 'response', 'solution']) ||
    '';
  if (!answer && item.answer && typeof item.answer === 'object') {
    answer = firstString(item.answer, ['text', 'value', 'label']);
  }
  if (!answer && item.correctAnswer && typeof item.correctAnswer === 'object') {
    answer = firstString(item.correctAnswer, ['text', 'value', 'label']);
  }
  return answer;
}

function extractSolution(item) {
  if (typeof item === 'string') return '';
  if (item && typeof item === 'object' && !Array.isArray(item)) {
    const solution =
      firstString(item, ['solution', 'explanation', 'answer_explanation', 'answerExplanation', 'detailed_solution', 'elaboration']) || '';
    if (solution) return solution;
    if (item.solution && typeof item.solution === 'object') {
      return firstString(item.solution, ['text', 'content', 'value', 'explanation']);
    }
  }
  return '';
}

function parseMcq(item) {
  const text = firstString(item, ['questionText', 'question', 'prompt', 'statement', 'text', 'question_text', 'question_statement']);
  const options = extractOptions(item);
  if (options.length < 2) return null;
  const correctIndex = findCorrectIndex(item, options);
  const parsedOptions = options.map((label, index) => ({ id: `o${index + 1}`, label }));
  return {
    type: QUESTION_TYPES.MCQ,
    text,
    options: parsedOptions,
    correctOptionId: correctIndex >= 0 ? parsedOptions[correctIndex].id : undefined,
    marks: 1,
    solution: extractSolution(item),
  };
}

function splitAnswerFromSentence(sentence) {
  const match = sentence.match(/^(.+?)\s*[\(\[【]\s*(.+?)\s*[\)\]】]\s*$/);
  if (match) return { sentence: match[1].trim(), answer: match[2].trim() };
  return { sentence, answer: '' };
}

function parseFillBlank(item) {
  if (typeof item === 'string') {
    const { sentence, answer } = splitAnswerFromSentence(item);
    return { type: QUESTION_TYPES.FILL_BLANK, text: sentence, items: [sentence], answers: answer ? [answer] : [], marks: 1, solution: '' };
  }
  const sentence = firstString(item, ['sentence', 'question', 'statement', 'question_text', 'questionText', 'text', 'blank', 'question_statement']);
  const answer = extractCorrectAnswer(item);
  return { type: QUESTION_TYPES.FILL_BLANK, text: sentence, items: [sentence], answers: answer ? [answer] : [], marks: 1, solution: extractSolution(item) };
}

function parseMatch(item) {
  let pairs = [];
  const rawPairs = firstArray(item, ['pairs', 'matches', 'matchPairs', 'pairsList', 'matching_pairs']);
  if (rawPairs.length > 0) {
    pairs = rawPairs
      .map((pair) => {
        const arr = asArray(pair);
        if (arr.length >= 2) return [optionLabel(arr[0]), optionLabel(arr[1])];
        if (pair && typeof pair === 'object') {
          return [
            firstString(pair, ['left', 'leftItem', 'from', 'key', 'a', 'first', 'text']),
            firstString(pair, ['right', 'rightItem', 'to', 'value', 'b', 'second', 'match', 'match_text']),
          ];
        }
        return ['', ''];
      })
      .filter(([left]) => Boolean(left));
  } else {
    const left = firstArray(item, ['left', 'leftItems', 'columnA', 'colA', 'left_column']).map(optionLabel).filter(Boolean);
    const right = firstArray(item, ['right', 'rightItems', 'columnB', 'colB', 'right_column']).map(optionLabel).filter(Boolean);
    if (left.length === 0) return null;
    const count = Math.max(left.length, right.length);
    pairs = Array.from({ length: count }, (_, i) => [left[i] ?? '', right[i] ?? '']);
  }
  if (pairs.length === 0) return null;

  const leftItems = pairs.map(([label], index) => ({ id: `l${index + 1}`, label, image: null }));
  const rightItems = pairs.map(([, label], index) => ({ id: `r${index + 1}`, label }));
  const matchPairs = {};
  leftItems.forEach((left, index) => {
    const right = rightItems[index];
    if (right && pairs[index]?.[1]) matchPairs[left.id] = right.id;
  });

  return {
    type: QUESTION_TYPES.MATCH,
    text: firstString(item, ['question', 'questionText', 'instruction', 'text', 'question_text', 'title']) || 'Match the following',
    leftItems,
    rightItems,
    matchPairs,
    marks: 1,
    solution: extractSolution(item),
  };
}

function parseQa(item) {
  const text = firstString(item, ['questionText', 'question', 'prompt', 'statement', 'text', 'question_text', 'question_statement']);
  const answer = extractCorrectAnswer(item);
  if (!text) return null;
  return { type: QUESTION_TYPES.NORMAL, text, answers: answer ? [answer] : [], marks: 1, solution: extractSolution(item) };
}

const PARSERS = {
  [QUESTION_TYPES.MCQ]: parseMcq,
  [QUESTION_TYPES.FILL_BLANK]: parseFillBlank,
  [QUESTION_TYPES.MATCH]: parseMatch,
  [QUESTION_TYPES.NORMAL]: parseQa,
};

function fallbackQuestion(item) {
  const label = typeof item === 'string' ? item : JSON.stringify(item);
  return { type: QUESTION_TYPES.NORMAL, text: label, answers: [], marks: 1 };
}

export function extractQuestionList(data) {
  if (Array.isArray(data)) return data;

  if (data && typeof data === 'string') {
    try {
      const parsed = JSON.parse(data);
      return extractQuestionList(parsed);
    } catch {
      return [data];
    }
  }

  if (!data || typeof data !== 'object') return [data];

  const keys = [
    'questions',
    'data',
    'items',
    'results',
    'content',
    'question_bank',
    'questionBank',
    'quiz',
    'mcq_questions',
    'mcqQuestions',
    'fill_in_the_blanks',
    'match_the_following',
    'short_question_answers',
    'long_question_answers',
    'questions_list',
    'question_list',
    'response',
  ];
  for (const key of keys) {
    const value = data[key];
    if (Array.isArray(value)) return value;
    if (value && typeof value === 'object' && Array.isArray(value.questions)) return value.questions;
  }

  return [data];
}

// Converts the raw LLM response into paper-builder question objects.
export function parseGeneratedQuestions(type, data) {
  const list = extractQuestionList(data);
  if (list.length === 0) return [];

  const parser = PARSERS[type];
  return list
    .map((item) => (parser ? parser(item) : null) ?? fallbackQuestion(item))
    .filter((q) => q && ((q.text && q.text.trim()) || (q.items && q.items.length)));
}