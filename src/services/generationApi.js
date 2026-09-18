import axios from 'axios';

// Separate LLM/generation service so generation calls are independent of the
// main backend API (src/services/api.js). Point VITE_GENERATION_API_BASE_URL
// at the generation/LLM service; it falls back to VITE_API_BASE_URL so the
// endpoints resolve to {base}/api/v1/generate/* out of the box.
const baseURL =
  import.meta.env.VITE_GENERATION_API_BASE_URL ??
  import.meta.env.VITE_API_BASE_URL ??
  'http://localhost:8080';

export const generationApi = axios.create({ baseURL });

export function generateQuestions(endpoint, payload) {
  return generationApi.post(endpoint, payload).then((response) => response.data);
}

export function extractGenerationError(error) {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message ?? error.message;
  }
  return 'Something went wrong while generating questions.';
}