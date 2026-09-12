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

export async function deletePaper(paperId) {
  await api.delete(`${BASE}/${paperId}`);
}