import { bloomColor, bloomLabel, BLOOM_LEVELS } from '../bloom';

export function BloomLevelBadge({ level, onSelect }) {
  const color = bloomColor(level);
  const label = bloomLabel(level);
  if (onSelect) {
    return (
      <select
        className="be-bloom-select"
        value={level}
        onChange={(e) => onSelect(e.target.value)}
        style={{ '--be-level': color }}
        aria-label="Bloom's taxonomy level"
      >
        {BLOOM_LEVELS.map((option) => (
          <option key={option.id} value={option.id}>{option.label}</option>
        ))}
      </select>
    );
  }
  return (
    <span className="be-bloom-badge" style={{ '--be-level': color }}>
      {label}
    </span>
  );
}