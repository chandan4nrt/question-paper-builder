import { api, publicApi, getToken } from '../../../services/api';

const BASE = '/question-papers';

export async function setPaper(formData) {
  const { data } = await api.post(BASE, formData);
  return data;
}

export async function listPapers() {
  const { data } = await api.get(BASE);
  return data;
}

export async function listPapersSmart() {
  const token = getToken();
  const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  const { data } = await publicApi.get(BASE, config);
  return data;
}

export async function updatePaper(paperId, formData) {
  const { data } = await api.put(BASE, formData);
  return data;
}

export async function deletePaper(paperId) {
  await api.delete(`${BASE}/${paperId}`);
}