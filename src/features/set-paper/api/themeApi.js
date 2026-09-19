import { api } from '../../../services/api';
import { QUESTION_TYPES } from '../types';

const BASE = '/question-papers/theme';

const FRONTEND_TO_BACKEND = {
  [QUESTION_TYPES.NORMAL]: 'normal',
  [QUESTION_TYPES.MATCH]: 'match',
  [QUESTION_TYPES.WRITING]: 'writing',
  [QUESTION_TYPES.MCQ]: 'mcq',
  [QUESTION_TYPES.IMAGE_MCQ]: 'image-mcq',
  [QUESTION_TYPES.FILL_BLANK]: 'fill',
  [QUESTION_TYPES.LABEL]: 'label',
  [QUESTION_TYPES.TRUE_FALSE]: 'true-false',
};

const TYPE_ALIASES = {
  normal: QUESTION_TYPES.NORMAL,
  short: QUESTION_TYPES.NORMAL,
  'short-answer': QUESTION_TYPES.NORMAL,
  qa: QUESTION_TYPES.NORMAL,
  'question-answer': QUESTION_TYPES.NORMAL,
  match: QUESTION_TYPES.MATCH,
  matching: QUESTION_TYPES.MATCH,
  'match-the-following': QUESTION_TYPES.MATCH,
  writing: QUESTION_TYPES.WRITING,
  'writing-practice': QUESTION_TYPES.WRITING,
  write: QUESTION_TYPES.WRITING,
  mcq: QUESTION_TYPES.MCQ,
  'multiple-choice': QUESTION_TYPES.MCQ,
  'image-mcq': QUESTION_TYPES.IMAGE_MCQ,
  'picture-mcq': QUESTION_TYPES.IMAGE_MCQ,
  circle: QUESTION_TYPES.IMAGE_MCQ,
  'circle-it': QUESTION_TYPES.IMAGE_MCQ,
  fill: QUESTION_TYPES.FILL_BLANK,
  blank: QUESTION_TYPES.FILL_BLANK,
  fillblank: QUESTION_TYPES.FILL_BLANK,
  'fill-in-the-blank': QUESTION_TYPES.FILL_BLANK,
  label: QUESTION_TYPES.LABEL,
  'label-picture': QUESTION_TYPES.LABEL,
  tf: QUESTION_TYPES.TRUE_FALSE,
  truefalse: QUESTION_TYPES.TRUE_FALSE,
  'true-false': QUESTION_TYPES.TRUE_FALSE,
};

function normalizeType(rawType) {
  const key = String(rawType ?? '').toLowerCase().replace(/\s+/g, '').replace(/_/g, '-');
  const alias = TYPE_ALIASES[key] ?? TYPE_ALIASES[String(rawType ?? '').toLowerCase()];
  return alias ?? QUESTION_TYPES.NORMAL;
}

export function backendQuestionType(type) {
  return FRONTEND_TO_BACKEND[type] ?? 'normal';
}

export function serializeTheme(theme) {
  const isNewTheme =
    !(Number.isInteger(theme.themeId) && theme.themeId > 0) &&
    !(Number.isInteger(Number(theme.id)) && Number(theme.id) > 0);
  const themeId = isNewTheme ? null : Number(theme.themeId ?? theme.id);
  const questionId = (id, index) => (isNewTheme ? null : Number.isInteger(id) && id > 0 ? id : index + 1);
  const existing = Array.isArray(theme.themeTypes) ? theme.themeTypes : [];
  return {
    themeId,
    themeName: theme.name ?? '',
    themeDescription: theme.description ?? '',
    themeTypes: (theme.questions ?? []).map((q, index) => {
      const found = existing.find((e) => backendQuestionType(e.quesType) === q.type);
      return {
        id: questionId(found?.id, index),
        quesType: backendQuestionType(q.type),
        totalQuesInType: Number(q.count) || 0,
        totalMarksInType: Number(q.marks) || 0,
        active: found?.active ?? true,
      };
    }),
    active: true,
    createdAt: theme.createdAt ?? null,
    updatedAt: theme.updatedAt ?? null,
  };
}

export function deserializeTheme(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const themeTypes = Array.isArray(raw.themeTypes) ? raw.themeTypes : [];
  const questions = themeTypes
    .filter((t) => Number(t.totalQuesInType) > 0)
    .map((t) => ({
      type: normalizeType(t.quesType),
      count: Number(t.totalQuesInType) || 0,
      marks: Number(t.totalMarksInType) || 0,
    }));
  return {
    id: raw.themeId ?? raw.id,
    themeId: raw.themeId,
    name: raw.themeName ?? raw.name ?? 'Untitled Theme',
    description: raw.themeDescription ?? raw.description ?? '',
    questions,
    createdAt: raw.createdAt ?? null,
    updatedAt: raw.updatedAt ?? null,
  };
}

export async function saveTheme(theme) {
  const { data } = await api.post(BASE, serializeTheme(theme));
  return data;
}

export async function listThemes() {
  const { data } = await api.get(BASE);
  if (Array.isArray(data)) return data.map(deserializeTheme).filter(Boolean);
  if (data && Array.isArray(data.data)) return data.data.map(deserializeTheme).filter(Boolean);
  return [];
}

export async function deleteTheme(themeId) {
  await api.delete(`${BASE}/${themeId}`);
}