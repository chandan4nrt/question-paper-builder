import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  Plus,
  ChevronDown,
  Layers,
  X,
  Pencil,
  Trash2,
  Sparkles,
  AlignLeft,
  Shuffle,
  PenLine,
  ListChecks,
  CircleDot,
  Underline,
  Image as ImageIcon,
} from "lucide-react";
import { usePaper } from "../context/PaperContext";
import { QUESTION_TYPES, type PaperTheme, type QuestionType } from "../types";
import { loadThemes, saveThemes } from "../helpers";

const TYPE_ORDER: QuestionType[] = [
  QUESTION_TYPES.NORMAL,
  QUESTION_TYPES.MATCH,
  QUESTION_TYPES.WRITING,
  QUESTION_TYPES.MCQ,
  QUESTION_TYPES.IMAGE_MCQ,
  QUESTION_TYPES.FILL_BLANK,
  QUESTION_TYPES.LABEL,
];

const TYPE_META: Record<string, { label: string; color: string; icon: ReactNode }> = {
  [QUESTION_TYPES.NORMAL]: { label: "Normal", color: "#7a3b00", icon: <AlignLeft size={14} /> },
  [QUESTION_TYPES.MATCH]: { label: "Match", color: "#6a4200", icon: <Shuffle size={14} /> },
  [QUESTION_TYPES.WRITING]: { label: "Writing", color: "#8f240b", icon: <PenLine size={14} /> },
  [QUESTION_TYPES.MCQ]: { label: "MCQ", color: "#7a1f09", icon: <ListChecks size={14} /> },
  [QUESTION_TYPES.IMAGE_MCQ]: { label: "Circle It", color: "#8f240b", icon: <CircleDot size={14} /> },
  [QUESTION_TYPES.FILL_BLANK]: { label: "Fill Blank", color: "#085a54", icon: <Underline size={14} /> },
  [QUESTION_TYPES.LABEL]: { label: "Label", color: "#6b21a8", icon: <ImageIcon size={14} /> },
};

function emptyConfig(type: QuestionType, count = 0, marks = 1) {
  return { type, count, marks };
}

function configFromTheme(theme: PaperTheme) {
  return TYPE_ORDER.map((type) => {
    const found = theme.questions.find((q) => q.type === type);
    return found ? { ...found } : emptyConfig(type);
  });
}

function themeSummary(theme: PaperTheme) {
  const totalQ = theme.questions.reduce((s, q) => s + q.count, 0);
  const totalM = theme.questions.reduce((s, q) => s + q.count * q.marks, 0);
  return `${totalQ} questions · ${totalM} marks`;
}

