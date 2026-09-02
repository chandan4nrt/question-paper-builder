import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '../api/questionsApi';
import type { QuestionFilters, QuestionFormValues } from '../types/question';

const keys = {
  all: ['questions'] as const,
  list: (filters: QuestionFilters) => ['questions', 'list', filters] as const,
  detail: (id: number) => ['questions', 'detail', id] as const,
  usage: (id: number) => ['questions', 'usage', id] as const,
  reviews: (id: number) => ['questions', 'reviews', id] as const,
  subjects: ['subjects'] as const,
  chapters: (subjectId?: number, classId?: number) => ['chapters', subjectId, classId] as const,
  topics: (chapterId?: number) => ['topics', chapterId] as const,
};

export function useQuestionList(filters: QuestionFilters) {
  return useQuery({ queryKey: keys.list(filters), queryFn: () => api.fetchQuestions(filters) });
}

export function useQuestion(id: number) {
  return useQuery({ queryKey: keys.detail(id), queryFn: () => api.fetchQuestion(id), enabled: !!id });
}

export function useQuestionUsage(id: number) {
  return useQuery({ queryKey: keys.usage(id), queryFn: () => api.fetchQuestionUsage(id), enabled: !!id });
}

export function useQuestionReviews(id: number) {
  return useQuery({ queryKey: keys.reviews(id), queryFn: () => api.fetchQuestionReviews(id), enabled: !!id });
}

export function useSubjects() {
  return useQuery({ queryKey: keys.subjects, queryFn: api.fetchSubjects });
}

export function useChapters(subjectId?: number, classId?: number) {
  return useQuery({
    queryKey: keys.chapters(subjectId, classId),
    queryFn: () => api.fetchChapters(subjectId, classId),
    enabled: !!subjectId && !!classId,
  });
}

export function useTopics(chapterId?: number) {
  return useQuery({
    queryKey: keys.topics(chapterId),
    queryFn: () => api.fetchTopics(chapterId),
    enabled: !!chapterId,
  });
}

function useInvalidateQuestions() {
  const queryClient = useQueryClient();
  return (id?: number) => {
    queryClient.invalidateQueries({ queryKey: keys.all });
    if (id) {
      queryClient.invalidateQueries({ queryKey: keys.detail(id) });
      queryClient.invalidateQueries({ queryKey: keys.reviews(id) });
    }
  };
}

export function useCreateQuestion() {
  const invalidate = useInvalidateQuestions();
  return useMutation({
    mutationFn: (payload: QuestionFormValues) => api.createQuestion(payload),
    onSuccess: () => invalidate(),
  });
}

export function useUpdateQuestion(id: number) {
  const invalidate = useInvalidateQuestions();
  return useMutation({
    mutationFn: (payload: QuestionFormValues) => api.updateQuestion(id, payload),
    onSuccess: () => invalidate(id),
  });
}

export function useDeleteQuestion() {
  const invalidate = useInvalidateQuestions();
  return useMutation({
    mutationFn: (id: number) => api.deleteQuestion(id),
    onSuccess: () => invalidate(),
  });
}

export function useDuplicateQuestion() {
  const invalidate = useInvalidateQuestions();
  return useMutation({
    mutationFn: (id: number) => api.duplicateQuestion(id),
    onSuccess: () => invalidate(),
  });
}

export function useSubmitForReview(id: number) {
  const invalidate = useInvalidateQuestions();
  return useMutation({
    mutationFn: () => api.submitForReview(id),
    onSuccess: () => invalidate(id),
  });
}

export function useApproveQuestion(id: number) {
  const invalidate = useInvalidateQuestions();
  return useMutation({
    mutationFn: (remarks?: string) => api.approveQuestion(id, remarks),
    onSuccess: () => invalidate(id),
  });
}

export function useRejectQuestion(id: number) {
  const invalidate = useInvalidateQuestions();
  return useMutation({
    mutationFn: (remarks: string) => api.rejectQuestion(id, remarks),
    onSuccess: () => invalidate(id),
  });
}

export function useArchiveQuestion(id: number) {
  const invalidate = useInvalidateQuestions();
  return useMutation({
    mutationFn: () => api.archiveQuestion(id),
    onSuccess: () => invalidate(id),
  });
}
