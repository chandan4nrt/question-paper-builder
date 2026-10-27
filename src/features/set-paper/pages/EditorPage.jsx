import { ClipboardList, Plus } from 'lucide-react';
import { usePaper } from '../context/PaperContext';
import { HeaderEditor } from '../components/HeaderEditor';
import { QuestionCard } from '../components/QuestionCard';

export function EditorPage({ onOpenSidebar }) {
  const { state, dispatch } = usePaper();

  function moveQuestion(index, delta) {
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
          <div className="sp-section-head-left">
            <ClipboardList size={20} color="#FFB199" />
            <h2>Questions</h2>
            <span className="sp-count-badge">{state.questions.length}</span>
          </div>

          {onOpenSidebar && (
            <button
              type="button"
              className="sp-section-add-btn sp-mobile-only"
              onClick={onOpenSidebar}
              title="Add Question"
            >
              <Plus size={15} />
              <span>Add Question</span>
            </button>
          )}
        </div>

        {state.questions.length === 0 && (
          <div className="sp-empty">
            <div className="emoji">📝</div>
            <b>No questions yet!</b>
            <p>Add your first question using the sidebar or the button below</p>
            {onOpenSidebar && (
              <button
                type="button"
                className="sp-empty-open-btn"
                onClick={onOpenSidebar}
              >
                <Plus size={16} /> Open Question Tools
              </button>
            )}
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

        {state.questions.length > 0 && onOpenSidebar && (
          <div className="sp-add-more-container sp-mobile-only">
            <button
              type="button"
              className="sp-add-more-btn"
              onClick={onOpenSidebar}
            >
              <Plus size={18} />
              <span>Add Question / Change Theme</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}