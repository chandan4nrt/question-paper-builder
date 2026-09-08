import { createBrowserRouter, Navigate } from 'react-router-dom';
import { StaffLayout } from '../layouts/StaffLayout';
import { LoginPage } from '../features/question-bank/pages/LoginPage';
import { QuestionListPage } from '../features/question-bank/pages/QuestionListPage';
import { QuestionFormPage } from '../features/question-bank/pages/QuestionFormPage';
import { QuestionDetailPage } from '../features/question-bank/pages/QuestionDetailPage';
import { QuestionReviewsPage } from '../features/question-bank/pages/QuestionReviewsPage';
import { ExamListPage } from '../features/exams/pages/ExamListPage';
import { ExamFormPage } from '../features/exams/pages/ExamFormPage';
import { ExamDetailPage } from '../features/exams/pages/ExamDetailPage';
import { ExamPreviewPage } from '../features/exams/pages/ExamPreviewPage';
import { ExamAnswerKeyPage } from '../features/exams/pages/ExamAnswerKeyPage';
import { SetPaperPage } from '../features/set-paper/pages/SetPaperPage';

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    path: '/staff',
    element: <StaffLayout />,
    children: [
      { index: true, element: <Navigate to="paper-builder" replace /> },
      // { path: 'question-bank', element: <QuestionListPage /> },
      // { path: 'question-bank/new', element: <QuestionFormPage mode="create" /> },
      // { path: 'question-bank/:id', element: <QuestionDetailPage /> },
      // { path: 'question-bank/:id/edit', element: <QuestionFormPage mode="edit" /> },
      // { path: 'question-bank/:id/reviews', element: <QuestionReviewsPage /> },

      // Phase 2 — Exam & Question Paper Management (spec Section 41 routes).
      // /staff/exams/:id/blueprint and /staff/exams/:id/questions are folded
      // into ExamDetailPage rather than split into separate routes — the
      // blueprint editor and question list are one screen for staff, per
      // the spec's own "keep the UI simple" goal (Section 63).
      // { path: 'exams', element: <ExamListPage /> },
      // { path: 'exams/new', element: <ExamFormPage /> },
      // { path: 'exams/:id', element: <ExamDetailPage /> },
      // { path: 'exams/:id/preview', element: <ExamPreviewPage /> },
      // { path: 'exams/:id/answer-key', element: <ExamAnswerKeyPage /> },

      // Create playschool-style practice papers with the paper-builder editor.
      { path: 'paper-builder', element: <SetPaperPage /> },
    ],
  },
  { path: '*', element: <Navigate to="/staff/paper-builder" replace /> },
]);
