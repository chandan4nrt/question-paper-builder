import { api } from '../../../services/api';

const BASE = '/exams';

export async function fetchExams() {
  const { data } = await api.get(BASE);
  return data;
}

export async function fetchExam(id) {
  const { data } = await api.get(`${BASE}/${id}`);
  return data;
}

export async function createExam(payload) {
  const { data } = await api.post(BASE, payload);
  return data;
}

export async function fetchBlueprint(examId) {
  try {
    const { data } = await api.get(`${BASE}/${examId}/blueprint`);
    return data;
  } catch {
    return null;
  }
}

export async function saveBlueprint(examId, items) {
  const { data } = await api.put(`${BASE}/${examId}/blueprint`, { items });
  return data;
}

export async function fetchExamQuestions(examId) {
  const { data } = await api.get(`${BASE}/${examId}/questions`);
  return data;
}

export async function addExamQuestion(
  examId,
  questionId,
  confirmReuse = false,
  marks,
  sectionName
) {
  const { data } = await api.post(`${BASE}/${examId}/questions`, {
    questionId,
    confirmReuse,
    marks,
    sectionName,
  });
  return data;
}

export async function removeExamQuestion(examId, questionId) {
  await api.delete(`${BASE}/${examId}/questions/${questionId}`);
}

export async function generateQuestions(examId, payload) {
  const { data } = await api.post(`${BASE}/${examId}/generate-questions`, payload);
  return data;
}

export async function finalizeExam(examId) {
  const { data } = await api.post(`${BASE}/${examId}/finalize`);
  return data;
}

export async function archiveExam(examId) {
  const { data } = await api.post(`${BASE}/${examId}/archive`);
  return data;
}

export async function fetchPreview(examId) {
  const { data } = await api.get(`${BASE}/${examId}/preview`);
  return data;
}

export async function fetchAnswerKey(examId) {
  const { data } = await api.get(`${BASE}/${examId}/answer-key`);
  return data;
}

export function previewPdfUrl(examId) {
  return `${api.defaults.baseURL}${BASE}/${examId}/preview/pdf`;
}

export function answerKeyPdfUrl(examId) {
  return `${api.defaults.baseURL}${BASE}/${examId}/answer-key/pdf`;
}