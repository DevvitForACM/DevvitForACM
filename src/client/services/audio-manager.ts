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

  public startBGMWithFadeIn(duration: number = 3000): void {
    if (!this.settings.bgmEnabled || !this.bgmAudio) return;

    // Set volume to 0 initially
    this.bgmAudio.volume = 0;

    // Start playing
    this.bgmAudio.play().catch((error) => {
      console.log('BGM fade-in autoplay blocked:', error);
    });

    // Fade in over the specified duration
    const targetVolume = this.settings.bgmVolume / 100;
    const steps = 50; // Number of volume steps
    const stepDuration = duration / steps;
    const volumeStep = targetVolume / steps;

    let currentStep = 0;

    const fadeInterval = setInterval(() => {
      if (!this.bgmAudio || currentStep >= steps) {
        clearInterval(fadeInterval);
        return;
      }

      currentStep++;
      const newVolume = Math.min(volumeStep * currentStep, targetVolume);
      this.bgmAudio.volume = newVolume;

      if (currentStep >= steps) {
        clearInterval(fadeInterval);
        console.log('🎵 BGM fade-in complete at', Math.round(newVolume * 100) + '%');
      }
    }, stepDuration);
  }

  public createSFXAudio(src: string): HTMLAudioElement {
    const audio = new Audio(src);
    audio.volume = this.settings.sfxVolume / 100;
    return audio;
  }

  public playSFX(src: string): void {
    console.log('🔊 Attempting to play SFX:', src);
    const audio = this.createSFXAudio(src);

    // Add error handling to try alternative paths
    audio.addEventListener('error', () => {
      console.error('SFX loading error for:', src);
      // Try alternative path without /assets/
      const altSrc = src.replace('/assets/', '/');
      console.log('🔊 Trying alternative path:', altSrc);
      const altAudio = this.createSFXAudio(altSrc);
      altAudio.play().catch((error) => {
        console.error('Alternative SFX play error:', error);
      });
    });

    audio.play().catch((error) => {
      console.error('SFX play error:', error);
    });
  }

  // Convenience methods for specific sound effects
  public playCoinSound(): void {
    const paths = [
      '/assets/audio/coin1.mp3',
      '/audio/coin1.mp3',
      '/assets/audio/coin.mp3',
      '/audio/coin.mp3'
    ];
    this.tryPlaySFXWithFallbacks(paths, 'coin');
  }

  public playJumpSound(): void {
    const paths = [
      '/assets/audio/jump1.mp3',
      '/audio/jump1.mp3',
      '/assets/audio/jump.mp3',
      '/audio/jump.mp3'
    ];
    this.tryPlaySFXWithFallbacks(paths, 'jump');
  }

  public playDeathSound(): void {
    const paths = [
      '/assets/audio/death1.mp3',
      '/audio/death1.mp3',
      '/assets/audio/death.mp3',
      '/audio/death.mp3'
    ];
    this.tryPlaySFXWithFallbacks(paths, 'death');
  }

  private tryPlaySFXWithFallbacks(paths: string[], soundType: string): void {
    console.log(`🔊 Trying to play ${soundType} sound with fallbacks:`, paths);

    const tryNextPath = (index: number) => {
      if (index >= paths.length) {
        console.error(`❌ All ${soundType} sound paths failed`);
        return;
      }

      const currentPath = paths[index];
      if (!currentPath) {
        tryNextPath(index + 1);
        return;
      }

      const audio = this.createSFXAudio(currentPath);

      audio.addEventListener('error', () => {
        console.log(`❌ Failed to load ${soundType} from:`, currentPath);
        tryNextPath(index + 1);
      });

      audio.addEventListener('canplaythrough', () => {
        console.log(`✅ Successfully loaded ${soundType} from:`, currentPath);
      });

      audio.play().catch((error) => {
        console.log(`❌ Failed to play ${soundType} from:`, currentPath, error);
        tryNextPath(index + 1);
      });
    };

    tryNextPath(0);
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