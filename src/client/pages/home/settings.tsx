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
        className="relative inline-block rounded-md transition-transform hover:scale-110 active:scale-95 cursor-pointer font-mono"
        style={{
          background: '#6C63FF',
          boxShadow: 'inset 3px 3px 0 #8B88FF, inset -3px -3px 0 #5A52CC, 3px 3px 0 #4A43AA',
          imageRendering: 'pixelated',
        }}
      >
        <div
          className="px-3 py-2 sm:px-6 sm:py-3 text-white font-bold text-sm sm:text-base md:text-lg tracking-wider select-none"
          style={{
            textShadow: '2px 2px 0 #4A43AA',
            filter: 'contrast(1.2)',
          }}
        >
          ⚙️ SETTINGS
        </div>
      </button>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 flex items-center justify-center z-[9999] bg-black/85"
          onClick={(e) => {
            // Only close if clicking the backdrop, not the modal content
            if (e.target === e.currentTarget) {
              setOpen(false);
            }
          }}
        >
          <div
            className="relative text-white p-4 sm:p-6 md:p-8 max-w-md w-full mx-2 sm:mx-4 bg-[#2A2A2A] font-mono max-h-[90vh] overflow-y-auto"
            style={{
              boxShadow: 'inset 4px 4px 0 #444, inset -4px -4px 0 #111, 6px 6px 0 #000',
              imageRendering: 'pixelated',
            }}
          >
            {/* Title */}
            <div className="text-center mb-6">
              <h2
                className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2 tracking-[3px]"
                style={{
                  textShadow: '3px 3px 0 #333',
                  imageRendering: 'pixelated',
                }}
              >
                🎮 AUDIO SETTINGS
              </h2>
            </div>

            {/* BGM Volume */}
            <div className="mb-6">
              <label className="block mb-3">
                <div className="flex justify-between items-center mb-2">
                  <span
                    className="text-yellow-300 font-bold text-base sm:text-lg"
                    style={{ textShadow: '2px 2px 0 #B8860B' }}
                  >
                    🎵 MUSIC VOLUME
                  </span>
                  <span className="text-white font-bold text-lg">{settings.bgmVolume}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={settings.bgmVolume}
                  onChange={(e) => handleBGMChange(Number(e.target.value))}
                  onInput={(e) => handleBGMChange(Number((e.target as HTMLInputElement).value))}
                  className="w-full h-3 rounded appearance-none cursor-pointer slider-bgm"
                  style={{
                    background: `linear-gradient(to right, #4CAF50 0%, #4CAF50 ${settings.bgmVolume}%, #444 ${settings.bgmVolume}%, #444 100%)`,
                  }}
                />
              </label>
            </div>

            {/* SFX Volume */}
            <div className="mb-6">
              <label className="block mb-3">
                <div className="flex justify-between items-center mb-2">
                  <span
                    className="text-yellow-300 font-bold text-base sm:text-lg"
                    style={{ textShadow: '2px 2px 0 #B8860B' }}
                  >
                    🔊 SOUND EFFECTS
                  </span>
                  <span className="text-white font-bold text-lg">{settings.sfxVolume}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={settings.sfxVolume}
                  onChange={(e) => handleSFXChange(Number(e.target.value))}
                  onInput={(e) => handleSFXChange(Number((e.target as HTMLInputElement).value))}
                  className="w-full h-3 rounded appearance-none cursor-pointer slider-sfx"
                  style={{
                    background: `linear-gradient(to right, #FF9800 0%, #FF9800 ${settings.sfxVolume}%, #444 ${settings.sfxVolume}%, #444 100%)`,
                  }}
                />
              </label>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setOpen(false)}
              className="w-full px-6 py-3 text-white font-bold text-lg tracking-wider transition-transform hover:scale-105 active:translate-y-1 bg-[#F44336]"
              style={{
                boxShadow: 'inset 3px 3px 0 #EF5350, inset -3px -3px 0 #C62828, 3px 3px 0 #B71C1C',
                textShadow: '2px 2px 0 #B71C1C',
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
