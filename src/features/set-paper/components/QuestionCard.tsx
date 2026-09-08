import { QUESTION_TYPES, type Question } from '../types';
import { NormalQuestion } from './NormalQuestion';
import { MatchQuestion } from './MatchQuestion';
import { WritingQuestion } from './WritingQuestion';
import { McqQuestion } from './McqQuestion';
import { ImageMcqQuestion } from './ImageMcqQuestion';
import { FillBlankQuestion } from './FillBlankQuestion';
import { LabelQuestion } from './LabelQuestion';
import { TrueFalseQuestion } from './TrueFalseQuestion';

interface QuestionCardProps {
  question: Question;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
}

export function QuestionCard({
  question,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: QuestionCardProps) {
  const common = { onMoveUp, onMoveDown, canMoveUp, canMoveDown };

  switch (question.type) {
    case QUESTION_TYPES.MATCH:
      return <MatchQuestion question={question} {...common} />;
    case QUESTION_TYPES.WRITING:
      return <WritingQuestion question={question} {...common} />;
    case QUESTION_TYPES.MCQ:
      return <McqQuestion question={question} {...common} />;
    case QUESTION_TYPES.IMAGE_MCQ:
      return <ImageMcqQuestion question={question} {...common} />;
    case QUESTION_TYPES.FILL_BLANK:
      return <FillBlankQuestion question={question} {...common} />;
    case QUESTION_TYPES.LABEL:
      return <LabelQuestion question={question} {...common} />;
    case QUESTION_TYPES.TRUE_FALSE:
      return <TrueFalseQuestion question={question} {...common} />;
    default:
      return <NormalQuestion question={question} {...common} />;
  }
}
