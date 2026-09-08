export type QuestionType = 'normal' | 'match' | 'writing' | 'mcq' | 'image-mcq' | 'fill-blank' | 'label' | 'true-false';

export interface MatchItem {
  id: string;
  label: string;
  image?: string | null;
}

export interface McqOption {
  id: string;
  label: string;
  image?: string | null;
  writingLines?: boolean;
}

export interface LabelMarker {
  id: string;
  x: number;
  y: number;
}

export interface Question {
  id: number;
  number: number;
  type: QuestionType;
  text: string;
  marks: number;
  leftItems?: MatchItem[];
  rightItems?: MatchItem[];
  lines?: number;
  fragments?: number;
  sampleText?: string;
  options?: McqOption[];
  image?: string | null;
  blankCount?: number;
  partCount?: number;
  labelMarkers?: LabelMarker[];
  items?: string[];
}

export interface PaperHeader {
  schoolName: string;
  className: string;
  subject: string;
  exam: string;
  academicYear: string;
  date: string;
  totalMarks: number;
  duration: string;
  teacherName: string;
  instructions: string;
  logo?: string | null;
}

export interface PaperState {
  header: PaperHeader;
  questions: Question[];
  theme: 'colorful' | 'light';
  nextId: number;
}

export interface ThemeQuestionConfig {
  type: QuestionType;
  count: number;
  marks: number;
}

export interface PaperTheme {
  id: string;
  name: string;
  description?: string;
  questions: ThemeQuestionConfig[];
}

export const QUESTION_TYPES: Record<string, QuestionType> = {
  NORMAL: 'normal',
  MATCH: 'match',
  WRITING: 'writing',
  MCQ: 'mcq',
  IMAGE_MCQ: 'image-mcq',
  FILL_BLANK: 'fill-blank',
  LABEL: 'label',
  TRUE_FALSE: 'true-false',
};
