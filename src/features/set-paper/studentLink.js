import { isPublishLink } from './api/questionPapersApi';

const PUBLISH_TOKEN_STORAGE_PREFIX = 'question-paper-publish-token:';
const STUDENT_APP_URL = (
  import.meta.env.VITE_PAPER_STUDENT_APP_URL || 'http://192.168.10.23:4000'
).replace(/\/+$/, '');

export function getStoredPublishToken(paperId) {
  if (!paperId) return null;
  try {
    const token = localStorage.getItem(
      `${PUBLISH_TOKEN_STORAGE_PREFIX}${paperId}`,
    );
    return isPublishLink(token) ? token : null;
  } catch (error) {
    console.error('Failed to retrieve the saved student link:', error);
    return null;
  }
}

export function storePublishToken(paperId, token) {
  if (!paperId || !isPublishLink(token)) return;
  try {
    localStorage.setItem(
      `${PUBLISH_TOKEN_STORAGE_PREFIX}${paperId}`,
      String(token).trim(),
    );
  } catch (error) {
    console.error('Failed to save the student link:', error);
  }
}

export function clearStoredPublishToken(paperId) {
  if (!paperId) return;
  try {
    localStorage.removeItem(`${PUBLISH_TOKEN_STORAGE_PREFIX}${paperId}`);
  } catch (error) {
    console.error('Failed to clear the saved student link:', error);
  }
}

export function buildStudentLink(value) {
  if (!isPublishLink(value)) return null;
  const raw = String(value).trim();
  if (/^https?:\/\//.test(raw)) return raw;
  if (raw.startsWith('/')) return `${STUDENT_APP_URL}${raw}`;
  return `${STUDENT_APP_URL}/paper/${raw}`;
}
