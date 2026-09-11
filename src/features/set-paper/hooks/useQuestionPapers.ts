import { useMutation, useQuery } from '@tanstack/react-query';
import * as api from '../api/questionPapersApi';

export function useSetPaper() {
  return useMutation({
    mutationFn: (formData: FormData) => api.setPaper(formData),
  });
}

export function useGetPaper(id: number | null) {
  return useQuery({
    queryKey: ['question-paper', id],
    queryFn: () => api.getPaper(id!),
    enabled: id !== null && id > 0,
  });
}
