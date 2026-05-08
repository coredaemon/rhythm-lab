import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { BreathPhase, BreathPreset, RuntimeStatus } from '../types';
import { audioEngine } from '../lib/audioEngine';

interface BreathingState {
  status: RuntimeStatus;
  phase: BreathPhase;
  phaseIndex: number;
  phaseRemaining: number;
  totalRemaining: number;
  progress: number;
  scale: number;
}

const scaleForPhase = (phase: BreathPhase) => {
  if (phase.kind === 'inhale') return 1.22;
  if (phase.kind === 'exhale') return 0.76;
  return 1;
};

export const useBreathingEngine = (preset: BreathPreset, durationMinutes: number, soundEnabled: boolean, volume: number) => {
  const totalDuration = durationMinutes * 60;
  const [status, setStatus] = useState<RuntimeStatus>('idle');
  const [elapsed, setElapsed] = useState(0);
  const frameRef = useRef<number | null>(null);
  const startedAtRef = useRef(0);
  const elapsedAtPauseRef = useRef(0);
  const phaseSignalRef = useRef(0);

  useEffect(() => {
    audioEngine.setEnabled(soundEnabled);
    audioEngine.setVolume(volume);
  }, [soundEnabled, volume]);

  const computed = useMemo<BreathingState>(() => {
    const cycleDuration = preset.phases.reduce((sum, phase) => sum + phase.duration, 0);
    const clampedElapsed = Math.min(elapsed, totalDuration);
    const cycleTime = cycleDuration > 0 ? clampedElapsed % cycleDuration : 0;
    let cursor = 0;
    let phaseIndex = 0;

    for (let index = 0; index < preset.phases.length; index += 1) {
      const next = cursor + preset.phases[index].duration;
      if (cycleTime < next || index === preset.phases.length - 1) {
        phaseIndex = index;
        break;
      }
      cursor = next;
    }

    const phase = preset.phases[phaseIndex];
    const phaseElapsed = cycleTime - cursor;
    return {
      status,
      phase,
      phaseIndex,
      phaseRemaining: Math.max(0, phase.duration - phaseElapsed),
      totalRemaining: Math.max(0, totalDuration - clampedElapsed),
      progress: totalDuration > 0 ? clampedElapsed / totalDuration : 0,
      scale: scaleForPhase(phase)
    };
  }, [elapsed, preset, status, totalDuration]);

  const tick = useCallback(() => {
    const nextElapsed = elapsedAtPauseRef.current + (performance.now() - startedAtRef.current) / 1000;
    setElapsed(nextElapsed);

    if (nextElapsed >= totalDuration) {
      setStatus('completed');
      setElapsed(totalDuration);
      audioEngine.playFinish();
      return;
    }

    frameRef.current = requestAnimationFrame(tick);
  }, [totalDuration]);

  useEffect(() => {
    if (status !== 'running') return;
    const phaseIndex = computed.phaseIndex;
    if (phaseSignalRef.current !== phaseIndex) {
      phaseSignalRef.current = phaseIndex;
      audioEngine.playClick('stage');
    }
  }, [computed.phaseIndex, status]);

  useEffect(() => {
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  useEffect(() => {
    setStatus('idle');
    setElapsed(0);
    elapsedAtPauseRef.current = 0;
    phaseSignalRef.current = 0;
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
  }, [preset.id, totalDuration]);

  const start = useCallback(async () => {
    await audioEngine.unlock();
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    startedAtRef.current = performance.now();
    phaseSignalRef.current = computed.phaseIndex;
    audioEngine.playClick('stage');
    setStatus('running');
    frameRef.current = requestAnimationFrame(tick);
  }, [computed.phaseIndex, tick]);

  const pause = useCallback(() => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    elapsedAtPauseRef.current = elapsed;
    setStatus('paused');
  }, [elapsed]);

  const reset = useCallback(() => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    elapsedAtPauseRef.current = 0;
    phaseSignalRef.current = 0;
    setElapsed(0);
    setStatus('idle');
  }, []);

  return {
    ...computed,
    start,
    pause,
    reset
  };
};
