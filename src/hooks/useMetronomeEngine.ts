import { useCallback, useEffect, useRef, useState } from 'react';
import type { MetronomeSettings, RuntimeStatus } from '../types';
import { MetronomeEngine } from '../lib/audio/MetronomeEngine';

const meterBeats = (meter: MetronomeSettings['meter']) => {
  if (meter === '6/8') return 6;
  return Number(meter.split('/')[0]);
};

export const useMetronomeEngine = (settings: MetronomeSettings, soundEnabled: boolean, volume: number) => {
  const [status, setStatus] = useState<RuntimeStatus>('idle');
  const [beat, setBeat] = useState(1);
  const [pulse, setPulse] = useState(0);
  const engineRef = useRef<MetronomeEngine | null>(null);
  const statusRef = useRef(status);

  if (!engineRef.current) {
    engineRef.current = new MetronomeEngine();
  }

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    engineRef.current?.updateSettings({
      ...settings,
      volume,
      soundEnabled,
      label: 'metronome',
      onBeat: (nextBeat) => {
        setBeat(nextBeat);
        setPulse((value) => value + 1);
      }
    });
  }, [settings, soundEnabled, volume]);

  useEffect(() => () => engineRef.current?.dispose(), []);

  const start = useCallback(async () => {
    const engine = engineRef.current;
    if (!engine) return;

    await engine.start({
      ...settings,
      volume,
      soundEnabled,
      label: 'metronome',
      onBeat: (nextBeat) => {
        setBeat(nextBeat);
        setPulse((value) => value + 1);
      }
    });
    setStatus('running');
    statusRef.current = 'running';
  }, [settings, soundEnabled, volume]);

  const pause = useCallback(() => {
    engineRef.current?.pause();
    setStatus('paused');
    statusRef.current = 'paused';
  }, []);

  const reset = useCallback(() => {
    engineRef.current?.stop();
    setStatus('idle');
    statusRef.current = 'idle';
    setBeat(1);
    setPulse((value) => value + 1);
  }, []);

  return {
    status,
    beat,
    pulse,
    beatsPerBar: meterBeats(settings.meter),
    start,
    pause,
    reset
  };
};
