import React from 'react';

export function CommonTitleField({
  value,
  onChange,
  placeholder = 'Common title / Quiz heading…',
}) {
  return (
    <div className="sp-common-title-section">
      <div className="sp-answer-label">
        <span>Common Title</span>
        <span className="sp-common-title-badge">Quiz Heading</span>
      </div>
      <input
        type="text"
        className="sp-common-title-input"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}
