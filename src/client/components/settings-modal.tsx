import { useState, useEffect } from 'react';
import { settingsService, GameSettings } from '@/services/settings.service';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [settings, setSettings] = useState<GameSettings>(
    settingsService.getSettings()
  );

  useEffect(() => {
    const handleSettingsChange = (newSettings: GameSettings) => {
      setSettings(newSettings);
    };

    settingsService.onSettingsChange(handleSettingsChange);

    return () => {
      settingsService.removeSettingsListener(handleSettingsChange);
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg p-8 w-full max-w-md relative transform transition-all"
        onClick={(e) => e.stopPropagation()}
        style={{
          boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
        }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl font-bold"
          style={{ fontFamily: '"Courier New", monospace' }}
        >
          ×
        </button>

        <h2
          className="text-3xl font-bold mb-6 text-center"
          style={{
            fontFamily: '"Courier New", monospace',
            textShadow: '2px 2px 0 #ccc',
          }}
        >
          SETTINGS
        </h2>

        {/* BGM Section */}
        <div className="mb-6">
          <div
            className="flex items-center justify-between mb-4"
            style={{ fontFamily: '"Courier New", monospace' }}
          >
            <span className="text-lg font-bold">Background Music</span>
            <button
              onClick={() => settingsService.toggleBGM()}
              className={`px-6 py-2 rounded font-bold transition-all ${
                settings.bgm.enabled
                  ? 'bg-green-500 text-white hover:bg-green-600'
                  : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
              }`}
              style={{ fontFamily: '"Courier New", monospace' }}
            >
              {settings.bgm.enabled ? 'ON' : 'OFF'}
            </button>
          </div>
          <div
            className="text-sm text-gray-600 italic"
            style={{ fontFamily: '"Courier New", monospace' }}
          >
            File: bgmdummy.mp3
          </div>
        </div>

        {/* Theme Section */}
        <div className="mb-6">
          <h3
            className="text-xl font-bold mb-4"
            style={{
              fontFamily: '"Courier New", monospace',
              textShadow: '1px 1px 0 #ccc',
            }}
          >
            THEME SOUNDS
          </h3>

          {/* Coin Sound */}
          <div className="mb-4">
            <label
              className="block text-sm font-bold mb-2"
              style={{ fontFamily: '"Courier New", monospace' }}
            >
              Coin Collecting Sound
            </label>
            <div className="flex gap-2">
              {(['coin1.mp3', 'coin2.mp3'] as const).map((sound) => (
                <button
                  key={sound}
                  onClick={() => settingsService.setCoinSound(sound)}
                  className={`px-4 py-2 rounded font-bold transition-all ${
                    settings.sounds.coinSound === sound
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                  style={{ fontFamily: '"Courier New", monospace' }}
                >
                  {sound}
                </button>
              ))}
            </div>
          </div>

          {/* Death Sound */}
          <div className="mb-4">
            <label
              className="block text-sm font-bold mb-2"
              style={{ fontFamily: '"Courier New", monospace' }}
            >
              Death Sound
            </label>
            <div className="flex gap-2">
              {(['death1.mp3', 'death2.mp3'] as const).map((sound) => (
                <button
                  key={sound}
                  onClick={() => settingsService.setDeathSound(sound)}
                  className={`px-4 py-2 rounded font-bold transition-all ${
                    settings.sounds.deathSound === sound
                      ? 'bg-red-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                  style={{ fontFamily: '"Courier New", monospace' }}
                >
                  {sound}
                </button>
              ))}
            </div>
          </div>

          {/* Jump Sound */}
          <div className="mb-4">
            <label
              className="block text-sm font-bold mb-2"
              style={{ fontFamily: '"Courier New", monospace' }}
            >
              Jump Sound
            </label>
            <div className="flex gap-2">
              {(['jump1.mp3', 'jump2.mp3', 'jump3.mp3'] as const).map(
                (sound) => (
                  <button
                    key={sound}
                    onClick={() => settingsService.setJumpSound(sound)}
                    className={`px-4 py-2 rounded font-bold transition-all text-sm ${
                      settings.sounds.jumpSound === sound
                        ? 'bg-purple-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                    style={{ fontFamily: '"Courier New", monospace' }}
                  >
                    {sound}
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

