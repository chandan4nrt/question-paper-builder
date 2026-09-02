import { api } from '../../../services/api';
import type {
  AnswerKeyResponse,
  CreateExamPayload,
  ExamBlueprintItem,
  ExamBlueprintResponse,
  ExamPreviewResponse,
  ExamQuestionResponse,
  ExamResponse,
  GenerateQuestionsPayload,
  GenerateQuestionsResult,
} from '../types/exam';

const BASE = '/exams';

export async function fetchExams(): Promise<ExamResponse[]> {
  const { data } = await api.get<ExamResponse[]>(BASE);
  return data;
}

export async function fetchExam(id: number): Promise<ExamResponse> {
  const { data } = await api.get<ExamResponse>(`${BASE}/${id}`);
  return data;
}

export async function createExam(payload: CreateExamPayload): Promise<ExamResponse> {
  const { data } = await api.post<ExamResponse>(BASE, payload);
  return data;
}

export async function fetchBlueprint(examId: number): Promise<ExamBlueprintResponse | null> {
  try {
    const { data } = await api.get<ExamBlueprintResponse>(`${BASE}/${examId}/blueprint`);
    return data;
  } catch {
    return null;
  }
}

export async function saveBlueprint(examId: number, items: ExamBlueprintItem[]): Promise<ExamBlueprintResponse> {
  const { data } = await api.put<ExamBlueprintResponse>(`${BASE}/${examId}/blueprint`, { items });
  return data;
}

export async function fetchExamQuestions(examId: number): Promise<ExamQuestionResponse[]> {
  const { data } = await api.get<ExamQuestionResponse[]>(`${BASE}/${examId}/questions`);
  return data;
}

export async function addExamQuestion(
  examId: number,
  questionId: number,
  confirmReuse = false,
  marks?: number,
  sectionName?: string
): Promise<ExamQuestionResponse> {
  const { data } = await api.post<ExamQuestionResponse>(`${BASE}/${examId}/questions`, {
    questionId,
    confirmReuse,
    marks,
    sectionName,
  });
  return data;
}

export async function removeExamQuestion(examId: number, questionId: number): Promise<void> {
  await api.delete(`${BASE}/${examId}/questions/${questionId}`);
}

export async function generateQuestions(examId: number, payload: GenerateQuestionsPayload): Promise<GenerateQuestionsResult> {
  const { data } = await api.post<GenerateQuestionsResult>(`${BASE}/${examId}/generate-questions`, payload);
  return data;
}

export async function finalizeExam(examId: number): Promise<ExamResponse> {
  const { data } = await api.post<ExamResponse>(`${BASE}/${examId}/finalize`);
  return data;
}

export async function archiveExam(examId: number): Promise<ExamResponse> {
  const { data } = await api.post<ExamResponse>(`${BASE}/${examId}/archive`);
  return data;
}

export async function fetchPreview(examId: number): Promise<ExamPreviewResponse> {
  const { data } = await api.get<ExamPreviewResponse>(`${BASE}/${examId}/preview`);
  return data;
}

export async function fetchAnswerKey(examId: number): Promise<AnswerKeyResponse> {
  const { data } = await api.get<AnswerKeyResponse>(`${BASE}/${examId}/answer-key`);
  return data;
}

export function previewPdfUrl(examId: number): string {
  return `${api.defaults.baseURL}${BASE}/${examId}/preview/pdf`;
}

export function answerKeyPdfUrl(examId: number): string {
  return `${api.defaults.baseURL}${BASE}/${examId}/answer-key/pdf`;
}
