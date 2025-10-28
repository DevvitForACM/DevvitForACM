export interface AudioSettings {
  bgmVolume: number;
  sfxVolume: number;
  bgmEnabled: boolean;
}

const DEFAULT_AUDIO_SETTINGS: AudioSettings = {
  bgmVolume: 100,
  sfxVolume: 100,
  bgmEnabled: true,
};

const AUDIO_SETTINGS_KEY = 'audio_settings';

class AudioManager {
  private bgmAudio: HTMLAudioElement | null = null;
  private settings: AudioSettings;
  private listeners: Array<(settings: AudioSettings) => void> = [];
  private isInitialized = false;

  constructor() {
    this.settings = this.loadSettings();
    this.initializeBGM();
  }

  private loadSettings(): AudioSettings {
    try {
      const stored = localStorage.getItem(AUDIO_SETTINGS_KEY);
      if (stored) {
        const parsedSettings = JSON.parse(stored);
        return { ...DEFAULT_AUDIO_SETTINGS, ...parsedSettings };
      }
    } catch (error) {
      console.error('Failed to load audio settings:', error);
    }
    return { ...DEFAULT_AUDIO_SETTINGS };
  }

  private saveSettings(): void {
    try {
      localStorage.setItem(AUDIO_SETTINGS_KEY, JSON.stringify(this.settings));
    } catch (error) {
      console.error('Failed to save audio settings:', error);
    }
  }

  private initializeBGM(): void {
    if (this.isInitialized) return;

    this.bgmAudio = new Audio();
    this.bgmAudio.src = '/assets/audio/bgmdummy.mp3';
    this.bgmAudio.loop = true;
    this.bgmAudio.volume = this.settings.bgmVolume / 100;
    this.bgmAudio.preload = 'auto';

    // Handle audio loading
    this.bgmAudio.addEventListener('canplaythrough', () => {
      if (this.settings.bgmEnabled) {
        this.playBGM();
      }
    });

    this.bgmAudio.addEventListener('error', (e) => {
      console.error('BGM loading error:', e);
      // Try alternative paths if the first one fails
      if (this.bgmAudio) {
        this.bgmAudio.src = '/audio/bgmdummy.mp3';
      }
    });

    this.isInitialized = true;

    // Try to start BGM immediately if enabled
    if (this.settings.bgmEnabled) {
      this.playBGM();
    }

    // Also try to start BGM on first user interaction
    this.setupUserInteractionHandler();
  }

  private setupUserInteractionHandler(): void {
    const handleFirstInteraction = () => {
      if (this.settings.bgmEnabled && this.bgmAudio) {
        this.playBGM();
      }
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
    };

    document.addEventListener('click', handleFirstInteraction);
    document.addEventListener('keydown', handleFirstInteraction);
    document.addEventListener('touchstart', handleFirstInteraction);
  }

  public getSettings(): AudioSettings {
    return { ...this.settings };
  }

  public setBGMVolume(volume: number): void {
    this.settings.bgmVolume = Math.max(0, Math.min(100, volume));
    if (this.bgmAudio) {
      this.bgmAudio.volume = this.settings.bgmVolume / 100;
    }
    this.saveSettings();
    this.notifyListeners();
  }

  public setSFXVolume(volume: number): void {
    this.settings.sfxVolume = Math.max(0, Math.min(100, volume));
    this.saveSettings();
    this.notifyListeners();
  }

  public toggleBGM(): void {
    this.settings.bgmEnabled = !this.settings.bgmEnabled;
    
    if (this.bgmAudio) {
      if (this.settings.bgmEnabled) {
        this.playBGM();
      } else {
        this.bgmAudio.pause();
      }
    }
    
    this.saveSettings();
    this.notifyListeners();
  }

  public setBGMEnabled(enabled: boolean): void {
    this.settings.bgmEnabled = enabled;
    
    if (this.bgmAudio) {
      if (enabled) {
        this.playBGM();
      } else {
        this.bgmAudio.pause();
      }
    }
    
    this.saveSettings();
    this.notifyListeners();
  }

  private playBGM(): void {
    if (this.bgmAudio && this.settings.bgmEnabled) {
      this.bgmAudio.play().catch((error) => {
        console.log('BGM autoplay blocked:', error);
      });
    }
  }

  public pauseBGM(): void {
    if (this.bgmAudio) {
      this.bgmAudio.pause();
    }
  }

  public resumeBGM(): void {
    if (this.settings.bgmEnabled) {
      this.playBGM();
    }
  }

  public createSFXAudio(src: string): HTMLAudioElement {
    const audio = new Audio(src);
    audio.volume = this.settings.sfxVolume / 100;
    return audio;
  }

  public playSFX(src: string): void {
    const audio = this.createSFXAudio(src);
    audio.play().catch((error) => {
      console.error('SFX play error:', error);
    });
  }

  public onSettingsChange(callback: (settings: AudioSettings) => void): void {
    this.listeners.push(callback);
    callback(this.settings);
  }

  public removeSettingsListener(callback: (settings: AudioSettings) => void): void {
    const index = this.listeners.indexOf(callback);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  public getBGMAudio(): HTMLAudioElement | null {
    return this.bgmAudio;
  }

  public isBGMPlaying(): boolean {
    return this.bgmAudio ? !this.bgmAudio.paused : false;
  }

  private notifyListeners(): void {
    this.listeners.forEach((callback) => {
      try {
        callback(this.settings);
      } catch (error) {
        console.error('Audio settings listener error:', error);
      }
    });
  }
}

export const audioManager = new AudioManager();