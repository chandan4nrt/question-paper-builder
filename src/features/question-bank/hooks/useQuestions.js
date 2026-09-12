import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '../api/questionsApi';

const keys = {
  all: ['questions'],
  list: (filters) => ['questions', 'list', filters],
  detail: (id) => ['questions', 'detail', id],
  usage: (id) => ['questions', 'usage', id],
  reviews: (id) => ['questions', 'reviews', id],
  subjects: ['subjects'],
  chapters: (subjectId, classId) => ['chapters', subjectId, classId],
  topics: (chapterId) => ['topics', chapterId],
};

export function useQuestionList(filters) {
  return useQuery({ queryKey: keys.list(filters), queryFn: () => api.fetchQuestions(filters) });
}

export function useQuestion(id) {
  return useQuery({ queryKey: keys.detail(id), queryFn: () => api.fetchQuestion(id), enabled: !!id });
}

export function useQuestionUsage(id) {
  return useQuery({ queryKey: keys.usage(id), queryFn: () => api.fetchQuestionUsage(id), enabled: !!id });
}

export function useQuestionReviews(id) {
  return useQuery({ queryKey: keys.reviews(id), queryFn: () => api.fetchQuestionReviews(id), enabled: !!id });
}

export function useSubjects() {
  return useQuery({ queryKey: keys.subjects, queryFn: api.fetchSubjects });
}

export function useChapters(subjectId, classId) {
  return useQuery({
    queryKey: keys.chapters(subjectId, classId),
    queryFn: () => api.fetchChapters(subjectId, classId),
    enabled: !!subjectId && !!classId,
  });
}

export function useTopics(chapterId) {
  return useQuery({
    queryKey: keys.topics(chapterId),
    queryFn: () => api.fetchTopics(chapterId),
    enabled: !!chapterId,
  });
}

function useInvalidateQuestions() {
  const queryClient = useQueryClient();
  return (id) => {
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
    mutationFn: (payload) => api.createQuestion(payload),
    onSuccess: () => invalidate(),
  });
}

export function useUpdateQuestion(id) {
  const invalidate = useInvalidateQuestions();
  return useMutation({
    mutationFn: (payload) => api.updateQuestion(id, payload),
    onSuccess: () => invalidate(id),
  });
}

export function useDeleteQuestion() {
  const invalidate = useInvalidateQuestions();
  return useMutation({
    mutationFn: (id) => api.deleteQuestion(id),
    onSuccess: () => invalidate(),
  });
}

export function useDuplicateQuestion() {
  const invalidate = useInvalidateQuestions();
  return useMutation({
    mutationFn: (id) => api.duplicateQuestion(id),
    onSuccess: () => invalidate(),
  });
}

export function useSubmitForReview(id) {
  const invalidate = useInvalidateQuestions();
  return useMutation({
    mutationFn: () => api.submitForReview(id),
    onSuccess: () => invalidate(id),
  });
}

export function useApproveQuestion(id) {
  const invalidate = useInvalidateQuestions();
  return useMutation({
    mutationFn: (remarks) => api.approveQuestion(id, remarks),
    onSuccess: () => invalidate(id),
  });
}

export function useRejectQuestion(id) {
  const invalidate = useInvalidateQuestions();
  return useMutation({
    mutationFn: (remarks) => api.rejectQuestion(id, remarks),
    onSuccess: () => invalidate(id),
  });
}

export function useArchiveQuestion(id) {
  const invalidate = useInvalidateQuestions();
  return useMutation({
    mutationFn: () => api.archiveQuestion(id),
    onSuccess: () => invalidate(id),
  });
}