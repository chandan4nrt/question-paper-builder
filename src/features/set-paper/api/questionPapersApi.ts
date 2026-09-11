import { api } from '../../../services/api';
import type { SetPaperResponse, PaperBackendResponse } from '../types';

const BASE = '/question-papers';

export async function setPaper(formData: FormData): Promise<SetPaperResponse> {
  const { data } = await api.post<SetPaperResponse>(BASE, formData);
  return data;
}

export async function getPaper(id: number): Promise<PaperBackendResponse> {
  const { data } = await api.get<PaperBackendResponse>(`${BASE}/${id}`);
  return data;
}
