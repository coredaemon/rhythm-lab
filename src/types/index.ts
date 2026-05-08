export type AppMode = 'breathing' | 'metronome' | 'sessions';
export type ThemeMode = 'light' | 'dark';
export type RuntimeStatus = 'idle' | 'running' | 'paused' | 'completed';
export type BreathPhaseKind = 'inhale' | 'hold' | 'exhale' | 'pause';
export type StepMode = 'metronome' | 'breathing';
export type Meter = '1/4' | '2/4' | '3/4' | '4/4' | '6/8';

export interface BreathPhase {
  id: string;
  kind: BreathPhaseKind;
  label: string;
  duration: number;
}

export interface BreathPreset {
  id: string;
  name: string;
  description: string;
  phases: BreathPhase[];
}

export interface MetronomeSettings {
  bpm: number;
  meter: Meter;
  accentFirstBeat: boolean;
  soundPreset: 'classic';
}

export interface SessionStep {
  id: string;
  title: string;
  duration: number;
  mode: StepMode;
  metronome?: MetronomeSettings;
  breathing?: {
    phases: BreathPhase[];
  };
}

export interface RhythmSession {
  id: string;
  title: string;
  steps: SessionStep[];
  updatedAt: string;
}

export interface AppSettings {
  theme: ThemeMode;
  soundEnabled: boolean;
  volume: number;
  activeMode: AppMode;
  firstRunDismissed: boolean;
  breathingPresetId: string;
  breathingDurationMinutes: number;
  metronome: MetronomeSettings;
}
