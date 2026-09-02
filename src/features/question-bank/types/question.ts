export type QuestionType =
  | 'MCQ'
  | 'MULTIPLE_SELECT'
  | 'TRUE_FALSE'
  | 'FILL_IN_THE_BLANK'
  | 'MATCH_THE_FOLLOWING'
  | 'ONE_WORD'
  | 'SHORT_ANSWER'
  | 'LONG_ANSWER'
  | 'IMAGE_BASED'
  | 'IDENTIFY_AND_NAME'
  | 'ARRANGE_IN_ORDER';

export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

export type QuestionLanguage = 'HINDI' | 'ENGLISH' | 'BILINGUAL';

export type QuestionStatus = 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'ARCHIVED';

export type UsageStatus = 'NEVER_USED' | 'USED_BEFORE' | 'USED_CURRENT_YEAR' | 'USED_PREVIOUS_YEAR';

export interface QuestionUsageEntry {
  examId: number;
  examName: string;
  examType: string;
  academicYearLabel: string;
  examDate: string | null;
}

export interface QuestionUsage {
  status: UsageStatus;
  previousYearHighlight: string | null;
  history: QuestionUsageEntry[];
}

export interface QuestionOption {
  id?: number;
  optionText: string;
  isCorrect: boolean;
  displayOrder: number;
}

export interface QuestionResponse {
  id: number;
  academicYearId: number;
  academicYearLabel: string;
  classId: number;
  className: string;
  subjectId: number;
  subjectName: string;
  chapterId: number;
  chapterName: string;
  topicId: number;
  topicName: string;
  questionType: QuestionType;
  difficulty: Difficulty;
  language: QuestionLanguage;
  questionText: string;
  explanation: string | null;
  expectedAnswer: string | null;
  evaluationGuidance: string | null;
  marks: number;
  status: QuestionStatus;
  createdById: number;
  createdByName: string;
  reviewedById: number | null;
  reviewedByName: string | null;
  createdAt: string;
  updatedAt: string;
  options: QuestionOption[];
  usage: QuestionUsage;
}

export interface QuestionReview {
  id: number;
  reviewerId: number;
  reviewerName: string;
  action: 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'EDITED';
  remarks: string | null;
  createdAt: string;
}

export interface QuestionFormValues {
  academicYearId: number;
  classId: number;
  subjectId: number;
  chapterId: number;
  topicId: number;
  questionType: QuestionType;
  difficulty: Difficulty;
  language: QuestionLanguage;
  questionText: string;
  explanation?: string;
  expectedAnswer?: string;
  evaluationGuidance?: string;
  marks: number;
  options: QuestionOption[];
}

export interface PageResponse<T> {
  items: T[];
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export interface QuestionFilters {
  search?: string;
  academicYearId?: number;
  classId?: number;
  subjectId?: number;
  chapterId?: number;
  topicId?: number;
  questionType?: QuestionType;
  difficulty?: Difficulty;
  language?: QuestionLanguage;
  status?: QuestionStatus;
  page?: number;
  limit?: number;
  sort?: string;
}
