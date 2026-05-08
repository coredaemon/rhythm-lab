import type { Meter } from '../../types';
import { audioEngine } from '../audioEngine';

const DEBUG_METRONOME = false;

export interface MetronomeEngineSettings {
  bpm: number;
  meter: Meter;
  accentFirstBeat: boolean;
  volume: number;
  soundEnabled: boolean;
  onBeat?: (beat: number, beatIndex: number) => void;
  label?: string;
}

const beatsPerBarForMeter = (meter: Meter) => (meter === '6/8' ? 6 : Number(meter.split('/')[0]));

const safeBpm = (bpm: number) => Math.min(240, Math.max(30, Math.round(Number.isFinite(bpm) ? bpm : 90)));

const safeVolume = (volume: number) => (Number.isFinite(volume) ? Math.min(1, Math.max(0, volume)) : 0.85);

const debug = (event: string, data: Record<string, unknown>) => {
  if (!DEBUG_METRONOME) return;
  console.debug(`[RhythmLab metronome] ${event}`, data);
};

export class MetronomeEngine {
  private timerId: number | null = null;
  private isRunning = false;
  private nextTickTime = 0;
  private beatIndex = 0;
  private bpm = 90;
  private beatsPerBar = 4;
  private volume = 0.85;
  private soundEnabled = true;
  private accentFirstBeat = false;
  private readonly scheduleAheadTime = 0.12;
  private readonly lookaheadMs = 25;
  private onBeat?: (beat: number, beatIndex: number) => void;
  private label = 'metronome';
  private uiTimers: number[] = [];

  async start(settings: MetronomeEngineSettings) {
    await audioEngine.unlock();
    this.stopSchedulerOnly();
    this.applySettings(settings);
    this.beatIndex = 0;
    this.nextTickTime = audioEngine.currentTime + 0.05;
    this.isRunning = true;

    debug('start', {
      label: this.label,
      bpm: this.bpm,
      beatsPerBar: this.beatsPerBar,
      nextTickTime: this.nextTickTime,
      now: audioEngine.currentTime
    });

    this.schedulerTick();
    this.timerId = window.setInterval(() => this.schedulerTick(), this.lookaheadMs);
  }

  updateSettings(settings: MetronomeEngineSettings) {
    this.applySettings(settings);
  }

  async updateAndRestart(settings: MetronomeEngineSettings) {
    await this.start(settings);
  }

  pause() {
    debug('pause', { label: this.label, beatIndex: this.beatIndex, nextTickTime: this.nextTickTime });
    this.isRunning = false;
    this.stopSchedulerOnly();
  }

  stop() {
    debug('stop', { label: this.label });
    this.isRunning = false;
    this.stopSchedulerOnly();
    this.beatIndex = 0;
    this.nextTickTime = 0;
  }

  dispose() {
    this.stop();
  }

  private applySettings(settings: MetronomeEngineSettings) {
    this.bpm = safeBpm(settings.bpm);
    this.beatsPerBar = beatsPerBarForMeter(settings.meter);
    this.volume = safeVolume(settings.volume);
    this.soundEnabled = settings.soundEnabled;
    this.accentFirstBeat = settings.accentFirstBeat;
    this.onBeat = settings.onBeat;
    this.label = settings.label ?? 'metronome';
    audioEngine.setVolume(this.volume);
    audioEngine.setEnabled(this.soundEnabled);
  }

  private stopSchedulerOnly() {
    if (this.timerId !== null) {
      window.clearInterval(this.timerId);
      this.timerId = null;
    }

    this.uiTimers.forEach((timerId) => window.clearTimeout(timerId));
    this.uiTimers = [];
  }

  private schedulerTick() {
    if (!this.isRunning) return;

    const now = audioEngine.currentTime;

    debug('scheduler tick', {
      label: this.label,
      bpm: this.bpm,
      beatIndex: this.beatIndex,
      nextTickTime: this.nextTickTime,
      now,
      difference: this.nextTickTime - now
    });

    if (this.nextTickTime < now) {
      debug('skipped late tick', {
        label: this.label,
        bpm: this.bpm,
        beatIndex: this.beatIndex,
        lateBy: now - this.nextTickTime,
        now,
        oldNextTickTime: this.nextTickTime
      });
      this.nextTickTime = now + 0.03;
    }

    while (this.nextTickTime < now + this.scheduleAheadTime) {
      const scheduledBeatIndex = this.beatIndex;
      const scheduledBeat = scheduledBeatIndex + 1;
      const scheduledTime = this.nextTickTime;
      const isAccent = this.accentFirstBeat && scheduledBeatIndex === 0;

      this.scheduleClick(scheduledTime, scheduledBeatIndex, isAccent);
      this.scheduleBeatEvent(scheduledTime, scheduledBeat, scheduledBeatIndex);

      debug('scheduled click', {
        label: this.label,
        bpm: this.bpm,
        beatIndex: scheduledBeatIndex,
        scheduledTime,
        now: audioEngine.currentTime,
        difference: scheduledTime - audioEngine.currentTime,
        secondsPerBeat: 60 / this.bpm,
        isAccent
      });

      this.nextTickTime += 60 / this.bpm;
      this.beatIndex = (scheduledBeatIndex + 1) % this.beatsPerBar;
    }
  }

  private scheduleClick(time: number, beatIndex: number, isAccent: boolean) {
    if (time < audioEngine.currentTime) {
      debug('drop past click', {
        label: this.label,
        beatIndex,
        time,
        now: audioEngine.currentTime
      });
      return;
    }

    audioEngine.playClick(isAccent ? 'accent' : 'regular', time);
  }

  private scheduleBeatEvent(time: number, beat: number, beatIndex: number) {
    if (!this.onBeat) return;

    const delay = Math.max(0, (time - audioEngine.currentTime) * 1000);
    const timerId = window.setTimeout(() => {
      this.onBeat?.(beat, beatIndex);
      this.uiTimers = this.uiTimers.filter((id) => id !== timerId);
    }, delay);
    this.uiTimers.push(timerId);
  }
}
