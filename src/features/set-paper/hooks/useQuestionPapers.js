import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '../api/questionPapersApi';

export function useSetPaper() {
  return useMutation({
    mutationFn: (formData) => api.setPaper(formData),
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

export function useUpdatePaper() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ paperId, formData }) => api.updatePaper(paperId, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['question-papers'] });
    },
  });
}

export function useDeletePaper() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (paperId) => api.deletePaper(paperId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['question-papers'] });
    },
  });
}