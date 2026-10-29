import { BLOOM_IDS, bloomLabel } from './bloom';

// Simple, deterministic auto-grading for the demo.
//  - MCQ: exact match against the correct option.
//  - Subjective (short / scenario): keyword-overlap between the student
//    answer and the expected answer, scaled proportionally to marks. An empty
//    expected answer disables auto-grading and grants full marks for any
//    non-empty attempt so the dashboard works end-to-end.
function subjectiveEarned(studentAnswer, expectedAnswer, marks) {
  const attempt = String(studentAnswer ?? '').trim();
  const expected = String(expectedAnswer ?? '').trim();
  if (!attempt) return 0;
  if (!expected) return marks;
  const tokens = (text) =>
    (text.toLowerCase().match(/[a-z0-9]+/g) ?? []).filter((word) => word.length > 2);
  const expectedTokens = tokens(expected);
  if (expectedTokens.length === 0) return marks;
  const matched = expectedTokens.filter((word) => attempt.toLowerCase().includes(word)).length;
  const ratio = matched / expectedTokens.length;
  return Math.round(marks * Math.min(1, Math.max(0, ratio)));
}

export function gradeQuestion(question, answer) {
  if (question.type === 'mcq') {
    const correct = Boolean(answer) && answer === question.correctOptionId;
    return { earned: correct ? Number(question.marks) : 0, max: Number(question.marks), correct };
  }
  const earned = subjectiveEarned(answer, question.expectedAnswer, Number(question.marks));
  return { earned, max: Number(question.marks), correct: earned > 0 };
}

export function buildSubmission(exam, studentName, answers) {
  const grades = {};
  const bloomTotals = Object.fromEntries(BLOOM_IDS.map((id) => [id, { earned: 0, max: 0, correct: 0, count: 0 }]));

  let score = 0;
  let totalMarks = 0;
  for (const question of exam.questions) {
    const answer = answers[question.id];
    const result = gradeQuestion(question, answer);
    grades[question.id] = { ...result, bloomLevel: question.bloomLevel ?? 'remember' };
    score += result.earned;
    totalMarks += result.max;
    const bucket = bloomTotals[question.bloomLevel ?? 'remember'];
    bucket.earned += result.earned;
    bucket.max += result.max;
    bucket.count += 1;
    if (result.correct) bucket.correct += 1;
  }

  const percentage = totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0;

  return {
    submissionId: `sub_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    examId: exam.examId,
    examTitle: exam.title,
    studentName,
    answers,
    grades,
    bloomTotals,
    score,
    totalMarks,
    percentage,
    submittedAt: new Date().toISOString(),
  };
}

export function bloomBreakdownRows(total) {
  return BLOOM_IDS.map((id) => ({
    id,
    label: bloomLabel(id),
    earned: total[id]?.earned ?? 0,
    max: total[id]?.max ?? 0,
    count: total[id]?.count ?? 0,
    correct: total[id]?.correct ?? 0,
    percentage: total[id]?.max ? Math.round((total[id].earned / total[id].max) * 100) : null,
  })).filter((row) => row.count > 0 || row.max > 0);
}

export function aggregateExam(submissions) {
  const byLevel = Object.fromEntries(BLOOM_IDS.map((id) => [id, { earned: 0, max: 0, count: 0, students: 0 }]));
  submissions.forEach((submission) => {
    BLOOM_IDS.forEach((id) => {
      const bucket = byLevel[id];
      const level = submission.bloomTotals?.[id];
      if (!level) return;
      if (level.max > 0) bucket.students += 1;
      bucket.earned += level.earned;
      bucket.max += level.max;
      bucket.count += level.count;
    });
  });
  return BLOOM_IDS.map((id) => ({
    id,
    label: bloomLabel(id),
    earned: byLevel[id].earned,
    max: byLevel[id].max,
    count: byLevel[id].count,
    students: byLevel[id].students,
    percentage: byLevel[id].max ? Math.round((byLevel[id].earned / byLevel[id].max) * 100) : null,
  })).filter((row) => row.count > 0 || row.max > 0);
}