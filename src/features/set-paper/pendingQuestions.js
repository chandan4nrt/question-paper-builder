const KEY = 'pending-paper-questions';

export function setPendingQuestions(questions) {
  sessionStorage.setItem(KEY, JSON.stringify({ questions }));
}

export function consumePendingQuestions() {
  const raw = sessionStorage.getItem(KEY);
  sessionStorage.removeItem(KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed.questions) ? parsed.questions : [];
  } catch {
    return [];
  }
}