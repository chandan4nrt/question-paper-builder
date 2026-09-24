import { createBrowserRouter, Navigate } from 'react-router-dom';
import { StaffLayout } from '../layouts/StaffLayout';
import { LoginPage } from '../features/question-bank/pages/LoginPage';
import { QuestionListPage } from '../features/question-bank/pages/QuestionListPage';
import { QuestionFormPage } from '../features/question-bank/pages/QuestionFormPage';
import { QuestionDetailPage } from '../features/question-bank/pages/QuestionDetailPage';
import { QuestionReviewsPage } from '../features/question-bank/pages/QuestionReviewsPage';
import { SetPaperPage } from '../features/set-paper/pages/SetPaperPage';
import { PaperListPage } from '../features/set-paper/pages/PaperListPage';
import { GeneratorPage } from '../features/bloom-exam/pages/GeneratorPage';
import { ReviewPage } from '../features/bloom-exam/pages/ReviewPage';
import { ExamListPage } from '../features/bloom-exam/pages/ExamListPage';
import { AnalyticsPage } from '../features/bloom-exam/pages/AnalyticsPage';
import { StudentTestPage } from '../features/bloom-exam/pages/StudentTestPage';

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/test/:examId', element: <StudentTestPage /> },
  {
    path: '/staff',
    element: <StaffLayout />,
    children: [
      { index: true, element: <Navigate to="paper-builder" replace /> },
      { path: 'question-bank', element: <QuestionListPage /> },
      { path: 'question-bank/new', element: <QuestionFormPage mode="create" /> },
      { path: 'question-bank/:id', element: <QuestionDetailPage /> },
      { path: 'question-bank/:id/edit', element: <QuestionFormPage mode="edit" /> },
      { path: 'question-bank/:id/reviews', element: <QuestionReviewsPage /> },

      // Create playschool-style practice papers with the paper-builder editor.
      { path: 'paper-builder', element: <PaperListPage /> },
      { path: 'paper-builder/new', element: <SetPaperPage /> },
      { path: 'paper-builder/:id', element: <SetPaperPage /> },

      // Bloom's-aligned AI exam generator: configure -> blueprint -> review -> publish.
      { path: 'bloom-generator', element: <GeneratorPage /> },
      { path: 'bloom-generator/review/:examId', element: <ReviewPage /> },
      { path: 'bloom-generator/exams', element: <ExamListPage /> },
      { path: 'bloom-generator/analytics/:examId', element: <AnalyticsPage /> },
    ],
  },
  { path: '*', element: <Navigate to="/staff/paper-builder" replace /> },
]);