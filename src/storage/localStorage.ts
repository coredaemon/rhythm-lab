import type { AppSettings, RhythmSession } from '../types';

const SETTINGS_KEY = 'rhythmlab:settings:v1';
const SESSIONS_KEY = 'rhythmlab:sessions:v1';

export const defaultSettings: AppSettings = {
  theme: 'light',
  soundEnabled: true,
  volume: 0.7,
  activeMode: 'breathing',
  firstRunDismissed: false,
  breathingPresetId: 'box',
  breathingDurationMinutes: 3,
  metronome: {
    bpm: 90,
    meter: '4/4',
    accentFirstBeat: false,
    soundPreset: 'classic'
  }
};

const readJson = <T>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

export const loadSettings = (): AppSettings => {
  const stored = readJson<Partial<AppSettings>>(SETTINGS_KEY, {});
  const storedMetronome: Partial<AppSettings['metronome']> = stored.metronome ?? {};
  const hasClassicPreset = storedMetronome.soundPreset === 'classic';

  return {
    ...defaultSettings,
    ...stored,
    metronome: {
      ...defaultSettings.metronome,
      ...storedMetronome,
      accentFirstBeat: hasClassicPreset ? (storedMetronome.accentFirstBeat ?? false) : false,
      soundPreset: 'classic'
    }
  };
};

export const saveSettings = (settings: AppSettings) => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};

export const loadSessions = (): RhythmSession[] =>
  readJson<RhythmSession[]>(SESSIONS_KEY, []).map((session) => ({
    ...session,
    steps: session.steps.map((step) => ({
      ...step,
      metronome: step.metronome
        ? {
            ...step.metronome,
            bpm: clampBpm(step.metronome.bpm),
            accentFirstBeat: step.metronome.accentFirstBeat ?? false,
            soundPreset: 'classic'
          }
        : undefined
    }))
  }));

export const saveSessions = (sessions: RhythmSession[]) => {
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
};

const clampBpm = (value: number) => Math.min(240, Math.max(30, Math.round(value || 90)));
