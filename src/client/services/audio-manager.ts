/**
 * Clean, modular audio manager for BGM and SFX
 * Supports any number of sound effects with simple registration
 */

export interface AudioSettings {
  bgmVolume: number; // 0-100
  sfxVolume: number; // 0-100
}

const DEFAULT_SETTINGS: AudioSettings = {
  bgmVolume: 70,
  sfxVolume: 70,
};

const STORAGE_KEY = 'audio_settings';

type SFXName = 'coin' | 'jump' | 'death' | 'spring' | 'spike';

class AudioManager {
  private settings: AudioSettings;
  private listeners: Set<(settings: AudioSettings) => void> = new Set();
  
  // BGM
  private bgmAudio: HTMLAudioElement | null = null;
  private bgmLoaded = false;
  
  // SFX pool - create multiple instances for overlapping sounds
  private sfxCache: Map<string, HTMLAudioElement[]> = new Map();
  private readonly SFX_POOL_SIZE = 3;

  constructor() {
    this.settings = this.loadSettings();
    this.initializeBGM();
  }

  // ============ SETTINGS ============
  
  private loadSettings(): AudioSettings {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : { ...DEFAULT_SETTINGS };
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  }

  private saveSettings(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
      this.notifyListeners();
    } catch (error) {
      console.error('[AudioManager] Failed to save settings:', error);
    }
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
  }

  public setSFXVolume(volume: number): void {
    this.settings.sfxVolume = Math.max(0, Math.min(100, volume));
    this.saveSettings();
  }

  public onSettingsChange(callback: (settings: AudioSettings) => void): void {
    this.listeners.add(callback);
    callback(this.settings);
  }

  public offSettingsChange(callback: (settings: AudioSettings) => void): void {
    this.listeners.delete(callback);
  }

  private notifyListeners(): void {
    this.listeners.forEach(callback => {
      try {
        callback(this.settings);
      } catch (error) {
        console.error('[AudioManager] Listener error:', error);
      }
    });
  }

  // ============ BGM ============

  private initializeBGM(): void {
    try {
      const bgmUrl = new URL('../../assets/audio/bgmdummy.mp3', import.meta.url).href;
      this.bgmAudio = new Audio(bgmUrl);
      this.bgmAudio.loop = true;
      this.bgmAudio.volume = this.settings.bgmVolume / 100;
      this.bgmAudio.preload = 'auto';

      this.bgmAudio.addEventListener('canplaythrough', () => {
        this.bgmLoaded = true;
      });

      this.bgmAudio.addEventListener('error', (e) => {
        console.error('[AudioManager] BGM load error:', e);
      });

      // Auto-play on first user interaction
      this.setupAutoPlay();
    } catch (error) {
      console.error('[AudioManager] BGM init error:', error);
    }
  }

  private setupAutoPlay(): void {
    const startBGM = () => {
      this.playBGM();
      document.removeEventListener('click', startBGM);
      document.removeEventListener('keydown', startBGM);
      document.removeEventListener('touchstart', startBGM);
    };

    document.addEventListener('click', startBGM, { once: true });
    document.addEventListener('keydown', startBGM, { once: true });
    document.addEventListener('touchstart', startBGM, { once: true });
  }

  public playBGM(): void {
    if (this.bgmAudio && this.bgmLoaded) {
      this.bgmAudio.play().catch(() => {
        // Silently handle autoplay restrictions
      });
    }
  }

  public pauseBGM(): void {
    this.bgmAudio?.pause();
  }

  public stopBGM(): void {
    if (this.bgmAudio) {
      this.bgmAudio.pause();
      this.bgmAudio.currentTime = 0;
    }
  }

  // ============ SFX ============

  /**
   * Register SFX files - automatically creates a pool for each
   */
  private registerSFX(name: SFXName, filename: string): void {
    try {
      const url = new URL(`../../assets/audio/${filename}`, import.meta.url).href;
      const pool: HTMLAudioElement[] = [];
      
      for (let i = 0; i < this.SFX_POOL_SIZE; i++) {
        const audio = new Audio(url);
        audio.volume = this.settings.sfxVolume / 100;
        audio.preload = 'auto';
        pool.push(audio);
      }
      
      this.sfxCache.set(name, pool);
    } catch (error) {
      console.error(`[AudioManager] Failed to register SFX: ${name}`, error);
    }
  }

  /**
   * Play a sound effect - automatically handles pooling
   */
  public playSFX(name: SFXName): void {
    const pool = this.sfxCache.get(name);
    
    if (!pool) {
      // Lazy load if not registered
      this.registerSFX(name, `${name}1.mp3`);
      setTimeout(() => this.playSFX(name), 50);
      return;
    }

    // Find an available audio instance or use the first one
    const audio = pool.find(a => a.paused) || pool[0];
    
    if (audio) {
      audio.volume = this.settings.sfxVolume / 100;
      audio.currentTime = 0;
      audio.play().catch(() => {
        // Silently handle play errors
      });
    }
  }

  // Convenience methods for common SFX
  public playCoin(): void {
    this.playSFX('coin');
  }

  public playJump(): void {
    this.playSFX('jump');
  }

  public playDeath(): void {
    this.playSFX('death');
  }

  public playSpring(): void {
    // Use jump sound as fallback for spring if spring1.mp3 doesn't exist
    this.playSFX('jump');
  }

  public playSpike(): void {
    // Use death sound for spike hits
    this.playSFX('death');
  }
}

export const audioManager = new AudioManager();
