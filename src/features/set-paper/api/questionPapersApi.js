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
  const url = paperId ? `${BASE}/${paperId}` : BASE;
  const { data } = await api.put(url, formData);
  return data;
}

export async function publishPaper(paperId) {
  const { data } = await api.post(`${BASE}/${paperId}/publish`);
  return data;
}

export async function deletePaper(paperId) {
  await api.delete(`${BASE}/${paperId}`);
}

export async function getPaperForStudent(paperId) {
  if (!paperId) return null;
  const resolved = extractPaperId(paperId);
  const envBase = import.meta.env.VITE_PAPER_STUDENT_API_URL;
  let url = envBase
    ? `${envBase}/${resolved}/paperforstudent`
    : `${BASE}/${resolved}/paperforstudent`;

  url = url.replace(/\/api\/v4\/api\/v4\//g, '/api/v4/');

  const { data } = await publicApi.get(url, {
    headers: { accept: '*/*' },
  });
  return data;
}

const PUBLISH_LINK_SUFFIX_RE =
  /^(.*?)[0-9a-f]{8,11}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function extractPaperId(publishLink) {
  if (!publishLink) return null;
  const raw = String(publishLink).trim();
  const match = raw.match(PUBLISH_LINK_SUFFIX_RE);
  if (match?.[1]) return match[1];
  return raw;
}