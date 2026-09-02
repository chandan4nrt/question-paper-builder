import { useState } from 'react';
import { School, ChevronDown, ChevronUp, Calendar, Clock, User, BookOpen, ImagePlus, X, NotebookPen, CalendarDays, ClipboardList } from 'lucide-react';
import { usePaper } from '../context/PaperContext';

interface HeaderFieldConfig {
  field: keyof import('../types').PaperHeader;
  label: string;
  icon: React.ReactNode;
  placeholder?: string;
  type?: string;
}

export function HeaderEditor() {
  const { state, dispatch } = usePaper();
  const { header } = state;
  const [expanded, setExpanded] = useState(true);

  const fields: HeaderFieldConfig[] = [
    { field: 'schoolName', label: 'School Name', icon: <School size={15} />, placeholder: 'Sunshine Playschool' },
    { field: 'className', label: 'Class / Grade', icon: <BookOpen size={15} />, placeholder: 'Nursery' },
    { field: 'subject', label: 'Subject', icon: <BookOpen size={15} />, placeholder: 'English' },
    { field: 'exam', label: 'Exam', icon: <NotebookPen size={15} />, placeholder: 'Mid-Term' },
    { field: 'academicYear', label: 'Academic Year', icon: <CalendarDays size={15} />, placeholder: '2025-2026' },
    { field: 'teacherName', label: "Teacher's Name", icon: <User size={15} />, placeholder: 'Ms. Priya' },
    { field: 'duration', label: 'Duration', icon: <Clock size={15} />, placeholder: '30 Minutes' },
    { field: 'date', label: 'Date', icon: <Calendar size={15} />, placeholder: '', type: 'date' },
  ];

  function update(field: keyof typeof header, value: string | null) {
    dispatch({ type: 'SET_HEADER', payload: { [field]: value } });
  }

  return (
    <div className="sp-header-card">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="sp-header-title"
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <School size={20} />
          <span>Paper Header</span>
        </span>
        {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>

      {expanded && (
        <div className="sp-header-body">
          <div className="sp-logo-row">
            <label className="sp-upload-label">
              <span className="sp-logo-preview-wrap">
                {header.logo ? (
                  <img src={header.logo} alt="School logo" className="sp-logo-preview" />
                ) : (
                  <ImagePlus size={20} />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () => update('logo', String(reader.result ?? ''));
                    reader.readAsDataURL(file);
                  }}
                />
              </span>
            </label>
            <span className="sp-logo-actions">
              Upload School Logo
              {header.logo && (
                <button
                  type="button"
                  className="sp-icon-btn"
                  onClick={() => update('logo', null)}
                  title="Remove logo"
                >
                  <X size={14} />
                </button>
              )}
            </span>
          </div>
          <div className="sp-form-grid">
            {fields.map(({ field, label, icon, placeholder, type }) => (
              <div key={field}>
                <label className="sp-field-label">
                  {icon} {label}
                </label>
                <input
                  type={type || 'text'}
                  value={header[field] ?? ''}
                  onChange={(e) => update(field, e.target.value)}
                  placeholder={placeholder}
                  className="sp-input"
                />
              </div>
            ))}
          </div>

          <div style={{ marginTop: '1rem' }}>
            <label className="sp-field-label">
              <ClipboardList size={15} /> Exam Instructions
            </label>
            <textarea
              value={header.instructions ?? ''}
              onChange={(e) => update('instructions', e.target.value)}
              placeholder="Write instructions for the exam, e.g. 'Attempt all questions. Use a blue pen...'"
              rows={3}
              className="sp-input"
            />
          </div>
        </div>
      )}
    </div>
  );
}
