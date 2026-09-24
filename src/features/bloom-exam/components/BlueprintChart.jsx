import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { BLOOM_LEVELS, BLOOM_IDS } from '../bloom';

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) return null;
  const row = payload[0]?.payload ?? {};
  return (
    <div className="be-chart-tooltip">
      <strong>{label}</strong>
      {BLOOM_IDS.map((id) => {
        const value = Number(row[id]) || 0;
        if (value <= 0) return null;
        const level = BLOOM_LEVELS.find((l) => l.id === id);
        return (
          <div key={id} style={{ color: level.color }}>
            {level.label}: <strong>{value}</strong>
          </div>
        );
      })}
    </div>
  );
}

export function BlueprintChart({ data, legend }) {
  return (
    <div className="be-blueprint">
      <div className="be-blueprint-chart">
        <ResponsiveContainer width="100%" height={72}>
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 0, bottom: 0, left: 0, barCategoryGap: '20%' }}>
            <XAxis type="number" domain={[0, 'dataMax + 1']} hide />
            <YAxis type="category" dataKey="name" hide />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(148, 163, 184, 0.12)' }} />
            {BLOOM_LEVELS.map((level) => (
              <Bar
                key={level.id}
                dataKey={level.id}
                name={level.label}
                stackId="blueprint"
                fill={level.color}
                radius={[0, 0, 0, 0]}
                maxBarSize={18}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {legend && (
        <div className="be-blueprint-legend">
          {legend.map((row) => (
            <div key={row.id} className="be-blueprint-legend-row">
              <span
                className="be-level-dot"
                style={{ background: row.color }}
                aria-hidden="true"
              />
              <span className="be-level-label">{row.label}</span>
              <span className="be-level-count">{row.count}</span>
              <span className="be-level-pct">{row.percent}%</span>
              {row.marksShare != null && row.marksShare > 0 && (
                <span className="be-level-marks">≈ {row.marksShare} marks</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}