// localStorage persistence for generated exams and student submissions.
// There is no backend contract for exams/results yet, so the full workflow
// (generate -> review -> publish -> take -> analyse) is demoable in-browser.
// Swap these for real API calls once endpoints exist.

const EXAMS_KEY = 'bloom_exams';
const SUBMISSIONS_KEY = 'bloom_submissions';
const STUDENT_KEY = 'bloom_student';

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage full / private mode – silently degrade
  }
}

export function listExams() {
  return read(EXAMS_KEY, []);
}

export function getExam(examId) {
  return listExams().find((exam) => exam.examId === examId) ?? null;
}

export function saveExam(exam) {
  const exams = listExams().filter((item) => item.examId !== exam.examId);
  exams.push(exam);
  write(EXAMS_KEY, exams);
  return exam;
}

export function deleteExam(examId) {
  write(
    EXAMS_KEY,
    listExams().filter((item) => item.examId !== examId),
  );
  write(
    SUBMISSIONS_KEY,
    listSubmissions().filter((item) => item.examId !== examId),
  );
  return examId;
}

export function makeExamId() {
  return `be_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export function listSubmissions() {
  return read(SUBMISSIONS_KEY, []);
}

export function getSubmission(submissionId) {
  return listSubmissions().find((item) => item.submissionId === submissionId) ?? null;
}

export function listSubmissionsForExam(examId) {
  return listSubmissions()
    .filter((item) => item.examId === examId)
    .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
}

export function saveSubmission(submission) {
  const all = listSubmissions().filter((item) => item.submissionId !== submission.submissionId);
  all.push(submission);
  write(SUBMISSIONS_KEY, all);
  return submission;
}

export function getStudentName() {
  return read(STUDENT_KEY, '');
}

export function setStudentName(name) {
  localStorage.setItem(STUDENT_KEY, name);
}