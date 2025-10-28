import { useEffect, useState, useRef } from 'react';
import { settingsService, type GameSettings } from '@/components/settings-modal';

export default function Settings() {
  const [open, setOpen] = useState(false);
  const [gameSettings, setGameSettings] = useState<GameSettings>(settingsService.getSettings());
  const [bgmVolume, setBgmVolume] = useState(100);
  const [sfxVolume, setSfxVolume] = useState(100);

  // Audio refs
  const bgmRef = useRef<HTMLAudioElement>(null);
  const death1Ref = useRef<HTMLAudioElement>(null);
  const coin1Ref = useRef<HTMLAudioElement>(null);
  const jump1Ref = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    // Load settings from service
    const settings = settingsService.getSettings();
    setGameSettings(settings);

    // Set up audio elements
    if (bgmRef.current) {
      bgmRef.current.volume = bgmVolume / 100;
      bgmRef.current.loop = true;

      // Auto-play BGM if enabled
      if (settings.bgm.enabled) {
        const playBGM = () => {
          if (bgmRef.current) {
            bgmRef.current.play().catch((error) => {
              console.log('BGM autoplay blocked, will play on user interaction:', error);
            });
          }
        };

        // Try immediate play
        playBGM();

        // Also try on first user interaction
        const handleFirstInteraction = () => {
          playBGM();
          document.removeEventListener('click', handleFirstInteraction);
          document.removeEventListener('keydown', handleFirstInteraction);
        };

        document.addEventListener('click', handleFirstInteraction);
        document.addEventListener('keydown', handleFirstInteraction);
      }
    }

    // Listen for settings changes
    const handleSettingsChange = (newSettings: GameSettings) => {
      setGameSettings(newSettings);
    };

    settingsService.onSettingsChange(handleSettingsChange);

    return () => {
      settingsService.removeSettingsListener(handleSettingsChange);
    };
  }, [bgmVolume]);

  function updateBGMVolume(volume: number) {
    setBgmVolume(volume);
    if (bgmRef.current) {
      bgmRef.current.volume = volume / 100;
    }
  }

  function updateSFXVolume(volume: number) {
    setSfxVolume(volume);
    [death1Ref.current, coin1Ref.current, jump1Ref.current].forEach(audio => {
      if (audio) audio.volume = volume / 100;
    });
  }

  function toggleBGM() {
    settingsService.toggleBGM();
    if (bgmRef.current) {
      if (gameSettings.bgm.enabled) {
        bgmRef.current.pause();
      } else {
        bgmRef.current.play().catch(console.error);
      }
    }
  }

  function playSample(audioRef: React.RefObject<HTMLAudioElement | null>) {
    if (!audioRef.current) return;
    try {
      audioRef.current.currentTime = 0;
      audioRef.current.volume = sfxVolume / 100;
      audioRef.current.play().catch(() => { });
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  }

  function resetSettings() {
    setBgmVolume(100);
    setSfxVolume(100);
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
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #ffffff;
          border: 2px solid #6C63FF;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        
        .slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #ffffff;
          border: 2px solid #6C63FF;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        
        .slider::-webkit-slider-track {
          height: 8px;
          border-radius: 4px;
        }
        
        .slider::-moz-range-track {
          height: 8px;
          border-radius: 4px;
          border: none;
        }
      `}</style>

      {/* Audio Elements */}
      <audio ref={bgmRef} id="bgm" preload="auto" crossOrigin="anonymous">
        <source src="/audio/bgm.mp3" type="audio/mpeg" />
        <source src="/assets/bgm.mp3" type="audio/mpeg" />
        <source src="./audio/bgm.mp3" type="audio/mpeg" />
      </audio>
      <audio ref={death1Ref} id="death1" preload="auto" crossOrigin="anonymous">
        <source src="/audio/death1.mp3" type="audio/mpeg" />
        <source src="/assets/death1.mp3" type="audio/mpeg" />
        <source src="./audio/death1.mp3" type="audio/mpeg" />
      </audio>
      <audio ref={coin1Ref} id="coin1" preload="auto" crossOrigin="anonymous">
        <source src="/audio/coin1.mp3" type="audio/mpeg" />
        <source src="/assets/coin1.mp3" type="audio/mpeg" />
        <source src="./audio/coin1.mp3" type="audio/mpeg" />
      </audio>
      <audio ref={jump1Ref} id="jump1" preload="auto" crossOrigin="anonymous">
        <source src="/audio/jump1.mp3" type="audio/mpeg" />
        <source src="/assets/jump1.mp3" type="audio/mpeg" />
        <source src="./audio/jump1.mp3" type="audio/mpeg" />
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
          onClick={() => {
            console.log('Settings button clicked!');
            setOpen(true);
          }}
          className="px-6 py-3 text-white font-bold text-lg tracking-wider"
          style={{
            textShadow: '2px 2px 0 #4A43AA',
            filter: 'contrast(1.2)',
            cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          ⚙️ SETTINGS
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

      {/* Modal: Centered and more visible */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-black bg-opacity-60 fixed inset-0"
            onClick={() => setOpen(false)}
          />
          <div
            className="relative text-white p-6 rounded-lg shadow-2xl max-w-md w-full mx-4"
            style={{
              background: '#1a1a1a',
              border: '2px solid #6C63FF',
              boxShadow: '0 0 20px rgba(108, 99, 255, 0.3)',
              zIndex: 60
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white mb-2" style={{
                fontFamily: '"Courier New", monospace',
                textShadow: '2px 2px 0 #6C63FF',
                letterSpacing: '2px'
              }}>
                🎮 AUDIO SETTINGS
              </h2>
              <div className="w-full h-1 bg-gradient-to-r from-purple-500 to-orange-500 rounded"></div>
            </div>

            {/* BGM Controls */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label className="text-yellow-300 font-bold text-lg">🎵 Background Music</label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleBGM}
                    className={`px-3 py-1 rounded font-bold text-sm ${gameSettings.bgm.enabled
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-red-600 hover:bg-red-700 text-white'
                      }`}
                  >
                    {gameSettings.bgm.enabled ? '🔊 ON' : '🔇 OFF'}
                  </button>
                  <span className="text-white font-bold text-lg">{bgmVolume}%</span>
                </div>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={bgmVolume}
                onChange={(e) => updateBGMVolume(Number(e.target.value))}
                disabled={!gameSettings.bgm.enabled}
                style={{
                  width: '100%',
                  height: '8px',
                  background: `linear-gradient(to right, #8B5CF6 0%, #8B5CF6 ${bgmVolume}%, #374151 ${bgmVolume}%, #374151 100%)`,
                  borderRadius: '4px',
                  outline: 'none',
                  cursor: gameSettings.bgm.enabled ? 'pointer' : 'not-allowed',
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  opacity: gameSettings.bgm.enabled ? 1 : 0.5,
                }}
                className="slider"
              />
            </div>

            {/* SFX Volume Slider */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label className="text-orange-300 font-bold text-lg">🔊 Sound Effects</label>
                <span className="text-white font-bold text-lg">{sfxVolume}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={sfxVolume}
                onChange={(e) => updateSFXVolume(Number(e.target.value))}
                style={{
                  width: '100%',
                  height: '8px',
                  background: `linear-gradient(to right, #F97316 0%, #F97316 ${sfxVolume}%, #374151 ${sfxVolume}%, #374151 100%)`,
                  borderRadius: '4px',
                  outline: 'none',
                  cursor: 'pointer',
                  appearance: 'none',
                  WebkitAppearance: 'none',
                }}
                className="slider"
              />
            </div>

            {/* BGM Control */}
            <div className="mb-4">
              <div className="text-sm text-gray-300 mb-2">Background Music:</div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (bgmRef.current) {
                      bgmRef.current.play().catch(console.error);
                    }
                  }}
                  className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-xs font-bold"
                >
                  ▶️ Play BGM
                </button>
                <button
                  onClick={() => {
                    if (bgmRef.current) {
                      bgmRef.current.pause();
                    }
                  }}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-xs font-bold"
                >
                  ⏸️ Pause BGM
                </button>
              </div>
            </div>

            {/* Sound Test Buttons */}
            <div className="mb-4">
              <div className="text-sm text-gray-300 mb-2">Test Sound Effects:</div>
              <div className="flex gap-2">
                <button
                  onClick={() => playSample(coin1Ref)}
                  className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 rounded text-xs font-bold"
                >
                  💰 Coin
                </button>
                <button
                  onClick={() => playSample(jump1Ref)}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs font-bold"
                >
                  🦘 Jump
                </button>
                <button
                  onClick={() => playSample(death1Ref)}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-xs font-bold"
                >
                  💀 Death
                </button>
              </div>
            </div>

            {/* Debug Info */}
            <div className="mb-4 p-2 bg-gray-800 rounded text-xs">
              <div>BGM: {gameSettings.bgm.enabled ? 'ON' : 'OFF'} ({bgmVolume}%) | SFX: {sfxVolume}%</div>
              <div>Sounds: Coin({gameSettings.sounds.coinSound}) Jump({gameSettings.sounds.jumpSound}) Death({gameSettings.sounds.deathSound})</div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={resetSettings}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded font-bold transition-colors"
              >
                🔄 Reset
              </button>
              <button
                onClick={() => setOpen(false)}
                className="px-4 py-2 bg-[#6C63FF] hover:bg-[#5A52CC] rounded font-bold transition-colors"
              >
                ✅ Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}