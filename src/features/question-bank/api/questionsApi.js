import { api } from '../../../services/api';

const BASE = '/question-bank/questions';

export async function fetchQuestions(filters) {
  const { data } = await api.get(BASE, { params: filters });
  return data;
}

export async function fetchQuestion(id) {
  const { data } = await api.get(`${BASE}/${id}`);
  return data;
}

export async function createQuestion(payload) {
  const { data } = await api.post(BASE, payload);
  return data;
}

export async function updateQuestion(id, payload) {
  const { data } = await api.put(`${BASE}/${id}`, payload);
  return data;
}

export async function deleteQuestion(id) {
  await api.delete(`${BASE}/${id}`);
}

export async function duplicateQuestion(id) {
  const { data } = await api.post(`${BASE}/${id}/duplicate`);
  return data;
}

export async function fetchQuestionUsage(id) {
  const { data } = await api.get(`${BASE}/${id}/usage`);
  return data;
}

export async function fetchQuestionReviews(id) {
  const { data } = await api.get(`${BASE}/${id}/reviews`);
  return data;
}

export async function submitForReview(id) {
  const { data } = await api.post(`${BASE}/${id}/submit-review`);
  return data;
}

export async function approveQuestion(id, remarks) {
  const { data } = await api.post(`${BASE}/${id}/approve`, { remarks });
  return data;
}

export async function rejectQuestion(id, remarks) {
  const { data } = await api.post(`${BASE}/${id}/reject`, { remarks });
  return data;
}

export async function archiveQuestion(id) {
  const { data } = await api.post(`${BASE}/${id}/archive`);
  return data;
}

export async function fetchSubjects() {
  const { data } = await api.get('/question-bank/subjects');
  return data;
}

export async function fetchChapters(subjectId, classId) {
  const { data } = await api.get('/question-bank/chapters', { params: { subjectId, classId } });
  return data;
}

export async function fetchTopics(chapterId) {
  const { data } = await api.get('/question-bank/topics', { params: { chapterId } });
  return data;
}