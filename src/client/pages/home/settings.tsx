import React, { useEffect, useState } from 'react';

const STORAGE_KEY = 'audioSettings';
const defaults = { bgm: 1, coin: 1, jump: 1, death: 1 };
const ids = { bgm: 'bgm', coin: 'coin1', jump: 'jump1', death: 'death1' };

function loadSettings() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '') || { ...defaults };
  } catch {
    return { ...defaults };
  }
}
function saveSettings(s: typeof defaults) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}
function applySettings(s: typeof defaults) {
  Object.keys(ids).forEach((k) => {
    const el = document.getElementById((ids as any)[k]) as HTMLAudioElement | null;
    if (el) el.volume = Math.max(0, Math.min(1, (s as any)[k]));
  });
}

export default function Settings() {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<{ [K in keyof typeof defaults]: number }>({
    ...defaults,
  });

  useEffect(() => {
    const s = loadSettings();
    setValues({
      bgm: s.bgm,
      coin: s.coin,
      jump: s.jump,
      death: s.death,
    });
    // try apply on mount (if audio elements exist)
    applySettings(s);
  }, []);

  function update(key: keyof typeof defaults, pct: number) {
    const next = { ...values, [key]: pct / 100 };
    setValues(next);
    saveSettings(next);
    applySettings(next);
  }

  function reset() {
    saveSettings(defaults);
    setValues(defaults);
    applySettings(defaults);
  }

  function playSample(id: string, key?: keyof typeof defaults) {
    const a = document.getElementById(id) as HTMLAudioElement | null;
    if (!a) return;
    try { a.currentTime = 0; } catch {}
    a.volume = key ? (values[key] ?? defaults[key]) : 1;
    a.play().catch(()=>{});
  }

  return (
    <>
      {/* wrapper reproduces the original button styling but only the inner div opens settings */}
      <div
        className="relative transform transition-transform hover:scale-110 active:scale-95"
        style={{
          background: '#6C63FF',
          border: 'none',
          boxShadow:
            'inset 3px 3px 0 #8B88FF, inset -3px -3px 0 #5A52CC, 3px 3px 0 #4A43AA',
          fontFamily: '"Courier New", monospace',
          imageRendering: 'pixelated',
          display: 'inline-block',
          borderRadius: 6,
        }}
      >
        {/* this is the exact element you quoted - clicking it opens settings */}
        <div
          onClick={() => setOpen(true)}
          className="px-6 py-3 text-white font-bold text-lg tracking-wider"
          style={{
            textShadow: '2px 2px 0 #4A43AA',
            filter: 'contrast(1.2)',
            cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          ⚙ SETTINGS
        </div>

        {/* decorative overlays preserved from original */}
        <div className="absolute inset-0 bg-white opacity-0 hover:opacity-10 transition-opacity duration-100" />
        <div
          className="absolute top-0 left-0 w-full h-1 bg-white opacity-30"
          style={{ imageRendering: 'pixelated' }}
        />
        <div
          className="absolute top-0 left-0 w-1 h-full bg-white opacity-30"
          style={{ imageRendering: 'pixelated' }}
        />
      </div>

      {/* Modal: top-left, non-overlapping */}
      {open && (
        <div
          className="fixed z-50"
          style={{ top: 56, left: 8, width: 340 }}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-black bg-opacity-40 fixed inset-0"
            onClick={() => setOpen(false)}
          />
          <div
            className="relative bg-[#111] text-white p-4 rounded shadow-lg"
            style={{ width: 340, zIndex: 60 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold mb-3">Settings</h2>

            {/* BGM */}
            <div className="flex items-center gap-3 mb-2">
              <label style={{ width: 60 }}>BGM</label>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round((values.bgm ?? 1) * 100)}
                onChange={(e) => update('bgm', Number(e.target.value))}
                className="flex-1"
              />
              <div style={{ width: 48, textAlign: 'right' }}>
                {Math.round((values.bgm ?? 1) * 100)}%
              </div>
            </div>

            {/* Coin */}
            <div className="flex items-center gap-3 mb-2">
              <label style={{ width: 60 }}>Coin</label>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round((values.coin ?? 1) * 100)}
                onChange={(e) => update('coin', Number(e.target.value))}
                className="flex-1"
              />
              <div style={{ width: 48, textAlign: 'right' }}>
                {Math.round((values.coin ?? 1) * 100)}%
              </div>
              <button
                onClick={() => playSample(ids.coin, 'coin')}
                className="ml-2 px-2 py-1 bg-gray-700 rounded"
              >
                Play
              </button>
            </div>

            {/* Jump */}
            <div className="flex items-center gap-3 mb-2">
              <label style={{ width: 60 }}>Jump</label>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round((values.jump ?? 1) * 100)}
                onChange={(e) => update('jump', Number(e.target.value))}
                className="flex-1"
              />
              <div style={{ width: 48, textAlign: 'right' }}>
                {Math.round((values.jump ?? 1) * 100)}%
              </div>
              <button
                onClick={() => playSample(ids.jump, 'jump')}
                className="ml-2 px-2 py-1 bg-gray-700 rounded"
              >
                Play
              </button>
            </div>

            {/* Death */}
            <div className="flex items-center gap-3 mb-3">
              <label style={{ width: 60 }}>Death</label>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round((values.death ?? 1) * 100)}
                onChange={(e) => update('death', Number(e.target.value))}
                className="flex-1"
              />
              <div style={{ width: 48, textAlign: 'right' }}>
                {Math.round((values.death ?? 1) * 100)}%
              </div>
              <button
                onClick={() => playSample(ids.death, 'death')}
                className="ml-2 px-2 py-1 bg-gray-700 rounded"
              >
                Play
              </button>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  reset();
                }}
                className="px-3 py-1 bg-gray-600 rounded"
              >
                Reset
              </button>
              <button
                onClick={() => setOpen(false)}
                className="px-3 py-1 bg-[#6C63FF] rounded"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}