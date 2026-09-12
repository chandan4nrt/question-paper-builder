import { useEffect, useRef, useState } from 'react';
import { Trash2, Star, ChevronUp, ChevronDown, Image as ImageIcon, X, Move } from 'lucide-react';
import { MAX_IMAGE_SIZE, usePaper } from '../context/PaperContext';

const DEFAULT_SPOTS = [
  { x: 30, y: 30 },
  { x: 70, y: 30 },
  { x: 30, y: 70 },
  { x: 70, y: 70 },
  { x: 50, y: 20 },
  { x: 20, y: 50 },
  { x: 80, y: 50 },
  { x: 50, y: 80 },
  { x: 15, y: 85 },
  { x: 85, y: 85 },
  { x: 85, y: 15 },
  { x: 15, y: 15 },
];

function markersFor(question, count) {
  const markers = question.labelMarkers ?? [];
  const result = [];
  for (let i = 0; i < count; i++) {
    if (markers[i]) {
      result.push(markers[i]);
    } else {
      result.push({
        id: `lm-${question.id}-${i}`,
        x: DEFAULT_SPOTS[i % DEFAULT_SPOTS.length].x,
        y: DEFAULT_SPOTS[i % DEFAULT_SPOTS.length].y,
      });
    }
  }
  return result;
}

function Markers({
  markers,
  image,
  draggable,
  onMove,
}) {
  const stageRef = useRef(null);
  const [dragId, setDragId] = useState(null);

  useEffect(() => {
    if (!draggable || !dragId) return;
    const activeId = dragId;

    function handleMove(e) {
      const stage = stageRef.current;
      if (!stage) return;
      const rect = stage.getBoundingClientRect();
      let x = ((e.clientX - rect.left) / rect.width) * 100;
      let y = ((e.clientY - rect.top) / rect.height) * 100;
      x = Math.max(0, Math.min(100, x));
      y = Math.max(0, Math.min(100, y));
      onMove?.(activeId, x, y);
    }

    function handleUp() {
      setDragId(null);
    }

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
  }, [draggable, dragId, onMove]);

  if (!image) return null;

  return (
    <div
      ref={stageRef}
      className={draggable ? 'sp-label-stage sp-label-stage-editable' : 'sp-label-stage'}
      style={{
        position: 'relative',
        display: 'inline-block',
        maxWidth: '100%',
        alignSelf: 'center',
      }}
    >
      <img src={image} alt="diagram" className="sp-label-diagram" />
      {markers.map((m, i) => (
        <button
          key={m.id}
          type="button"
          onPointerDown={
            draggable
              ? (e) => {
                  e.preventDefault();
                  e.target.setPointerCapture?.(e.pointerId);
                  setDragId(m.id);
                }
              : undefined
          }
          className="sp-label-marker"
          style={{ left: `${m.x}%`, top: `${m.y}%` }}
          title={draggable ? `Drag label ${i + 1} to position` : undefined}
        >
          {i + 1}
        </button>
      ))}
    </div>
  );
}

