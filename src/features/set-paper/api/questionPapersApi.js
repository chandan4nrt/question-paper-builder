import { api } from '../../../services/api';

const BASE = '/question-papers';

export async function setPaper(formData) {
  const { data } = await api.post(BASE, formData);
  return data;
}

export async function listPapers() {
  const { data } = await api.get(BASE);
  return data;
}

export async function listPapersPagewise({ page = 0, size = 10 } = {}) {
  const { data } = await api.get(`${BASE}/pagewise`, {
    params: { page, size },
  });
  return data;
}

export async function listQuestionBank({
  page = 0,
  size = 10,
  subject,
  classLevel,
  questionType,
  search,
} = {}) {
  const params = { page, size };
  if (subject) params.subject = subject;
  if (classLevel) params.classLevel = classLevel;
  if (questionType) params.questionType = questionType;
  if (search) params.search = search;

  const { data } = await api.get(`${BASE}/question-bank`, { params });
  return data;
}

export async function getPaper(paperId) {
  const { data } = await api.get(`${BASE}/${paperId}`);
  return data;
}

export async function updatePaper(paperId, formData) {
  const { data } = await api.put(`${BASE}/${paperId}`, formData);
  return data;
}

export async function deletePaper(paperId) {
  await api.delete(`${BASE}/${paperId}`);
}