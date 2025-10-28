import { useEffect, useState, useRef } from 'react';
import { settingsService, type GameSettings } from '@/components/settings-modal';
import { audioManager, type AudioSettings } from '../../services/audio-manager';

export default function Settings() {
  const [open, setOpen] = useState(false);

  const [audioSettings, setAudioSettings] = useState<AudioSettings>(audioManager.getSettings());

  // Audio refs for SFX testing
  const death1Ref = useRef<HTMLAudioElement>(null);
  const coin1Ref = useRef<HTMLAudioElement>(null);
  const jump1Ref = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    // Ensure BGM is enabled by default
    settingsService.updateSettings({
      bgm: { enabled: true },
      sounds: {
        coinSound: 'coin1.mp3',
        deathSound: 'death1.mp3',
        jumpSound: 'jump1.mp3',
      }
    });

    // Load settings from services
    settingsService.getSettings();

    // Set up SFX audio elements with current volume
    [death1Ref.current, coin1Ref.current, jump1Ref.current].forEach(audio => {
      if (audio) {
        audio.volume = audioSettings.sfxVolume / 100;
      }
    });

    // Listen for audio settings changes
    const handleAudioSettingsChange = (newAudioSettings: AudioSettings) => {
      setAudioSettings(newAudioSettings);
      // Update SFX volumes
      [death1Ref.current, coin1Ref.current, jump1Ref.current].forEach(audio => {
        if (audio) {
          audio.volume = newAudioSettings.sfxVolume / 100;
        }
      });
    };

    audioManager.onSettingsChange(handleAudioSettingsChange);

    return () => {
      audioManager.removeSettingsListener(handleAudioSettingsChange);
    };
  }, []);

  function updateBGMVolume(volume: number) {
    audioManager.setBGMVolume(volume);
  }

  function updateSFXVolume(volume: number) {
    audioManager.setSFXVolume(volume);
  }

  function toggleBGM() {
    audioManager.toggleBGM();
  }

  function playSample(audioRef: React.RefObject<HTMLAudioElement | null>) {
    if (!audioRef.current) return;
    try {
      audioRef.current.currentTime = 0;
      audioRef.current.volume = audioSettings.sfxVolume / 100;
      audioRef.current.play().catch(() => { });
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  }

  function resetSettings() {
    audioManager.setBGMVolume(100);
    audioManager.setSFXVolume(100);
    audioManager.setBGMEnabled(true);
    settingsService.updateSettings({
      bgm: { enabled: true },
      sounds: {
        coinSound: 'coin1.mp3',
        deathSound: 'death1.mp3',
        jumpSound: 'jump1.mp3',
      }
    });
  }

  return (
    <>
      {/* Slider Styles */}
      <style>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 24px;
          height: 24px;
          background: #ffffff;
          border: none;
          cursor: pointer;
          box-shadow: inset 2px 2px 0 #f0f0f0, inset -2px -2px 0 #ccc, 2px 2px 0 #999;
          image-rendering: pixelated;
        }
        
        .slider::-moz-range-thumb {
          width: 24px;
          height: 24px;
          background: #ffffff;
          border: none;
          cursor: pointer;
          box-shadow: inset 2px 2px 0 #f0f0f0, inset -2px -2px 0 #ccc, 2px 2px 0 #999;
          image-rendering: pixelated;
        }
        
        .slider::-webkit-slider-track {
          height: 12px;
          border: none;
          image-rendering: pixelated;
        }
        
        .slider::-moz-range-track {
          height: 12px;
          border: none;
          image-rendering: pixelated;
        }
      `}</style>

      {/* SFX Audio Elements */}
      <audio ref={death1Ref} id="death1" preload="auto" crossOrigin="anonymous">
        <source src="/assets/audio/death1.mp3" type="audio/mpeg" />
        <source src="/audio/death1.mp3" type="audio/mpeg" />
      </audio>
      <audio ref={coin1Ref} id="coin1" preload="auto" crossOrigin="anonymous">
        <source src="/assets/audio/coin1.mp3" type="audio/mpeg" />
        <source src="/audio/coin1.mp3" type="audio/mpeg" />
      </audio>
      <audio ref={jump1Ref} id="jump1" preload="auto" crossOrigin="anonymous">
        <source src="/assets/audio/jump1.mp3" type="audio/mpeg" />
        <source src="/audio/jump1.mp3" type="audio/mpeg" />
      </audio>

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
          onClick={() => setOpen(!open)}
          className="px-6 py-3 text-white font-bold text-lg tracking-wider relative"
          style={{
            textShadow: '2px 2px 0 #4A43AA',
            filter: 'contrast(1.2)',
            cursor: 'pointer',
            userSelect: 'none',
            zIndex: 10,
          }}
        >
          ⚙️ SETTINGS
        </div>

        {/* decorative overlays preserved from original - with pointer-events: none */}
        <div
          className="absolute inset-0 bg-white opacity-0 hover:opacity-10 transition-opacity duration-100"
          style={{ pointerEvents: 'none' }}
        />
        <div
          className="absolute top-0 left-0 w-full h-1 bg-white opacity-30"
          style={{ imageRendering: 'pixelated', pointerEvents: 'none' }}
        />
        <div
          className="absolute top-0 left-0 w-1 h-full bg-white opacity-30"
          style={{ imageRendering: 'pixelated', pointerEvents: 'none' }}
        />
      </div>

      {/* Modal: Centered and more visible */}
      {open && (
        <div
          className="fixed inset-0 flex items-center justify-center"
          style={{
            zIndex: 9999,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
          }}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="absolute inset-0"
            onClick={() => setOpen(false)}
          />
          <div
            className="relative text-white p-8 max-w-lg w-full mx-4"
            style={{
              background: '#2A2A2A',
              border: 'none',
              boxShadow: 'inset 4px 4px 0 #444, inset -4px -4px 0 #111, 6px 6px 0 #000',
              fontFamily: '"Courier New", monospace',
              imageRendering: 'pixelated',
              zIndex: 10000,
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Pixel highlight effects */}
            <div
              className="absolute top-0 left-0 w-full h-1 bg-white opacity-30"
              style={{ imageRendering: 'pixelated' }}
            ></div>
            <div
              className="absolute top-0 left-0 w-1 h-full bg-white opacity-30"
              style={{ imageRendering: 'pixelated' }}
            ></div>

            <div className="text-center mb-8">
              <h2
                className="text-4xl font-bold text-white mb-4 transform hover:scale-105 transition-transform duration-300"
                style={{
                  fontFamily: '"Courier New", monospace',
                  textShadow: '4px 4px 0 #333, 8px 8px 0 #666',
                  letterSpacing: '6px',
                  imageRendering: 'pixelated',
                  filter: 'contrast(1.3) brightness(1.1)',
                }}
              >
                🎮 SETTINGS
              </h2>
              <div
                className="text-lg font-bold text-yellow-300 tracking-wider"
                style={{
                  fontFamily: '"Courier New", monospace',
                  textShadow: '2px 2px 0 #B8860B, 4px 4px 0 #8B6914',
                  letterSpacing: '3px',
                }}
              >
                AUDIO CONTROLS
              </div>
            </div>

            {/* BGM Controls */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div
                  className="text-yellow-300 font-bold text-xl tracking-wider"
                  style={{
                    fontFamily: '"Courier New", monospace',
                    textShadow: '2px 2px 0 #B8860B',
                    filter: 'contrast(1.2)',
                  }}
                >
                  🎵 BACKGROUND MUSIC
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={toggleBGM}
                    className="relative group transform transition-transform hover:scale-105 active:translate-y-1"
                    style={{
                      background: audioSettings.bgmEnabled ? '#4CAF50' : '#F44336',
                      border: 'none',
                      boxShadow: audioSettings.bgmEnabled
                        ? 'inset 2px 2px 0 #66BB6A, inset -2px -2px 0 #2E7D32, 3px 3px 0 #1B5E20'
                        : 'inset 2px 2px 0 #EF5350, inset -2px -2px 0 #C62828, 3px 3px 0 #B71C1C',
                      fontFamily: '"Courier New", monospace',
                      imageRendering: 'pixelated',
                    }}
                  >
                    <div
                      className="px-4 py-2 text-white font-bold text-sm tracking-wider"
                      style={{
                        textShadow: audioSettings.bgmEnabled ? '1px 1px 0 #1B5E20' : '1px 1px 0 #B71C1C',
                        filter: 'contrast(1.2)',
                      }}
                    >
                      {audioSettings.bgmEnabled ? '🔊 ON' : '🔇 OFF'}
                    </div>
                  </button>
                  <div
                    className="text-white font-bold text-xl tracking-wider"
                    style={{
                      fontFamily: '"Courier New", monospace',
                      textShadow: '2px 2px 0 #333',
                      filter: 'contrast(1.2)',
                    }}
                  >
                    {audioSettings.bgmVolume}%
                  </div>
                </div>
              </div>
              <div
                className="relative p-3"
                style={{
                  background: '#1A1A1A',
                  border: 'none',
                  boxShadow: 'inset 3px 3px 0 #333, inset -3px -3px 0 #000',
                  imageRendering: 'pixelated',
                }}
              >
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={audioSettings.bgmVolume}
                  onChange={(e) => updateBGMVolume(Number(e.target.value))}
                  disabled={!audioSettings.bgmEnabled}
                  style={{
                    width: '100%',
                    height: '12px',
                    background: `linear-gradient(to right, #8B5CF6 0%, #8B5CF6 ${audioSettings.bgmVolume}%, #444 ${audioSettings.bgmVolume}%, #444 100%)`,
                    outline: 'none',
                    cursor: audioSettings.bgmEnabled ? 'pointer' : 'not-allowed',
                    appearance: 'none',
                    WebkitAppearance: 'none',
                    opacity: audioSettings.bgmEnabled ? 1 : 0.5,
                  }}
                  className="slider"
                />
              </div>
            </div>

            {/* SFX Volume Slider */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div
                  className="text-orange-300 font-bold text-xl tracking-wider"
                  style={{
                    fontFamily: '"Courier New", monospace',
                    textShadow: '2px 2px 0 #E65100',
                    filter: 'contrast(1.2)',
                  }}
                >
                  🔊 SOUND EFFECTS
                </div>
                <div
                  className="text-white font-bold text-xl tracking-wider"
                  style={{
                    fontFamily: '"Courier New", monospace',
                    textShadow: '2px 2px 0 #333',
                    filter: 'contrast(1.2)',
                  }}
                >
                  {audioSettings.sfxVolume}%
                </div>
              </div>
              <div
                className="relative p-3"
                style={{
                  background: '#1A1A1A',
                  border: 'none',
                  boxShadow: 'inset 3px 3px 0 #333, inset -3px -3px 0 #000',
                  imageRendering: 'pixelated',
                }}
              >
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={audioSettings.sfxVolume}
                  onChange={(e) => updateSFXVolume(Number(e.target.value))}
                  style={{
                    width: '100%',
                    height: '12px',
                    background: `linear-gradient(to right, #FF9800 0%, #FF9800 ${audioSettings.sfxVolume}%, #444 ${audioSettings.sfxVolume}%, #444 100%)`,
                    outline: 'none',
                    cursor: 'pointer',
                    appearance: 'none',
                    WebkitAppearance: 'none',
                  }}
                  className="slider"
                />
              </div>
            </div>

            {/* Sound Test Buttons */}
            <div className="mb-8">
              <div
                className="text-white font-bold text-lg tracking-wider mb-4"
                style={{
                  fontFamily: '"Courier New", monospace',
                  textShadow: '2px 2px 0 #333',
                  filter: 'contrast(1.2)',
                }}
              >
                🎵 TEST SOUNDS
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => playSample(coin1Ref)}
                  className="relative group transform transition-transform hover:scale-105 active:translate-y-1"
                  style={{
                    background: '#FFD700',
                    border: 'none',
                    boxShadow: 'inset 3px 3px 0 #FFED4E, inset -3px -3px 0 #B8860B, 3px 3px 0 #8B6914',
                    fontFamily: '"Courier New", monospace',
                    imageRendering: 'pixelated',
                  }}
                >
                  <div
                    className="px-4 py-3 text-black font-bold text-sm tracking-wider"
                    style={{
                      textShadow: '1px 1px 0 #FFED4E',
                      filter: 'contrast(1.2)',
                    }}
                  >
                    💰 COIN
                  </div>
                </button>
                <button
                  onClick={() => playSample(jump1Ref)}
                  className="relative group transform transition-transform hover:scale-105 active:translate-y-1"
                  style={{
                    background: '#2196F3',
                    border: 'none',
                    boxShadow: 'inset 3px 3px 0 #64B5F6, inset -3px -3px 0 #1565C0, 3px 3px 0 #0D47A1',
                    fontFamily: '"Courier New", monospace',
                    imageRendering: 'pixelated',
                  }}
                >
                  <div
                    className="px-4 py-3 text-white font-bold text-sm tracking-wider"
                    style={{
                      textShadow: '1px 1px 0 #0D47A1',
                      filter: 'contrast(1.2)',
                    }}
                  >
                    🦘 JUMP
                  </div>
                </button>
                <button
                  onClick={() => playSample(death1Ref)}
                  className="relative group transform transition-transform hover:scale-105 active:translate-y-1"
                  style={{
                    background: '#F44336',
                    border: 'none',
                    boxShadow: 'inset 3px 3px 0 #EF5350, inset -3px -3px 0 #C62828, 3px 3px 0 #B71C1C',
                    fontFamily: '"Courier New", monospace',
                    imageRendering: 'pixelated',
                  }}
                >
                  <div
                    className="px-4 py-3 text-white font-bold text-sm tracking-wider"
                    style={{
                      textShadow: '1px 1px 0 #B71C1C',
                      filter: 'contrast(1.2)',
                    }}
                  >
                    💀 DEATH
                  </div>
                </button>
                <button
                  onClick={() => {
                    const bgmAudio = audioManager.getBGMAudio();
                    if (bgmAudio) {
                      if (bgmAudio.paused) {
                        bgmAudio.play().catch(console.error);
                      } else {
                        bgmAudio.pause();
                      }
                    }
                  }}
                  className="relative group transform transition-transform hover:scale-105 active:translate-y-1"
                  style={{
                    background: '#9C27B0',
                    border: 'none',
                    boxShadow: 'inset 3px 3px 0 #BA68C8, inset -3px -3px 0 #6A1B9A, 3px 3px 0 #4A148C',
                    fontFamily: '"Courier New", monospace',
                    imageRendering: 'pixelated',
                  }}
                >
                  <div
                    className="px-4 py-3 text-white font-bold text-sm tracking-wider"
                    style={{
                      textShadow: '1px 1px 0 #4A148C',
                      filter: 'contrast(1.2)',
                    }}
                  >
                    🎵 BGM
                  </div>
                </button>
              </div>
            </div>

            <div className="flex justify-center gap-6">
              <button
                onClick={resetSettings}
                className="relative group transform transition-transform hover:scale-105 active:translate-y-1"
                style={{
                  background: '#607D8B',
                  border: 'none',
                  boxShadow: 'inset 4px 4px 0 #90A4AE, inset -4px -4px 0 #37474F, 4px 4px 0 #263238',
                  fontFamily: '"Courier New", monospace',
                  imageRendering: 'pixelated',
                }}
              >
                <div
                  className="px-6 py-4 text-white font-bold text-lg tracking-wider"
                  style={{
                    textShadow: '2px 2px 0 #263238',
                    filter: 'contrast(1.2)',
                  }}
                >
                  🔄 RESET
                </div>
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-100"></div>
                <div
                  className="absolute top-0 left-0 w-full h-1 bg-white opacity-30"
                  style={{ imageRendering: 'pixelated' }}
                ></div>
                <div
                  className="absolute top-0 left-0 w-1 h-full bg-white opacity-30"
                  style={{ imageRendering: 'pixelated' }}
                ></div>
              </button>
              <button
                onClick={() => setOpen(false)}
                className="relative group transform transition-transform hover:scale-105 active:translate-y-1"
                style={{
                  background: '#6C63FF',
                  border: 'none',
                  boxShadow: 'inset 4px 4px 0 #8B88FF, inset -4px -4px 0 #5A52CC, 4px 4px 0 #4A43AA',
                  fontFamily: '"Courier New", monospace',
                  imageRendering: 'pixelated',
                }}
              >
                <div
                  className="px-6 py-4 text-white font-bold text-lg tracking-wider"
                  style={{
                    textShadow: '2px 2px 0 #4A43AA',
                    filter: 'contrast(1.2)',
                  }}
                >
                  ✅ CLOSE
                </div>
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-100"></div>
                <div
                  className="absolute top-0 left-0 w-full h-1 bg-white opacity-30"
                  style={{ imageRendering: 'pixelated' }}
                ></div>
                <div
                  className="absolute top-0 left-0 w-1 h-full bg-white opacity-30"
                  style={{ imageRendering: 'pixelated' }}
                ></div>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}