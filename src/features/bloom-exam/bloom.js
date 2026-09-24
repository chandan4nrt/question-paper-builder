// Bloom's Taxonomy levels used across the exam generator, review portal and
// analytics dashboards. Order matters (Remember -> Create) and matches the
// classic cognitive-depth progression.
export const BLOOM_LEVELS = [
  { id: 'remember', label: 'Remember', color: '#3b82f6' },
  { id: 'understand', label: 'Understand', color: '#06b6d4' },
  { id: 'apply', label: 'Apply', color: '#22c55e' },
  { id: 'analyze', label: 'Analyze', color: '#f59e0b' },
  { id: 'evaluate', label: 'Evaluate', color: '#ef4444' },
  { id: 'create', label: 'Create', color: '#a855f7' },
];

export const BLOOM_IDS = BLOOM_LEVELS.map((level) => level.id);

export function bloomLabel(id) {
  return BLOOM_LEVELS.find((level) => level.id === id)?.label ?? id;
}

export function bloomColor(id) {
  return BLOOM_LEVELS.find((level) => level.id === id)?.color ?? '#94a3b8';
}

export function emptyBlueprint() {
  return Object.fromEntries(BLOOM_IDS.map((id) => [id, 0]));
}

// Standard distribution offered on first load so the blueprint chart renders
// something meaningful immediately.
export function defaultBlueprint() {
  return { remember: 15, understand: 20, apply: 25, analyze: 20, evaluate: 10, create: 10 };
}

export function blueprintTotal(blueprint) {
  return BLOOM_IDS.reduce((sum, id) => sum + (Number(blueprint?.[id]) || 0), 0);
}

// The question configurator supports MCQ, Short Answer and Scenario.
export const QUESTION_TYPE_CONFIG = [
  { id: 'mcq', label: 'MCQ', marks: 1, hint: 'Multiple choice with one correct option.' },
  { id: 'short', label: 'Short Answer', marks: 2, hint: 'Concise written response (1–3 sentences).' },
  { id: 'scenario', label: 'Scenario', marks: 4, hint: 'Context-based problem using the scenario/source text.' },
];

export const DIFFICULTIES = [
  { id: 'easy', label: 'Easy' },
  { id: 'medium', label: 'Medium' },
  { id: 'hard', label: 'Hard' },
];

export function defaultTypeCounts() {
  return { mcq: 4, short: 3, scenario: 2 };
}

export function defaultTypeMarks() {
  return Object.fromEntries(QUESTION_TYPE_CONFIG.map((type) => [type.id, type.marks]));
}

export function totalQuestions(typeCounts) {
  return QUESTION_TYPE_CONFIG.reduce((sum, type) => sum + (Number(typeCounts[type.id]) || 0), 0);
}

export function totalMarks(typeCounts, typeMarks) {
  return QUESTION_TYPE_CONFIG.reduce(
    (sum, type) => sum + (Number(typeCounts[type.id]) || 0) * (Number(typeMarks[type.id]) || 0),
    0,
  );
}

// Turns a blueprint (percentages) + projected question counts into a row the
// Recharts stacked bar can render. Each segment = questions at that level.
export function blueprintChartData(blueprint, numQuestions) {
  const row = { name: 'Blueprint' };
  BLOOM_IDS.forEach((id) => {
    row[id] = Math.round(((Number(blueprint[id]) || 0) / 100) * numQuestions);
  });
  return [row];
}