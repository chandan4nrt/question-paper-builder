import type { SavedPaper, PaperBackendResponse } from '../types';

const SAVED_PAPERS_KEY = 'playschool-saved-papers';

export function getSavedPapers(): SavedPaper[] {
  try {
    const raw = localStorage.getItem(SAVED_PAPERS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SavedPaper[];
  } catch {
    return [];
  }
}

export function savePaperToList(res: PaperBackendResponse) {
  const papers = getSavedPapers();
  const existing = papers.findIndex((p) => p.backendId === res.id);
  const entry: SavedPaper = {
    backendId: res.id,
    paperId: res.paperId,
    subject: res.subject,
    classLevel: res.classLevel,
    examTerm: res.examTerm,
    academicYear: res.academicYear,
    totalMarks: res.totalMarks,
    durationInMin: res.durationInMin,
    savedAt: res.createdAt ?? new Date().toISOString(),
  };
  if (existing >= 0) {
    papers[existing] = entry;
  } else {
    papers.unshift(entry);
  }
  localStorage.setItem(SAVED_PAPERS_KEY, JSON.stringify(papers));
}

export function removeSavedPaper(backendId: number) {
  const papers = getSavedPapers().filter((p) => p.backendId !== backendId);
  localStorage.setItem(SAVED_PAPERS_KEY, JSON.stringify(papers));
}
