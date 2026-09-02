import { z } from 'zod';

const optionSchema = z.object({
  id: z.number().optional(),
  optionText: z.string().min(1, 'Option text is required'),
  isCorrect: z.boolean(),
  displayOrder: z.number().int(),
});

// Client-side validation mirrors the backend's QuestionOptionValidator
// (Section 13 of the spec). The backend re-validates independently —
// this is only for fast feedback, never the source of truth.
export const questionFormSchema = z
  .object({
    academicYearId: z.number({ required_error: 'Academic year is required' }),
    classId: z.number({ required_error: 'Class is required' }),
    subjectId: z.number({ required_error: 'Subject is required' }),
    chapterId: z.number({ required_error: 'Chapter is required' }),
    topicId: z.number({ required_error: 'Topic is required' }),
    questionType: z.enum([
      'MCQ',
      'MULTIPLE_SELECT',
      'TRUE_FALSE',
      'FILL_IN_THE_BLANK',
      'MATCH_THE_FOLLOWING',
      'ONE_WORD',
      'SHORT_ANSWER',
      'LONG_ANSWER',
      'IMAGE_BASED',
      'IDENTIFY_AND_NAME',
      'ARRANGE_IN_ORDER',
    ]),
    difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
    language: z.enum(['HINDI', 'ENGLISH', 'BILINGUAL']),
    questionText: z.string().min(1, 'Question text cannot be blank'),
    explanation: z.string().optional(),
    expectedAnswer: z.string().optional(),
    evaluationGuidance: z.string().optional(),
    marks: z.number({ required_error: 'Marks is required' }).positive('Marks must be greater than zero'),
    options: z.array(optionSchema).default([]),
  })
  .superRefine((data, ctx) => {
    const correctCount = data.options.filter((o) => o.isCorrect).length;

    if (data.questionType === 'MCQ') {
      if (data.options.length < 2) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['options'], message: 'At least two options are required' });
      } else if (correctCount !== 1) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['options'], message: 'MCQ must have exactly one correct option' });
      }
    }

    if (data.questionType === 'MULTIPLE_SELECT') {
      if (data.options.length < 2) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['options'], message: 'At least two options are required' });
      } else if (correctCount < 1) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['options'], message: 'Select at least one correct option' });
      }
    }

    if (data.questionType === 'TRUE_FALSE') {
      if (data.options.length !== 2) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['options'], message: 'True/False needs exactly two options' });
      } else if (correctCount !== 1) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['options'], message: 'Mark exactly one of True/False as correct' });
      }
    }

    if (['FILL_IN_THE_BLANK', 'ONE_WORD', 'SHORT_ANSWER', 'LONG_ANSWER'].includes(data.questionType)) {
      if (!data.expectedAnswer || data.expectedAnswer.trim().length === 0) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['expectedAnswer'], message: 'Expected answer is required for this question type' });
      }
    }
  });

export type QuestionFormSchema = z.infer<typeof questionFormSchema>;
