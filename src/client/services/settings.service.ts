export interface GameSettings {
  bgm: {
    enabled: boolean;
  };
  sounds: {
    coinSound: 'coin1.mp3' | 'coin2.mp3';
    deathSound: 'death1.mp3' | 'death2.mp3';
    jumpSound: 'jump1.mp3' | 'jump2.mp3' | 'jump3.mp3';
  };
}

const DEFAULT_SETTINGS: GameSettings = {
  bgm: {
    enabled: true,
  },
  sounds: {
    coinSound: 'coin1.mp3',
    deathSound: 'death1.mp3',
    jumpSound: 'jump1.mp3',
  },
};

const SETTINGS_STORAGE_KEY = 'game_settings';

class SettingsService {
  private settings!: GameSettings;
  private listeners: Array<(settings: GameSettings) => void> = [];

  constructor() {
    this.loadSettings();
  }

  public getSettings(): GameSettings {
    return { ...this.settings };
  }

  public updateSettings(newSettings: Partial<GameSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    this.saveSettings();
    this.notifyListeners();
  }

  public toggleBGM(): void {
    this.settings.bgm.enabled = !this.settings.bgm.enabled;
    this.saveSettings();
    this.notifyListeners();
  }

  public setCoinSound(sound: 'coin1.mp3' | 'coin2.mp3'): void {
    this.settings.sounds.coinSound = sound;
    this.saveSettings();
    this.notifyListeners();
  }

  public setDeathSound(sound: 'death1.mp3' | 'death2.mp3'): void {
    this.settings.sounds.deathSound = sound;
    this.saveSettings();
    this.notifyListeners();
  }

  public setJumpSound(sound: 'jump1.mp3' | 'jump2.mp3' | 'jump3.mp3'): void {
    this.settings.sounds.jumpSound = sound;
    this.saveSettings();
    this.notifyListeners();
  }

  public onSettingsChange(callback: (settings: GameSettings) => void): void {
    this.listeners.push(callback);
    callback(this.settings);
  }

  public removeSettingsListener(
    callback: (settings: GameSettings) => void
  ): void {
    const index = this.listeners.indexOf(callback);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  private loadSettings(): void {
    try {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (stored) {
        const parsedSettings = JSON.parse(stored);
        this.settings = { ...DEFAULT_SETTINGS, ...parsedSettings };
      } else {
        this.settings = { ...DEFAULT_SETTINGS };
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      this.settings = { ...DEFAULT_SETTINGS };
    }
  }

  private saveSettings(): void {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(this.settings));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach((callback) => {
      try {
        callback(this.settings);
      } catch (error) {
        console.error('Settings listener error:', error);
      }
    });
  }
}

export const settingsService = new SettingsService();