import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '../api/examsApi';

const keys = {
  list: ['exams'],
  detail: (id) => ['exams', 'detail', id],
  blueprint: (id) => ['exams', 'blueprint', id],
  questions: (id) => ['exams', 'questions', id],
  preview: (id) => ['exams', 'preview', id],
  answerKey: (id) => ['exams', 'answer-key', id],
};

export function useExamList() {
  return useQuery({ queryKey: keys.list, queryFn: api.fetchExams });
}

export function useExam(id) {
  return useQuery({ queryKey: keys.detail(id), queryFn: () => api.fetchExam(id), enabled: !!id });
}

export function useExamBlueprint(id) {
  return useQuery({ queryKey: keys.blueprint(id), queryFn: () => api.fetchBlueprint(id), enabled: !!id });
}

export function useExamQuestions(id) {
  return useQuery({ queryKey: keys.questions(id), queryFn: () => api.fetchExamQuestions(id), enabled: !!id });
}

export function useExamPreview(id) {
  return useQuery({ queryKey: keys.preview(id), queryFn: () => api.fetchPreview(id), enabled: !!id });
}

export function useAnswerKey(id) {
  return useQuery({ queryKey: keys.answerKey(id), queryFn: () => api.fetchAnswerKey(id), enabled: !!id });
}

export function useCreateExam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.createExam(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.list }),
  });
}

export function useSaveBlueprint(examId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (items) => api.saveBlueprint(examId, items),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.blueprint(examId) }),
  });
}

function useInvalidateExam(examId) {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: keys.detail(examId) });
    queryClient.invalidateQueries({ queryKey: keys.questions(examId) });
    queryClient.invalidateQueries({ queryKey: keys.list });
  };
}

export function useAddExamQuestion(examId) {
  const invalidate = useInvalidateExam(examId);
  return useMutation({
    mutationFn: ({
      questionId,
      confirmReuse,
      marks,
      sectionName,
    }) => api.addExamQuestion(examId, questionId, confirmReuse, marks, sectionName),
    onSuccess: () => invalidate(),
  });
}

export function useRemoveExamQuestion(examId) {
  const invalidate = useInvalidateExam(examId);
  return useMutation({
    mutationFn: (questionId) => api.removeExamQuestion(examId, questionId),
    onSuccess: () => invalidate(),
  });
}

export function useGenerateQuestions(examId) {
  const invalidate = useInvalidateExam(examId);
  return useMutation({
    mutationFn: (payload) => api.generateQuestions(examId, payload),
    onSuccess: () => invalidate(),
  });
}

export function useFinalizeExam(examId) {
  const invalidate = useInvalidateExam(examId);
  return useMutation({
    mutationFn: () => api.finalizeExam(examId),
    onSuccess: () => invalidate(),
  });
}

export function useArchiveExam(examId) {
  const invalidate = useInvalidateExam(examId);
  return useMutation({
    mutationFn: () => api.archiveExam(examId),
    onSuccess: () => invalidate(),
  });
}