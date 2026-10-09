import { api } from '../../../services/api';
import { QUESTION_TYPES } from '../types';

const BASE = import.meta.env.VITE_THEME_API_URL ?? '/api/v4/question-papers/theme';

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
  if (!theme || typeof theme !== 'object') return {};

  const themeId = theme.themeId ?? theme.id;
  const isExisting = Number.isInteger(Number(themeId)) && Number(themeId) > 0;
  const idNum = isExisting ? Number(themeId) : null;

  const existingTypes = Array.isArray(theme.themeTypes) ? theme.themeTypes : [];

  let themeTypes = [];
  if (Array.isArray(theme.questions) && theme.questions.length > 0) {
    themeTypes = theme.questions.map((q) => {
      const bType = backendQuestionType(q.type);
      const found = existingTypes.find(
        (e) => normalizeType(e.quesType) === q.type || e.quesType === bType
      );

      const item = {
        quesType: bType,
        totalQuesInType: Number(q.count) || 0,
        totalMarksInType: Number(q.marks) || 0,
      };

      if (!isExisting) {
        item.active = true;
      } else {
        if (found?.id) item.id = found.id;
        item.active = found?.active ?? true;
      }

      return item;
    });
  } else if (Array.isArray(theme.themeTypes) && theme.themeTypes.length > 0) {
    themeTypes = theme.themeTypes.map((t) => ({
      quesType: t.quesType,
      totalQuesInType: Number(t.totalQuesInType) || 0,
      totalMarksInType: Number(t.totalMarksInType) || 0,
      ...(t.id ? { id: t.id } : {}),
      active: t.active ?? true,
    }));
  }

  const payload = {
    themeName: theme.name ?? theme.themeName ?? '',
    themeDescription: theme.description ?? theme.themeDescription ?? '',
    themeTypes,
  };

  if (isExisting && idNum) {
    payload.themeId = idNum;
    payload.active = theme.active ?? true;
    if (theme.createdAt) payload.createdAt = theme.createdAt;
    if (theme.updatedAt) payload.updatedAt = theme.updatedAt;
  }

  return payload;
}

export function deserializeTheme(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const rawTheme = raw.data ?? raw;
  const themeTypes = Array.isArray(rawTheme.themeTypes) ? rawTheme.themeTypes : [];
  const questions = themeTypes
    .filter((t) => Number(t.totalQuesInType) > 0)
    .map((t) => ({
      type: normalizeType(t.quesType),
      count: Number(t.totalQuesInType) || 0,
      marks: Number(t.totalMarksInType) || 0,
    }));
  return {
    id: rawTheme.themeId ?? rawTheme.id,
    themeId: rawTheme.themeId ?? rawTheme.id,
    name: rawTheme.themeName ?? rawTheme.name ?? 'Untitled Theme',
    description: rawTheme.themeDescription ?? rawTheme.description ?? '',
    questions,
    themeTypes: rawTheme.themeTypes ?? [],
    active: rawTheme.active ?? true,
    createdAt: rawTheme.createdAt ?? null,
    updatedAt: rawTheme.updatedAt ?? null,
  };
}

export async function createTheme(theme) {
  const payload = serializeTheme(theme);
  const { data } = await api.post(BASE, payload);
  return data;
}

export async function updateTheme(theme) {
  const payload = serializeTheme(theme);
  const themeId = payload.themeId ?? theme?.themeId ?? theme?.id;
  const url = themeId ? `${BASE}?id=${themeId}` : BASE;
  const { data } = await api.put(url, payload);
  return data;
}

export async function saveTheme(theme) {
  const payload = serializeTheme(theme);
  const themeId = payload.themeId ?? theme?.themeId ?? theme?.id;
  const isExisting = Number.isInteger(Number(themeId)) && Number(themeId) > 0;
  if (isExisting) {
    const { data } = await api.put(`${BASE}?id=${themeId}`, payload);
    return data;
  }
  const { data } = await api.post(BASE, payload);
  return data;
}

export async function listThemes() {
  const { data } = await api.get(BASE);
  if (Array.isArray(data)) return data.map(deserializeTheme).filter(Boolean);
  if (data && Array.isArray(data.data)) return data.data.map(deserializeTheme).filter(Boolean);
  return [];
}

export async function deleteTheme(themeId) {
  if (!themeId) return;
  try {
    await api.delete(`${BASE}?id=${themeId}`);
  } catch {
    await api.delete(`${BASE}/${themeId}`);
  }
}