import { useState } from 'react';

const SECTIONS = [
  {
    label: 'Swār ( vowels )',
    chars: ['अ', 'आ', 'इ', 'ई', 'उ', 'ऊ', 'ए', 'ऐ', 'ओ', 'औ', 'अं', 'अः'],
  },
  {
    label: 'Vyañjan ( consonants )',
    chars: [
      'क', 'ख', 'ग', 'घ', 'ङ',
      'च', 'छ', 'ज', 'झ', 'ञ',
      'ट', 'ठ', 'ड', 'ढ', 'ण',
      'त', 'थ', 'द', 'ध', 'न',
      'प', 'फ', 'ब', 'भ', 'म',
      'य', 'र', 'ल', 'व', 'श',
      'ष', 'स', 'ह',
    ],
  },
  {
    label: 'Mātrā ( vowel signs )',
    chars: ['ा', 'ि', 'ी', 'ु', 'ू', 'ृ', 'े', 'ै', 'ो', 'ौ'],
  },
  {
    label: 'Other',
    chars: ['्', 'ँ', 'ं', '।'],
  },
];

export function DevanagariKeyboard({ onChar }) {
  const [open, setOpen] = useState(false);

  function insert(char) {
    onChar?.(char);
  }

  return (
    <div className="sp-kbd">
      <button
        type="button"
        className="sp-kbd-toggle"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
      >
        {open ? 'Hide Hindi keyboard' : 'Hindi keyboard'} <span aria-hidden>⌨</span>
      </button>
      {open && (
        <div className="sp-kbd-panel">
          {SECTIONS.map((section) => (
            <div key={section.label} className="sp-kbd-section">
              <div className="sp-kbd-section-label">{section.label}</div>
              <div className="sp-kbd-grid">
                {section.chars.map((char) => (
                  <button
                    key={char}
                    type="button"
                    className="sp-kbd-key"
                    onClick={() => insert(char)}
                  >
                    {char}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}