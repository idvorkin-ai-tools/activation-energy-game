import { Howl } from "howler";

export type SoundName = "click" | "chime" | "ascend" | "descend" | "heartbeat";

/**
 * Minimal sound manager wrapping Howler.js.
 *
 * For initial development the sound map is empty — calling play() is a
 * no-op until real sounds are wired in during the polish phase.
 */
class SoundManager {
  private sounds: Map<string, Howl> = new Map();
  private enabled = true;

  /** Initialize sounds. Currently a stub — real audio added in polish phase. */
  init(): void {
    // Will register Howl instances here once we have audio assets.
    // Using Howler means we get Web Audio API with HTML5 Audio fallback
    // for free, plus sprite support for sound atlases.
  }

  /** Play a named sound effect (no-op if disabled or sound not loaded) */
  play(name: SoundName): void {
    if (!this.enabled) return;
    const sound = this.sounds.get(name);
    if (sound) sound.play();
  }

  /** Toggle sound on/off */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /** Check if sound is enabled */
  isEnabled(): boolean {
    return this.enabled;
  }
}

export const soundManager = new SoundManager();
