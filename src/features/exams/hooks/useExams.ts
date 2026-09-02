import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '../api/examsApi';
import type { CreateExamPayload, ExamBlueprintItem, GenerateQuestionsPayload } from '../types/exam';

const keys = {
  list: ['exams'] as const,
  detail: (id: number) => ['exams', 'detail', id] as const,
  blueprint: (id: number) => ['exams', 'blueprint', id] as const,
  questions: (id: number) => ['exams', 'questions', id] as const,
  preview: (id: number) => ['exams', 'preview', id] as const,
  answerKey: (id: number) => ['exams', 'answer-key', id] as const,
};

export function useExamList() {
  return useQuery({ queryKey: keys.list, queryFn: api.fetchExams });
}

export function useExam(id: number) {
  return useQuery({ queryKey: keys.detail(id), queryFn: () => api.fetchExam(id), enabled: !!id });
}

export function useExamBlueprint(id: number) {
  return useQuery({ queryKey: keys.blueprint(id), queryFn: () => api.fetchBlueprint(id), enabled: !!id });
}

export function useExamQuestions(id: number) {
  return useQuery({ queryKey: keys.questions(id), queryFn: () => api.fetchExamQuestions(id), enabled: !!id });
}

export function useExamPreview(id: number) {
  return useQuery({ queryKey: keys.preview(id), queryFn: () => api.fetchPreview(id), enabled: !!id });
}

export function useAnswerKey(id: number) {
  return useQuery({ queryKey: keys.answerKey(id), queryFn: () => api.fetchAnswerKey(id), enabled: !!id });
}

export function useCreateExam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateExamPayload) => api.createExam(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.list }),
  });
}

export function useSaveBlueprint(examId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (items: ExamBlueprintItem[]) => api.saveBlueprint(examId, items),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.blueprint(examId) }),
  });
}

function useInvalidateExam(examId: number) {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: keys.detail(examId) });
    queryClient.invalidateQueries({ queryKey: keys.questions(examId) });
    queryClient.invalidateQueries({ queryKey: keys.list });
  };
}

export function useAddExamQuestion(examId: number) {
  const invalidate = useInvalidateExam(examId);
  return useMutation({
    mutationFn: ({
      questionId,
      confirmReuse,
      marks,
      sectionName,
    }: {
      questionId: number;
      confirmReuse?: boolean;
      marks?: number;
      sectionName?: string;
    }) => api.addExamQuestion(examId, questionId, confirmReuse, marks, sectionName),
    onSuccess: () => invalidate(),
  });
}

export function useRemoveExamQuestion(examId: number) {
  const invalidate = useInvalidateExam(examId);
  return useMutation({
    mutationFn: (questionId: number) => api.removeExamQuestion(examId, questionId),
    onSuccess: () => invalidate(),
  });
}

export function useGenerateQuestions(examId: number) {
  const invalidate = useInvalidateExam(examId);
  return useMutation({
    mutationFn: (payload: GenerateQuestionsPayload) => api.generateQuestions(examId, payload),
    onSuccess: () => invalidate(),
  });
}

export function useFinalizeExam(examId: number) {
  const invalidate = useInvalidateExam(examId);
  return useMutation({
    mutationFn: () => api.finalizeExam(examId),
    onSuccess: () => invalidate(),
  });
}

export function useArchiveExam(examId: number) {
  const invalidate = useInvalidateExam(examId);
  return useMutation({
    mutationFn: () => api.archiveExam(examId),
    onSuccess: () => invalidate(),
  });
}
