import { useEffect, useState } from 'react';
import { audioManager, type AudioSettings } from '@/services/audio-manager';
import './settings.css';

export default function Settings() {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<AudioSettings>(audioManager.getSettings());

  useEffect(() => {
    const handleSettingsChange = (newSettings: AudioSettings) => {
      setSettings(newSettings);
    };

    audioManager.onSettingsChange(handleSettingsChange);
    return () => audioManager.offSettingsChange(handleSettingsChange);
  }, []);

  // When settings panel opens, ensure BGM is playing so user can hear volume changes
  useEffect(() => {
    if (open) {
      audioManager.playBGM();
    }
  }, [open]);

  const handleBGMChange = (value: number) => {
    console.log('[Settings] BGM volume changed to:', value);
    audioManager.setBGMVolume(value);
  };

  const handleSFXChange = (value: number) => {
    console.log('[Settings] SFX volume changed to:', value);
    audioManager.setSFXVolume(value);
  };

  return (
    <>
      {/* Settings Button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative inline-block hover:brightness-110 active:translate-y-1 transition-all cursor-pointer"
        style={{
          background: '#6b7280',
          border: 'none',
          boxShadow: 'inset 3px 3px 0 #9ca3af, inset -3px -3px 0 #4b5563, 3px 3px 0 #374151',
          fontFamily: '"Courier New", monospace',
          imageRendering: 'pixelated',
        }}
      >
        <div
          className="px-3 py-2 sm:px-6 sm:py-3 text-white font-bold text-sm sm:text-base md:text-lg tracking-wider select-none uppercase"
          style={{
            textShadow: '2px 2px 0 #000',
          }}
        >
          ⚙️ SETTINGS
        </div>
      </button>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 flex items-center justify-center z-[9999] bg-black/75"
          onClick={(e) => {
            // Only close if clicking the backdrop, not the modal content
            if (e.target === e.currentTarget) {
              setOpen(false);
            }
          }}
          style={{
            fontFamily: '"Courier New", monospace',
            imageRendering: 'pixelated',
          }}
        >
          <div
            className="relative text-white p-4 sm:p-6 md:p-8 max-w-md w-full mx-2 sm:mx-4 max-h-[90vh] overflow-y-auto"
            style={{
              background: '#1f2937',
              border: '4px solid #000',
              boxShadow: 'inset 4px 4px 0 #374151, inset -4px -4px 0 #111827, 8px 8px 0 #000',
              imageRendering: 'pixelated',
            }}
          >
            {/* Title */}
            <div className="text-center mb-6 sm:mb-8">
              <h2
                className="text-2xl sm:text-3xl md:text-4xl font-bold text-yellow-300 mb-2 tracking-[3px] uppercase"
                style={{
                  textShadow: '3px 3px 0 #000',
                  imageRendering: 'pixelated',
                }}
              >
                🎮 AUDIO SETTINGS
              </h2>
            </div>

            {/* BGM Volume */}
            <div className="mb-6 sm:mb-8">
              <label className="block mb-3">
                <div className="flex justify-between items-center mb-3">
                  <span
                    className="text-yellow-300 font-bold text-base sm:text-lg uppercase tracking-wide"
                    style={{ textShadow: '2px 2px 0 #000' }}
                  >
                    🎵 MUSIC
                  </span>
                  <span
                    className="text-white font-bold text-lg px-3 py-1"
                    style={{
                      background: '#4b5563',
                      boxShadow: 'inset 2px 2px 0 #6b7280, 2px 2px 0 #374151',
                      textShadow: '2px 2px 0 #000',
                    }}
                  >
                    {settings.bgmVolume}%
                  </span>
                </div>
                <div
                  style={{
                    background: '#111827',
                    border: '3px solid #000',
                    boxShadow: 'inset 2px 2px 0 #1f2937',
                    padding: '4px',
                  }}
                >
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={settings.bgmVolume}
                    onChange={(e) => handleBGMChange(Number(e.target.value))}
                    onInput={(e) => handleBGMChange(Number((e.target as HTMLInputElement).value))}
                    className="w-full h-3 appearance-none cursor-pointer slider-bgm"
                    style={{
                      background: `linear-gradient(to right, #10b981 0%, #10b981 ${settings.bgmVolume}%, #374151 ${settings.bgmVolume}%, #374151 100%)`,
                    }}
                  />
                </div>
              </label>
            </div>

            {/* SFX Volume */}
            <div className="mb-6 sm:mb-8">
              <label className="block mb-3">
                <div className="flex justify-between items-center mb-3">
                  <span
                    className="text-yellow-300 font-bold text-base sm:text-lg uppercase tracking-wide"
                    style={{ textShadow: '2px 2px 0 #000' }}
                  >
                    🔊 SFX
                  </span>
                  <span
                    className="text-white font-bold text-lg px-3 py-1"
                    style={{
                      background: '#4b5563',
                      boxShadow: 'inset 2px 2px 0 #6b7280, 2px 2px 0 #374151',
                      textShadow: '2px 2px 0 #000',
                    }}
                  >
                    {settings.sfxVolume}%
                  </span>
                </div>
                <div
                  style={{
                    background: '#111827',
                    border: '3px solid #000',
                    boxShadow: 'inset 2px 2px 0 #1f2937',
                    padding: '4px',
                  }}
                >
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={settings.sfxVolume}
                    onChange={(e) => handleSFXChange(Number(e.target.value))}
                    onInput={(e) => handleSFXChange(Number((e.target as HTMLInputElement).value))}
                    className="w-full h-3 appearance-none cursor-pointer slider-sfx"
                    style={{
                      background: `linear-gradient(to right, #f59e0b 0%, #f59e0b ${settings.sfxVolume}%, #374151 ${settings.sfxVolume}%, #374151 100%)`,
                    }}
                  />
                </div>
              </label>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setOpen(false)}
              className="w-full px-6 py-3 text-white font-bold text-lg tracking-wider hover:brightness-110 active:translate-y-1 transition-all uppercase"
              style={{
                background: '#dc2626',
                border: 'none',
                boxShadow: 'inset 3px 3px 0 #ef4444, inset -3px -3px 0 #991b1b, 3px 3px 0 #7f1d1d',
                textShadow: '2px 2px 0 #000',
              }}
            >
              ✕ CLOSE
            </button>
          </div>
        </div>
      )}
    </>
  );
}
