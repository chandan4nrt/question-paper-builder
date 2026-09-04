import { ClipboardList } from 'lucide-react';
import { usePaper } from '../context/PaperContext';
import { HeaderEditor } from '../components/HeaderEditor';
import { QuestionCard } from '../components/QuestionCard';

export function EditorPage() {
  const { state, dispatch } = usePaper();

  function moveQuestion(index: number, delta: number) {
    const next = [...state.questions];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    dispatch({ type: 'REORDER_QUESTIONS', payload: next });
  }

  return (
    <div className="sp-editor-main sp-stack">
      <HeaderEditor />

      <div>
        <div className="sp-section-head">
          <ClipboardList size={20} color="#FFB199" />
          <h2>Questions</h2>
          <span className="sp-count-badge">{state.questions.length}</span>
        </div>

        {state.questions.length === 0 && (
          <div className="sp-empty">
            <div className="emoji">📝</div>
            <b>No questions yet!</b>
            <p>Add your first question using the sidebar on the right</p>
          </div>
        )}

        {state.questions.map((question, index) => (
          <QuestionCard
            key={question.id}
            question={question}
            onMoveUp={() => moveQuestion(index, -1)}
            onMoveDown={() => moveQuestion(index, 1)}
            canMoveUp={index > 0}
            canMoveDown={index < state.questions.length - 1}
          />
        ))}
      </div>
    </div>
  );
}
