import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '../api/questionPapersApi';

export function useSetPaper() {
  return useMutation({
    mutationFn: (formData) => api.setPaper(formData),
  });
}

function parseDateValue(val) {
  if (!val) return 0;
  if (typeof val === 'number') {
    return val < 1e11 ? val * 1000 : val;
  }
  const parsed = new Date(val).getTime();
  return isNaN(parsed) ? 0 : parsed;
}

export function useListPapers() {
  return useQuery({
    queryKey: ['question-papers'],
    queryFn: () => api.listPapers(),
    select: (papers) =>
      [...(papers ?? [])]
        .filter((paper) => paper.active !== false)
        .map((paper) => ({
          ...paper,
          published:
            paper.published === true ||
            paper.paper_status === 'PUBLISHED' ||
            paper.paperStatus === 'PUBLISHED',
          publish_link: paper.publish_link || paper.publishLink || null,
        }))
        .sort(
          (a, b) =>
            parseDateValue(b.updatedAt ?? b.createdAt ?? 0) -
            parseDateValue(a.updatedAt ?? a.createdAt ?? 0),
        ),
  });
}

export function useListPapersSmart() {
  return useQuery({
    queryKey: ['question-papers', 'public'],
    queryFn: () => api.listPapersSmart(),
    select: (papers) =>
      [...(papers ?? [])]
        .filter((paper) => paper.active !== false)
        .map((paper) => ({
          ...paper,
          published:
            paper.published === true ||
            paper.paper_status === 'PUBLISHED' ||
            paper.paperStatus === 'PUBLISHED',
          publish_link: paper.publish_link || paper.publishLink || null,
        }))
        .sort(
          (a, b) =>
            parseDateValue(b.updatedAt ?? b.createdAt ?? 0) -
            parseDateValue(a.updatedAt ?? a.createdAt ?? 0),
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

export function usePublishPaper() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables) => {
      const paperId = typeof variables === 'string' ? variables : variables?.paperId;
      return api.publishPaper(paperId);
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['question-papers'] });
      const linkToken = response?.publishLink;
      const paperId = response?.paperId;
      if (linkToken && paperId) {
        queryClient.setQueryData(['question-papers'], (papers = []) =>
          papers.map((p) =>
            String(p.paperId ?? p.id ?? p.paper_id ?? p.uuid ?? '') === String(paperId)
              ? { ...p, publishLink: linkToken, publish_link: linkToken }
              : p,
          ),
        );
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
    },
  });
}

export function useGetPaperForStudent(paperId) {
  return useQuery({
    queryKey: ['question-paper-student', paperId],
    queryFn: () => api.getPaperForStudent(paperId),
    enabled: Boolean(paperId),
    retry: 1,
  });
}