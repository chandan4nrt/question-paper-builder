import { useRef } from 'react';
import { DevanagariKeyboard } from './DevanagariKeyboard';
import { MarkdownText } from '../../components/MarkdownText';

const GREEK = ['α', 'β', 'γ', 'θ', 'λ', 'μ', 'σ', 'δ', 'π'];

const TOOLBAR = [
  {
    label: 'a/b',
    title: 'Fraction \\frac{a}{b}',
    apply: (sel) => {
      const m = sel || 'a';
      return { text: `\\frac{${m}}{b}`, caret: 6 + m.length };
    },
  },
  {
    label: 'xⁿ',
    title: 'Superscript x^{n}',
    apply: (sel) => {
      const m = sel || 'n';
      return { text: `^{${m}}`, caret: 2 + m.length };
    },
  },
  {
    label: 'xₙ',
    title: 'Subscript x_{n}',
    apply: (sel) => {
      const m = sel || 'n';
      return { text: `_{${m}}`, caret: 2 + m.length };
    },
  },
  {
    label: '√',
    title: 'Square root \\sqrt{}',
    apply: (sel) => {
      const m = sel || 'a';
      return { text: `\\sqrt{${m}}`, caret: 6 + m.length };
    },
  },
  {
    label: '∑',
    title: 'Sum \\sum',
    apply: (sel) => ({ text: `\\sum_{i=1}^{${sel || 'n'}}`, caret: null }),
  },
  {
    label: '∫',
    title: 'Integral \\int',
    apply: (sel) => ({ text: `\\int_{a}^{b}`, caret: null }),
  },
  { label: '×', title: 'Multiply \\times', apply: (sel) => ({ text: '\\times', caret: null }) },
  { label: '÷', title: 'Divide \\div', apply: (sel) => ({ text: '\\div', caret: null }) },
  { label: '±', title: 'Plus or minus \\pm', apply: (sel) => ({ text: '\\pm', caret: null }) },
  { label: '≤', title: 'Less or equal \\leq', apply: (sel) => ({ text: '\\leq', caret: null }) },
  { label: '≥', title: 'Greater or equal \\geq', apply: (sel) => ({ text: '\\geq', caret: null }) },
  { label: '∞', title: 'Infinity \\infty', apply: (sel) => ({ text: '\\infty', caret: null }) },
  { label: '→', title: 'Arrow \\rightarrow', apply: (sel) => ({ text: '\\rightarrow', caret: null }) },
];

export function MathTextArea({ value, onChange, rows = 3, placeholder, compact = false, testId, readOnly = false }) {
  const ref = useRef(null);

  function selection() {
    const ta = ref.current;
    if (!ta || document.activeElement !== ta) {
      const len = String(value ?? '').length;
      return { start: len, end: len };
    }
    return { start: ta.selectionStart, end: ta.selectionEnd };
  }

  function commit(text, caretOffset = null) {
    const { start, end } = selection();
    const next = `${String(value ?? '').slice(0, start)}${text}${String(value ?? '').slice(end)}`;
    onChange?.(next);
    requestAnimationFrame(() => {
      const ta = ref.current;
      if (!ta) return;
      ta.focus();
      const pos = caretOffset == null ? start + text.length : start + caretOffset;
      ta.setSelectionRange(pos, pos);
    });
  }

  function runItem(item) {
    const { start, end } = selection();
    const sel = String(value ?? '').slice(start, end);
    const { text, caret } = item.apply(sel);
    commit(text, caret);
  }

  function insertChar(char) {
    commit(char);
  }

  function handleKeyDown(event) {
    if (event.key === 'Tab') {
      event.preventDefault();
      const { start, end } = selection();
      const sel = String(value ?? '').slice(start, end);
      commit(`$${sel}$`, sel ? sel.length + 2 : 1);
    }
  }

  const hasMath = /[\\$]/.test(String(value ?? ''));

  return (
    <div className="sp-mta">
      {!readOnly && (
        <div className="sp-mta-toolbar">
          {TOOLBAR.map((item) => (
            <button
              key={item.title}
              type="button"
              className="sp-mta-key"
              title={item.title}
              onClick={() => runItem(item)}
            >
              {item.label}
            </button>
          ))}
          {GREEK.map((char) => (
            <button key={char} type="button" className="sp-mta-key" title={`Insert ${char}`} onClick={() => insertChar(char)}>
              {char}
            </button>
          ))}
          <span className="sp-mta-tip">Tab wraps selection in $…$</span>
        </div>
      )}

      <textarea
        ref={ref}
        className={compact ? 'sp-mta-textarea sp-mta-textarea-compact' : 'sp-mta-textarea'}
        rows={rows}
        value={value ?? ''}
        placeholder={placeholder ?? 'Write your answer (Hindi + math $…$)…'}
        onChange={(event) => onChange?.(event.target.value)}
        onKeyDown={handleKeyDown}
        readOnly={readOnly}
        data-testid={testId}
      />

      {!readOnly && <DevanagariKeyboard onChar={insertChar} />}

      {String(value ?? '').trim() && (
        <div className={`sp-mta-preview ${compact ? 'sp-mta-preview-compact' : ''}`}>
          <div className="sp-mta-preview-label">
            {hasMath ? 'Preview (rendered):' : 'Preview:'}
          </div>
          <MarkdownText>{value}</MarkdownText>
        </div>
      )}
    </div>
  );
}