import { api } from '../../../services/api';
import type {
  PageResponse,
  QuestionFilters,
  QuestionFormValues,
  QuestionResponse,
  QuestionReview,
  QuestionUsage,
} from '../types/question';

const BASE = '/question-bank/questions';

export async function fetchQuestions(filters: QuestionFilters): Promise<PageResponse<QuestionResponse>> {
  const { data } = await api.get<PageResponse<QuestionResponse>>(BASE, { params: filters });
  return data;
}

export async function fetchQuestion(id: number): Promise<QuestionResponse> {
  const { data } = await api.get<QuestionResponse>(`${BASE}/${id}`);
  return data;
}

export async function createQuestion(payload: QuestionFormValues): Promise<QuestionResponse> {
  const { data } = await api.post<QuestionResponse>(BASE, payload);
  return data;
}

export async function updateQuestion(id: number, payload: QuestionFormValues): Promise<QuestionResponse> {
  const { data } = await api.put<QuestionResponse>(`${BASE}/${id}`, payload);
  return data;
}

export async function deleteQuestion(id: number): Promise<void> {
  await api.delete(`${BASE}/${id}`);
}

export async function duplicateQuestion(id: number): Promise<QuestionResponse> {
  const { data } = await api.post<QuestionResponse>(`${BASE}/${id}/duplicate`);
  return data;
}

export async function fetchQuestionUsage(id: number): Promise<QuestionUsage> {
  const { data } = await api.get<QuestionUsage>(`${BASE}/${id}/usage`);
  return data;
}

export async function fetchQuestionReviews(id: number): Promise<QuestionReview[]> {
  const { data } = await api.get<QuestionReview[]>(`${BASE}/${id}/reviews`);
  return data;
}

export async function submitForReview(id: number): Promise<QuestionResponse> {
  const { data } = await api.post<QuestionResponse>(`${BASE}/${id}/submit-review`);
  return data;
}

export async function approveQuestion(id: number, remarks?: string): Promise<QuestionResponse> {
  const { data } = await api.post<QuestionResponse>(`${BASE}/${id}/approve`, { remarks });
  return data;
}

export async function rejectQuestion(id: number, remarks: string): Promise<QuestionResponse> {
  const { data } = await api.post<QuestionResponse>(`${BASE}/${id}/reject`, { remarks });
  return data;
}

export async function archiveQuestion(id: number): Promise<QuestionResponse> {
  const { data } = await api.post<QuestionResponse>(`${BASE}/${id}/archive`);
  return data;
}

export interface SubjectOption {
  id: number;
  name: string;
}
export interface ChapterOption {
  id: number;
  name: string;
  subjectId: number;
  classId: number;
}
export interface TopicOption {
  id: number;
  name: string;
  chapterId: number;
}

export async function fetchSubjects(): Promise<SubjectOption[]> {
  const { data } = await api.get<SubjectOption[]>('/question-bank/subjects');
  return data;
}

export async function fetchChapters(subjectId?: number, classId?: number): Promise<ChapterOption[]> {
  const { data } = await api.get<ChapterOption[]>('/question-bank/chapters', { params: { subjectId, classId } });
  return data;
}

export async function fetchTopics(chapterId?: number): Promise<TopicOption[]> {
  const { data } = await api.get<TopicOption[]>('/question-bank/topics', { params: { chapterId } });
  return data;
}
