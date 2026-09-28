import { publicApi, getToken } from '../../../services/api';

const STORAGE_KEY = 'sp_submissions';

export function buildSubmission(paper, student, answers) {
  const header = paper?.header ?? {};
  const questions = paper?.questions ?? [];
  return {
    submissionId: `sp_sub_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    paperId: paper?.paperId ?? null,
    paperTitle: {
      subject: header.subject ?? '',
      className: header.className ?? '',
      exam: header.exam ?? '',
      academicYear: header.academicYear ?? '',
    },
    studentName: student.name.trim(),
    rollNo: student.rollNo.trim(),
    answers,
    questionCount: questions.length,
    meta: {
      subject: header.subject ?? '',
      classLevel: header.className ?? '',
      examTerm: header.exam ?? '',
      academicYear: header.academicYear ?? '',
      totalMarks: Number(header.totalMarks || 0),
      duration: header.duration ?? '',
    },
    submittedAt: new Date().toISOString(),
  };
}

export function saveSubmission(submission) {
  try {
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    existing.push(submission);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
    return true;
  } catch {
    return false;
  }
}

export function listSubmissions() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
  } catch {
    return [];
  }
}

// Fire-and-forget POST for later AI/LLM evaluation. The frontend does not block
// on it: if the backend endpoint does not exist yet the submission still lives
// in localStorage and can be exported via downloadSubmissionJson.
export function postSubmission(submission, paperId) {
  const target = paperId ?? submission.paperId;
  if (!target) return Promise.resolve(false);
  const token = getToken();
  const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  return publicApi
    .post(`/question-papers/${target}/submissions`, submission, config)
    .then(() => true)
    .catch(() => false);
}

export function downloadSubmissionJson(submission) {
  const blob = new Blob([JSON.stringify(submission, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${submission.studentName?.replace(/\s+/g, '-') || 'student'}-submission.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}