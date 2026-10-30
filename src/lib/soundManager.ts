import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

// Sound asset imports
const openingSoundAsset = require('../../assets/sounds/app_opening.wav');
const clickSoundAsset = require('../../assets/sounds/button_click.wav');
const tabPopSoundAsset = require('../../assets/sounds/tab_pop.wav');
const successSoundAsset = require('../../assets/sounds/action_success.wav');

let expoAudioModule: any = null;

// Dynamically load expo-audio to prevent web bundler issues
try {
  expoAudioModule = require('expo-audio');
} catch (e) {
  // Graceful fallback for non-native environments
}

// Web Audio API Context (cached singleton for web)
let webAudioCtx: any = null;
function getWebAudioContext() {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (AudioCtx && !webAudioCtx) {
      webAudioCtx = new AudioCtx();
    }
  }
  return webAudioCtx;
}

// Synthesizer fallback for web if audio file cannot autoplay
function playWebTone(frequency: number, duration: number, type: 'sine' | 'triangle' = 'sine', gainVal = 0.15) {
  try {
    const ctx = getWebAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    gain.gain.setValueAtTime(gainVal, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    // Ignore web autoplay policy limitations
  }
}

/**
 * Play the rich sacred golden bell opening sound on app launch
 */
export async function playAppOpeningSound() {
  try {
    if (Platform.OS === 'web') {
      // Golden multi-harmonic bell chime on web
      const ctx = getWebAudioContext();
      if (ctx) {
        if (ctx.state === 'suspended') ctx.resume().catch(() => {});
        [528, 792, 1056, 264].forEach((f, idx) => {
          setTimeout(() => playWebTone(f, 2.2, 'sine', 0.12 / (idx + 1)), idx * 30);
        });
      }
      return;
    }

    if (expoAudioModule?.AudioModule?.createAudioPlayer) {
      const player = expoAudioModule.AudioModule.createAudioPlayer(openingSoundAsset);
      player.play();
    }
  } catch (err) {
    // Fail silently so animation continues regardless of mute switch
    console.log('App opening sound note:', err);
  }
}

/**
 * Play a crisp luxury tactile button click with haptic feedback
 */
export async function playButtonClick() {
  try {
    // 1. Tactile haptic feedback
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }

    // 2. Audible acoustic tick
    if (Platform.OS === 'web') {
      playWebTone(1200, 0.035, 'triangle', 0.1);
      return;
    }

    if (expoAudioModule?.AudioModule?.createAudioPlayer) {
      const player = expoAudioModule.AudioModule.createAudioPlayer(clickSoundAsset);
      player.play();
    }
  } catch (err) {
    // Ignore audio playback error
  }
}

/**
 * Play a soft acoustic pop when switching tabs or selecting filters
 */
export async function playTabPop() {
  try {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      Haptics.selectionAsync().catch(() => {});
    }

    if (Platform.OS === 'web') {
      playWebTone(580, 0.045, 'sine', 0.08);
      return;
    }

    if (expoAudioModule?.AudioModule?.createAudioPlayer) {
      const player = expoAudioModule.AudioModule.createAudioPlayer(tabPopSoundAsset);
      player.play();
    }
  } catch (err) {
    // Ignore audio error
  }
}

/**
 * Play an ascending harmonic chime for success actions (e.g. date locked, inquiry sent, saved)
 */
export async function playSuccessSound() {
  try {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }

    if (Platform.OS === 'web') {
      playWebTone(659.25, 0.15, 'sine', 0.12);
      setTimeout(() => playWebTone(987.77, 0.35, 'sine', 0.15), 120);
      return;
    }

    if (expoAudioModule?.AudioModule?.createAudioPlayer) {
      const player = expoAudioModule.AudioModule.createAudioPlayer(successSoundAsset);
      player.play();
    }
  } catch (err) {
    // Ignore
  }
}