export function LabelPreview({
  image,
  partCount,
  markers,
}) {
  const resolved = markers ?? Array.from({ length: partCount }, (_, i) => ({
    id: `pl-${i}`,
    x: DEFAULT_SPOTS[i % DEFAULT_SPOTS.length].x,
    y: DEFAULT_SPOTS[i % DEFAULT_SPOTS.length].y,
  }));

  return (
    <div className="sp-label-preview">
      <Markers markers={resolved} image={image} />
      <div className="sp-label-blanks">
        {Array.from({ length: resolved.length }).map((_, i) => (
          <div key={i} className="sp-label-blank-row">
            <span className="sp-label-num">{i + 1}.</span>
            <span className="sp-blank-line sp-w24" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function LabelQuestion({
  question,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}) {
  const { dispatch, showToast } = usePaper();

  function update(data) {
    dispatch({ type: 'UPDATE_QUESTION', payload: { id: question.id, data } });
  }

  const partCount = question.partCount ?? 4;
  const markers = markersFor(question, partCount);

  function handleImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_IMAGE_SIZE) {
      showToast('Image is too large. Please choose an image under 5 MB.');
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) =>
      update({ image: String(ev.target?.result), imageName: file.name });
    reader.readAsDataURL(file);
  }

  function setCount(next) {
    const n = Math.max(1, Math.min(12, next));
    const current = markersFor(question, question.partCount ?? 4);
    let nextMarkers = current;
    if (n < current.length) {
      nextMarkers = current.slice(0, n);
    } else if (n > current.length) {
      nextMarkers = [
        ...current,
        ...Array.from({ length: n - current.length }, (_, i) => ({
          id: `lm-${question.id}-${Date.now()}-${i}`,
          x: DEFAULT_SPOTS[(current.length + i) % DEFAULT_SPOTS.length].x,
          y: DEFAULT_SPOTS[(current.length + i) % DEFAULT_SPOTS.length].y,
        })),
      ];
    }
    update({ partCount: n, labelMarkers: nextMarkers });
  }

  function moveMarker(id, x, y) {
    const next = markers.map((m) => (m.id === id ? { ...m, x, y } : m));
    update({ labelMarkers: next, partCount: markers.length });
  }

  function handleAnswerChange(index, value) {
    const answers = [...(question.answers ?? [])];
    answers[index] = value;
    update({ answers });
  }

  return (
    <div className="sp-question-card">
      <div className="sp-q-head">
        <div className="sp-reorder">
          <button type="button" onClick={onMoveUp} disabled={!canMoveUp} title="Move up">
            <ChevronUp size={14} />
          </button>
          <button type="button" onClick={onMoveDown} disabled={!canMoveDown} title="Move down">
            <ChevronDown size={14} />
          </button>
        </div>
        <div className="sp-q-number" style={{ background: 'linear-gradient(135deg,#9333ea,#ff7a52)' }}>
          {question.number}
        </div>
        <span className="sp-q-type pink">Picture Labeling</span>
        <div className="sp-q-actions">
          <div className="sp-marks">
            <Star size={12} color="#FFE29A" fill="#FFE29A" />
            <input
              type="number"
              min={0}
              max={100}
              value={question.marks}
              onChange={(e) => update({ marks: Number(e.target.value) })}
            />
            <span>marks</span>
          </div>
          <button
            type="button"
            className="sp-icon-btn"
            onClick={() => dispatch({ type: 'DELETE_QUESTION', payload: question.id })}
            title="Delete question"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="sp-q-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <input
          value={question.text}
          onChange={(e) => update({ text: e.target.value })}
          placeholder='Label the parts of the diagram below.'
          className="sp-input"
        />

        <div className="sp-diagram-upload" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
          {question.image ? (
            <>
              <div className="sp-label-hint">
                <Move size={13} /> Drag the numbered labels onto the picture
              </div>
              <Markers markers={markers} image={question.image} draggable onMove={moveMarker} />
              <button
                type="button"
                className="sp-icon-btn"
                style={{ alignSelf: 'flex-end' }}
                onClick={() => update({ image: null, imageName: null })}
                title="Remove diagram"
              >
                <X size={14} /> Remove picture
              </button>
            </>
          ) : (
            <label className="sp-upload-label" style={{ fontSize: '0.8rem', padding: '0.5rem 1rem', alignSelf: 'center' }}>
              <ImageIcon size={14} /> Upload diagram / picture
              <input
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleImageUpload}
              />
            </label>
          )}
        </div>

        <div className="sp-line-control">
          <span className="sp-field-label" style={{ margin: 0 }}>
            Number of labels:
          </span>
          <button
            type="button"
            className="sp-line-step sp-theme-step"
            onClick={() => setCount(partCount - 1)}
            aria-label="Fewer labels"
          >
            <span className="sp-step-sym">−</span>
          </button>
          <span className="sp-line-count">{partCount}</span>
<button
              type="button"
              className="sp-line-step sp-theme-step"
              onClick={() => setCount(partCount + 1)}
              aria-label="More labels"
            >
              <span className="sp-step-sym">+</span>
            </button>
          </div>
        </div>

        {markers.length > 0 && (
          <div className="sp-answer-section">
            <span className="sp-answer-label">Label answers</span>
            {markers.map((m, i) => (
              <div key={m.id} className="sp-answer-pair">
                <span className="sp-answer-pair-left">{i + 1}.</span>
                <input
                  className="sp-answer-input"
                  value={question.answers?.[i] ?? ''}
                  onChange={(e) => handleAnswerChange(i, e.target.value)}
                  placeholder={`Label ${i + 1}`}
                />
              </div>
            ))}
          </div>
        )}
    </div>
  );
}