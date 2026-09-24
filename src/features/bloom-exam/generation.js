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
  });
  const parserType = typeConfig.id === 'mcq' ? QUESTION_TYPES.MCQ : QUESTION_TYPES.NORMAL;
  const data = await generateQuestions(endpoint, payload);
  const parsed = parseGeneratedQuestions(parserType, data).find((q) => q.text && q.text.trim());
  if (!parsed) throw new Error('The API returned no usable question for this request.');
  return toQuestionShape(typeConfig, parsed, index, 'api');
}

/* ---------- Deterministic sample fallback (keeps the demo working when the
             generation service is unreachable) ---------- */

const MCQ_OPTIONS = [
  'It captures the key idea of the topic accurately.',
  'It is completely unrelated to the topic.',
  'It contradicts the generally accepted meaning.',
  'It only applies to a single special case.',
];

const MCQ_TEMPLATES = [
  (topic) => `Which of the following statements best describes ${topic}?`,
  (topic) => `Which option is the most accurate example of ${topic}?`,
  (topic) => `What assumption would someone make if they misunderstood ${topic}?`,
];

const SHORT_TEMPLATES = [
  (topic) => `Explain in one or two sentences what ${topic} refers to.`,
  (topic) => `Identify the most important idea within ${topic} and briefly justify your choice.`,
  (topic) => `State the difference between two closely related concepts in ${topic} and give one example.`,
];

const SCENARIO_TEMPLATES = [
  (topic) =>
    `Scenario: A class project requires a small team to apply ${topic} to a real situation at school. Outline the key steps the team should take, justify why each step matters, and describe a simple check they can use to verify their outcome.`,
  (topic) =>
    `Scenario: A student keeps confusing parts of ${topic} when revising. Construct a short plan the student can follow, explain what could go wrong without each step, and describe how the plan could improve their results.`,
];

function sampleQuestion(typeConfig, config, index) {
  const topic = config.topic?.trim() || 'the given topic';
  const base = { id: `q${index}`, type: typeConfig.id, marks: typeConfig.marks, source: 'sample' };
  if (typeConfig.id === 'mcq') {
    const text = MCQ_TEMPLATES[index % MCQ_TEMPLATES.length](topic);
    const options = MCQ_OPTIONS.map((label, oi) => ({
      id: `o${oi + 1}`,
      label: label.replace('the topic', topic).replace('The topic', topic),
    }));
    return {
      ...base,
      text,
      options,
      correctOptionId: 'o1',
      expectedAnswer: '',
      explanation: `The correct answer is accurate because it reflects the essential meaning of "${topic}".`,
    };
  }
  if (typeConfig.id === 'short') {
    return {
      ...base,
      text: SHORT_TEMPLATES[index % SHORT_TEMPLATES.length](topic),
      options: null,
      correctOptionId: null,
      expectedAnswer: `A focused answer about ${topic} that names its key idea, supports it with a reason, and stays on point.`,
      explanation: 'Look for the key idea of the topic, a supporting reason, and an example where relevant.',
    };
  }
  return {
    ...base,
    text: SCENARIO_TEMPLATES[index % SCENARIO_TEMPLATES.length](topic),
    options: null,
    correctOptionId: null,
    expectedAnswer: `A clear sequence of steps for ${topic}, each justified, followed by a concrete way to verify the result.`,
    explanation: 'Assess the sequence of steps, the quality of the justification, and whether the verification check is concrete.',
  };
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
      let question;
      try {
        question = await fetchTypeQuestion(type, config, index);
      } catch {
        question = sampleQuestion(type, config, index);
      }
      questions.push(question);
    }
  }

  const assigned = assignBloomLevels(questions, config.blueprint);
  return {
    questions: assigned,
    usedFallback: assigned.some((q) => q.source === 'sample'),
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
  try {
    const fresh = await fetchTypeQuestion(typeConfig, config, seed);
    return { ...fresh, id: target.id, bloomLevel: target.bloomLevel, marks: target.marks };
  } catch {
    const fresh = sampleQuestion(typeConfig, config, seed);
    return { ...fresh, id: target.id, bloomLevel: target.bloomLevel, marks: target.marks };
  }
}