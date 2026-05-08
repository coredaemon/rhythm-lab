import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { BreathPhase, RhythmSession, RuntimeStatus, SessionStep } from '../types';
import { audioEngine } from '../lib/audioEngine';
import { MetronomeEngine } from '../lib/audio/MetronomeEngine';

const breathingPhaseForElapsed = (phases: BreathPhase[], elapsed: number) => {
  const cycle = phases.reduce((sum, phase) => sum + phase.duration, 0);
  const cycleTime = cycle > 0 ? elapsed % cycle : 0;
  let cursor = 0;
  for (const phase of phases) {
    if (cycleTime < cursor + phase.duration) {
      return { phase, remaining: cursor + phase.duration - cycleTime };
    }
    cursor += phase.duration;
  }
  return { phase: phases[0], remaining: phases[0]?.duration ?? 0 };
};

export const useSessionEngine = (session: RhythmSession, soundEnabled: boolean, volume: number) => {
  const [status, setStatus] = useState<RuntimeStatus>('idle');
  const [elapsed, setElapsed] = useState(0);
  const [pulse, setPulse] = useState(0);
  const frameRef = useRef<number | null>(null);
  const startedAtRef = useRef(0);
  const elapsedAtPauseRef = useRef(0);
  const activeStepIdRef = useRef<string | null>(null);
  const sessionRef = useRef(session);
  const statusRef = useRef(status);
  const metronomeEngineRef = useRef<MetronomeEngine | null>(null);

  if (!metronomeEngineRef.current) {
    metronomeEngineRef.current = new MetronomeEngine();
  }

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    audioEngine.setEnabled(soundEnabled);
    audioEngine.setVolume(volume);
  }, [soundEnabled, volume]);

  const totalDuration = useMemo(
    () => session.steps.reduce((sum, step) => sum + step.duration, 0),
    [session.steps]
  );

  const currentStepFromElapsed = useCallback((sessionValue: RhythmSession, elapsedValue: number): SessionStep | null => {
    let cursor = 0;
    for (const step of sessionValue.steps) {
      if (elapsedValue < cursor + step.duration) return step;
      cursor += step.duration;
    }
    return sessionValue.steps.at(-1) ?? null;
  }, []);

  const derived = useMemo(() => {
    let cursor = 0;
    let index = 0;
    for (let i = 0; i < session.steps.length; i += 1) {
      const next = cursor + session.steps[i].duration;
      if (elapsed < next || i === session.steps.length - 1) {
        index = i;
        break;
      }
      cursor = next;
    }
    const step = session.steps[index] ?? session.steps[0];
    const stepElapsed = Math.max(0, elapsed - cursor);
    const breathing =
      step?.mode === 'breathing' && step.breathing?.phases.length
        ? breathingPhaseForElapsed(step.breathing.phases, stepElapsed)
        : null;

    return {
      status,
      step,
      stepIndex: index,
      stepElapsed,
      stepRemaining: Math.max(0, (step?.duration ?? 0) - stepElapsed),
      totalRemaining: Math.max(0, totalDuration - elapsed),
      progress: totalDuration > 0 ? Math.min(1, elapsed / totalDuration) : 0,
      breathingPhase: breathing?.phase ?? null,
      breathingPhaseRemaining: breathing?.remaining ?? 0
    };
  }, [elapsed, session.steps, status, totalDuration]);

  const stopVisualTimer = useCallback(() => {
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
  }, []);

  const stopAllRuntime = useCallback(() => {
    stopVisualTimer();
    metronomeEngineRef.current?.stop();
  }, [stopVisualTimer]);

  const syncStepAudio = useCallback(
    (elapsedValue: number) => {
      const step = currentStepFromElapsed(sessionRef.current, elapsedValue);
      if (step?.id === activeStepIdRef.current) return;

      activeStepIdRef.current = step?.id ?? null;

      if (step?.mode === 'metronome' && step.metronome) {
        void metronomeEngineRef.current?.updateAndRestart({
          ...step.metronome,
          volume,
          soundEnabled,
          label: `session:${step.id}:${step.title}`,
          onBeat: () => setPulse((value) => value + 1)
        });
        return;
      }

      metronomeEngineRef.current?.stop();
    },
    [currentStepFromElapsed, soundEnabled, volume]
  );

  const tick = useCallback(() => {
    if (statusRef.current !== 'running') return;

    const nextElapsed = elapsedAtPauseRef.current + (performance.now() - startedAtRef.current) / 1000;
    setElapsed(nextElapsed);
    syncStepAudio(nextElapsed);

    if (nextElapsed >= totalDuration) {
      stopAllRuntime();
      setElapsed(totalDuration);
      setStatus('completed');
      statusRef.current = 'completed';
      audioEngine.playFinish();
      return;
    }

    frameRef.current = requestAnimationFrame(tick);
  }, [stopAllRuntime, syncStepAudio, totalDuration]);

  useEffect(() => {
    return () => {
      stopAllRuntime();
      metronomeEngineRef.current?.dispose();
    };
  }, [stopAllRuntime]);

  useEffect(() => {
    stopAllRuntime();
    setStatus('idle');
    statusRef.current = 'idle';
    setElapsed(0);
    elapsedAtPauseRef.current = 0;
    activeStepIdRef.current = null;
  }, [session.id, stopAllRuntime]);

  const start = useCallback(async () => {
    if (!session.steps.length) return;
    await audioEngine.unlock();
    stopAllRuntime();
    startedAtRef.current = performance.now();
    activeStepIdRef.current = null;
    setStatus('running');
    statusRef.current = 'running';
    syncStepAudio(elapsedAtPauseRef.current);
    frameRef.current = requestAnimationFrame(tick);
  }, [session.steps.length, stopAllRuntime, syncStepAudio, tick]);

  const pause = useCallback(() => {
    stopAllRuntime();
    elapsedAtPauseRef.current = elapsed;
    activeStepIdRef.current = null;
    setStatus('paused');
    statusRef.current = 'paused';
  }, [elapsed, stopAllRuntime]);

  const reset = useCallback(() => {
    stopAllRuntime();
    elapsedAtPauseRef.current = 0;
    activeStepIdRef.current = null;
    setElapsed(0);
    setPulse((value) => value + 1);
    setStatus('idle');
    statusRef.current = 'idle';
  }, [stopAllRuntime]);

  return {
    ...derived,
    pulse,
    totalDuration,
    start,
    pause,
    reset
  };
};
