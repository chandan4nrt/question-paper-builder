import {
  generateQuestions,
} from '../../services/generationApi';
import { buildGenerationPayload, parseGeneratedQuestions } from '../set-paper/aiGeneration';
import { QUESTION_TYPES } from '../set-paper/types';
import { QUESTION_TYPE_CONFIG, BLOOM_IDS } from './bloom';

const ENDPOINTS = {
  mcq: '/api/v1/generate/mcq',
  short: '/api/v1/generate/short-question-answer',
  scenario: '/api/v1/generate/long-question-answer',
};

// Distributes questions across Bloom's levels so the final mix matches the
// blueprint percentage as closely as possible. Uses the largest remainder
// method for exact totals, then round-robins the levels so the order does not
// clump the same level together.
export function assignBloomLevels(questions, blueprint = {}) {
  if (!questions || questions.length === 0) return [];
  const n = questions.length;
  const exact = BLOOM_IDS.map((id) => (Number(blueprint[id]) || 0) / 100 * n);
  const counts = exact.map(Math.floor);
  let remaining = n - counts.reduce((a, b) => a + b, 0);
  const order = BLOOM_IDS.map((_, i) => i).sort((a, b) => exact[b] - exact[a] || a - b);
  for (let i = 0; i < remaining; i += 1) counts[order[i % order.length]] += 1;

  const buckets = BLOOM_IDS.map((id, i) => Array(counts[i]).fill(id));
  const levels = [];
  let cursor = 0;
  while (levels.length < n) {
    const bucket = buckets[cursor % buckets.length];
    if (bucket.length > 0) levels.push(bucket.shift());
    cursor += 1;
  }

  return questions.map((question, index) => ({ ...question, bloomLevel: levels[index] }));
}

function toQuestionShape(typeConfig, parsed, index, source) {
  const base = { id: `q${index}`, type: typeConfig.id, marks: typeConfig.marks, source };
  if (typeConfig.id === 'mcq') {
    return {
      ...base,
      text: parsed.text,
      options: Array.isArray(parsed.options) ? parsed.options : [],
      correctOptionId: parsed.correctOptionId ?? null,
      expectedAnswer: '',
      explanation: parsed.solution ?? '',
    };
  }
  return {
    ...base,
    text: parsed.text,
    options: null,
    correctOptionId: null,
    expectedAnswer: Array.isArray(parsed.answers) ? parsed.answers[0] || '' : '',
    explanation: parsed.solution ?? '',
  };
}

function instructionHint(typeId) {
  switch (typeId) {
    case 'mcq':
      return 'Provide exactly four options, only one correct, plus a short explanation.';
    case 'short':
      return 'Expect a concise answer of one to three sentences.';
    case 'scenario':
      return 'Frame this as a scenario-based question set in a realistic context; expect a reasoned response.';
    default:
      return '';
  }
}

async function fetchTypeQuestion(typeConfig, config, index) {
  const endpoint = ENDPOINTS[typeConfig.id];
  const explicitHint = instructionHint(typeConfig.id);
  const extraInstructions = [explicitHint, config.extraInstructions].filter(Boolean).join(' ');
  const payload = buildGenerationPayload({
    numQuestions: 1,
    topic: config.topic,
    gradeLevel: config.gradeLevel,
    difficulty: config.difficulty,
    subject: config.subject,
    text: config.sourceText || null,
    extraInstructions,
    images: config.images ?? [],
    pdf: config.pdf ?? null,
  });
  const parserType = typeConfig.id === 'mcq' ? QUESTION_TYPES.MCQ : QUESTION_TYPES.NORMAL;
  const data = await generateQuestions(endpoint, payload);
  const parsed = parseGeneratedQuestions(parserType, data).find((q) => q.text && q.text.trim());
  if (!parsed) throw new Error('The API returned no usable question for this request.');
  return toQuestionShape(typeConfig, parsed, index, 'api');
}

// Generates the full question set for a configured exam plan.
export async function generateExam(config, { onStatus } = {}) {
  const planned = QUESTION_TYPE_CONFIG.map((type) => ({
    ...type,
    count: Number(config.typeCounts?.[type.id]) || 0,
  })).filter((type) => type.count > 0);

  const questions = [];
  let index = 0;
  for (const type of planned) {
    for (let i = 0; i < type.count; i += 1) {
      index += 1;
      if (onStatus) onStatus(`Generating ${type.label} question ${i + 1} of ${type.count}…`);
      const question = await fetchTypeQuestion(type, config, index);
      questions.push(question);
    }
  }

  const assigned = assignBloomLevels(questions, config.blueprint);
  return {
    questions: assigned,
    usedFallback: false,
  };
}

// Regenerates a single reviewed question, preserving its id, marks and Bloom
// level so the surrounding exam references stay stable.
export async function regenerateOne(exam, questionIndex) {
  const target = exam.questions[questionIndex];
  const typeConfig = QUESTION_TYPE_CONFIG.find((type) => type.id === target.type);
  if (!typeConfig) return null;
  const config = exam.config ?? {};
  const seed = Number(String(target.id).replace(/\D/g, '')) || questionIndex + 1;
  const fresh = await fetchTypeQuestion(typeConfig, config, seed);
  return { ...fresh, id: target.id, bloomLevel: target.bloomLevel, marks: target.marks };
}