function ThemeConfigModal({
  initial,
  onSave,
  onClose,
}: {
  initial: PaperTheme | null;
  onSave: (theme: PaperTheme) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [configs, setConfigs] = useState(() =>
    initial ? configFromTheme(initial) : TYPE_ORDER.map((t) => emptyConfig(t)),
  );
  const [description, setDescription] = useState(initial?.description ?? "");

  const totalQuestions = configs.reduce((s, c) => s + c.count, 0);
  const totalMarks = configs.reduce((s, c) => s + c.count * c.marks, 0);

  function setCount(index: number, count: number) {
    setConfigs((prev) => prev.map((c, i) => (i === index ? { ...c, count: Math.max(0, Math.min(25, count)) } : c)));
  }

  function setMarks(index: number, marks: number) {
    setConfigs((prev) => prev.map((c, i) => (i === index ? { ...c, marks: Math.max(0, Math.min(100, marks)) } : c)));
  }

  function handleSave() {
    onSave({
      id: initial?.id ?? `theme-${Date.now()}`,
      name: name.trim() || "Untitled Theme",
      description: description.trim() || undefined,
      questions: configs.filter((c) => c.count > 0),
    });
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{initial ? "Edit Theme" : "New Theme"}</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="sp-theme-form">
          <div>
            <label className="sp-field-label">Theme Name</label>
            <input
              className="sp-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Nursery Worksheet"
              autoFocus
            />
          </div>
          <div>
            <label className="sp-field-label">Description (optional)</label>
            <input
              className="sp-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Shapes, letters and picture-based fun"
            />
          </div>
        </div>

        <div className="sp-theme-config-list">
          {configs.map((c, i) => {
            const meta = TYPE_META[c.type] ?? TYPE_META[QUESTION_TYPES.NORMAL];
            return (
              <div key={c.type} className="sp-theme-config-row">
                <span className="sp-theme-config-icon" style={{ color: meta.color }}>
                  {meta.icon}
                </span>
                <span className="sp-theme-config-label">{meta.label}</span>
                <button
                  type="button"
                  className="sp-line-step sp-theme-step"
                  onClick={() => setCount(i, c.count - 1)}
                  aria-label={`Decrease ${meta.label}`}
                >
                  <span className="sp-step-sym">−</span>
                </button>
                <span className="sp-line-count">{c.count}</span>
                <button
                  type="button"
                  className="sp-line-step sp-theme-step"
                  onClick={() => setCount(i, c.count + 1)}
                  aria-label={`Increase ${meta.label}`}
                >
                  <span className="sp-step-sym">+</span>
                </button>
                <span className="sp-theme-marks-label">marks / q</span>
                <button
                  type="button"
                  className="sp-line-step sp-theme-step"
                  onClick={() => setMarks(i, c.marks - 1)}
                  aria-label={`Decrease marks for ${meta.label}`}
                >
                  <span className="sp-step-sym">−</span>
                </button>
                <span className="sp-line-count">{c.marks}</span>
                <button
                  type="button"
                  className="sp-line-step sp-theme-step"
                  onClick={() => setMarks(i, c.marks + 1)}
                  aria-label={`Increase marks for ${meta.label}`}
                >
                  <span className="sp-step-sym">+</span>
                </button>
              </div>
            );
          })}
        </div>

        <div className="sp-theme-summary">
          <span>{totalQuestions} questions total</span>
          <span className="sp-theme-summary-dot">·</span>
          <span>{totalMarks} marks total</span>
        </div>

        <div className="sp-theme-modal-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="button" onClick={handleSave}>
            Save Theme
          </button>
        </div>
      </div>
    </div>
  );
}

export function ThemePanel() {
  const { dispatch } = usePaper();
  const [expanded, setExpanded] = useState(true);
  const [themes, setThemes] = useState<PaperTheme[]>(() => loadThemes());
  const [modalTheme, setModalTheme] = useState<PaperTheme | null | "new">(null);

  useEffect(() => {
    saveThemes(themes);
  }, [themes]);

  function generate(theme: PaperTheme) {
    dispatch({ type: "GENERATE_FROM_THEME", payload: theme });
  }

  function saveTheme(theme: PaperTheme) {
    setThemes((prev) => {
      const exists = prev.some((t) => t.id === theme.id);
      return exists ? prev.map((t) => (t.id === theme.id ? theme : t)) : [...prev, theme];
    });
    setModalTheme(null);
  }

  function deleteTheme(id: string) {
    setThemes((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <div className="sp-sidebar-card">
      <button
        type="button"
        className="sp-sidebar-title"
        style={{
          width: "100%",
          justifyContent: "space-between",
          background: "none",
          border: "none",
          cursor: "pointer",
        }}
        onClick={() => setExpanded((s) => !s)}
      >
        <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <Layers size={15} color="#9333EA" /> Themes (One-Click Paper)
        </span>
        <ChevronDown size={15} style={{ transform: expanded ? "rotate(180deg)" : "none" }} />
      </button>

      {expanded && (
        <>
          <div style={{ display: "flex", flexWrap: "wrap", height: "98px", overflow: "auto", gap: "0.6rem", marginTop: "0.5rem" }}>
            {themes.map((theme) => (
              <div key={theme.id} className="sp-theme-card">
                <div className="sp-theme-card-head">
                  <b>{theme.name}</b>
                  <span className="sp-theme-summary-text">{themeSummary(theme)}</span>
                </div>
                {theme.description && <span className="sp-theme-desc">{theme.description}</span>}
                <div className="sp-theme-card-actions">
                  <button
                    type="button"
                    className="sp-theme-generate"
                    onClick={() => generate(theme)}
                    title="Generate this paper instantly"
                  >
                    Generate
                  </button>
                  <button type="button" className="sp-icon-btn" onClick={() => setModalTheme(theme)} title="Edit theme">
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    className="sp-icon-btn"
                    onClick={() => deleteTheme(theme.id)}
                    title="Delete theme"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="sp-mcq-add"
            style={{ width: "100%", justifyContent: "center" }}
            onClick={() => setModalTheme("new")}
          >
            <Plus size={14} /> New Theme
          </button>
        </>
      )}

      {modalTheme &&
        createPortal(
          <ThemeConfigModal
            initial={modalTheme === "new" ? null : modalTheme}
            onSave={saveTheme}
            onClose={() => setModalTheme(null)}
          />,
          document.body,
        )}
    </div>
  );
}
