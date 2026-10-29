import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '../api/questionPapersApi';

export function useSetPaper() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData) => api.setPaper(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['question-papers'] });
      queryClient.invalidateQueries({ queryKey: ['question-papers-pagewise'] });
    },
  });
}

export function useListPapers() {
  return useQuery({
    queryKey: ['question-papers'],
    queryFn: () => api.listPapers(),
    select: (papers) =>
      [...(papers ?? [])].sort(
        (a, b) =>
          new Date(b.updatedAt ?? b.createdAt ?? 0) -
          new Date(a.updatedAt ?? a.createdAt ?? 0),
      ),
  });
}

export function useListPapersPagewise({ page = 0, size = 10 } = {}) {
  return useQuery({
    queryKey: ['question-papers-pagewise', page, size],
    queryFn: () => api.listPapersPagewise({ page, size }),
    placeholderData: (previousData) => previousData,
  });
}

export function useQuestionBank({
  page = 0,
  size = 10,
  subject,
  classLevel,
  questionType,
  search,
} = {}) {
  return useQuery({
    queryKey: ['question-bank', page, size, subject, classLevel, questionType, search],
    queryFn: () =>
      api.listQuestionBank({
        page,
        size,
        subject,
        classLevel,
        questionType,
        search,
      }),
    placeholderData: (previousData) => previousData,
  });
}

export function useGetPaper(paperId) {
  return useQuery({
    queryKey: ['question-paper', paperId],
    queryFn: async () => {
      try {
        return await api.getPaper(paperId);
      } catch (err) {
        return null;
      }
    },
    enabled: Boolean(paperId && paperId !== 'new'),
    retry: false,
  });
}

export function useUpdatePaper() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ paperId, formData }) => api.updatePaper(paperId, formData),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['question-papers'] });
      queryClient.invalidateQueries({ queryKey: ['question-papers-pagewise'] });
      if (variables?.paperId) {
        queryClient.invalidateQueries({ queryKey: ['question-paper', variables.paperId] });
      }
    },
  });
}

export function useDeletePaper() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (paperId) => api.deletePaper(paperId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['question-papers'] });
      queryClient.invalidateQueries({ queryKey: ['question-papers-pagewise'] });
    },
  });
}