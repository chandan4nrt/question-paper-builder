import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '../api/questionPapersApi';

export function useSetPaper() {
  return useMutation({
    mutationFn: (formData: FormData) => api.setPaper(formData),
  });
}

export function useListPapers() {
  return useQuery({
    queryKey: ['question-papers'],
    queryFn: () => api.listPapers(),
  });
}

export function useDeletePaper() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (paperId: string) => api.deletePaper(paperId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['question-papers'] });
    },
  });
}
