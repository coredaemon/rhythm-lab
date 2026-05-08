import type { RhythmSession } from '../types';

export const demoSession: RhythmSession = {
  id: 'demo-ramp-return',
  title: 'Разгон и возврат — 5 минут',
  updatedAt: new Date(0).toISOString(),
  steps: [
    {
      id: 'demo-slow',
      title: 'Медленный старт',
      duration: 60,
      mode: 'metronome',
      metronome: { bpm: 60, meter: '4/4', accentFirstBeat: false, soundPreset: 'classic' }
    },
    {
      id: 'demo-accel',
      title: 'Ускорение',
      duration: 60,
      mode: 'metronome',
      metronome: { bpm: 90, meter: '4/4', accentFirstBeat: false, soundPreset: 'classic' }
    },
    {
      id: 'demo-active',
      title: 'Активный темп',
      duration: 60,
      mode: 'metronome',
      metronome: { bpm: 120, meter: '4/4', accentFirstBeat: false, soundPreset: 'classic' }
    },
    {
      id: 'demo-peak',
      title: 'Пик',
      duration: 60,
      mode: 'metronome',
      metronome: { bpm: 150, meter: '4/4', accentFirstBeat: false, soundPreset: 'classic' }
    },
    {
      id: 'demo-return',
      title: 'Возврат',
      duration: 60,
      mode: 'metronome',
      metronome: { bpm: 60, meter: '4/4', accentFirstBeat: false, soundPreset: 'classic' }
    }
  ]
};
