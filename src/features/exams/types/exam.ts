export type ExamType = 'UNIT_TEST' | 'PERIODIC_TEST' | 'CLASS_TEST' | 'HALF_YEARLY' | 'ANNUAL' | 'OTHER';
export type ExamStatus = 'DRAFT' | 'FINALIZED' | 'ARCHIVED';

export interface ExamResponse {
  id: number;
  academicYearId: number;
  academicYearLabel: string;
  classId: number;
  className: string;
  subjectId: number;
  subjectName: string;
  name: string;
  examType: ExamType;
  totalMarks: number | null;
  duration: number | null;
  examDate: string | null;
  status: ExamStatus;
  questionCount: number;
  createdById: number;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExamPayload {
  academicYearId: number;
  classId: number;
  subjectId: number;
  name: string;
  examType: ExamType;
  duration?: number;
  examDate?: string;
}

export interface ExamBlueprintItem {
  id?: number;
  sectionName: string;
  questionType: string;
  numberOfQuestions: number;
  marksPerQuestion: number;
  difficulty?: string | null;
  chapterId?: number | null;
  topicId?: number | null;
  language?: string | null;
  displayOrder: number;
}

export interface ExamBlueprintResponse {
  examId: number;
  items: ExamBlueprintItem[];
  totalBlueprintQuestions: number;
  totalBlueprintMarks: number;
}

export interface ExamQuestionResponse {
  examQuestionId: number;
  questionId: number;
  questionText: string;
  questionType: string;
  difficulty: string;
  marks: number;
  questionOrder: number;
  sectionName: string | null;
  usage: {
    status: 'NEVER_USED' | 'USED_BEFORE' | 'USED_CURRENT_YEAR' | 'USED_PREVIOUS_YEAR';
    previousYearHighlight: string | null;
  };
}

export interface GenerateQuestionsPayload {
  avoidPreviousAcademicYear: boolean;
  avoidPreviousTwoAcademicYears: boolean;
  avoidCurrentAcademicYear: boolean;
}

export interface BlueprintShortfall {
  sectionName: string;
  questionType: string;
  difficulty: string | null;
  requested: number;
  available: number;
}

export interface GenerateQuestionsResult {
  generatedQuestions: ExamQuestionResponse[];
  shortfalls: BlueprintShortfall[];
  complete: boolean;
}

export interface ExamPreviewResponse {
  schoolName: string | null;
  schoolAddress: string | null;
  examName: string;
  academicYearLabel: string;
  className: string;
  subjectName: string;
  durationMinutes: number | null;
  totalMarks: number | null;
  instructions: string[];
  sections: { sectionName: string; questions: { questionNumber: number; questionText: string; marks: number; optionTexts: string[] | null }[] }[];
}

export interface AnswerKeyResponse {
  examId: number;
  examName: string;
  entries: { questionNumber: number; answer: string; evaluationGuidance: string | null }[];
}
