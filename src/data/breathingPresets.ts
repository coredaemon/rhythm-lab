import type { BreathPhase, BreathPreset } from '../types';

const phase = (id: string, kind: BreathPhase['kind'], label: string, duration: number): BreathPhase => ({
  id,
  kind,
  label,
  duration
});

export const breathingPresets: BreathPreset[] = [
  {
    id: 'box',
    name: 'Квадратное дыхание',
    description: 'Ровный цикл 4-4-4-4 для стабильности.',
    phases: [
      phase('box-inhale', 'inhale', 'Вдох', 4),
      phase('box-hold-1', 'hold', 'Задержка', 4),
      phase('box-exhale', 'exhale', 'Выдох', 4),
      phase('box-hold-2', 'pause', 'Пауза', 4)
    ]
  },
  {
    id: '478',
    name: '4-7-8',
    description: 'Медленный выдох для мягкого успокоения.',
    phases: [
      phase('478-inhale', 'inhale', 'Вдох', 4),
      phase('478-hold', 'hold', 'Задержка', 7),
      phase('478-exhale', 'exhale', 'Выдох', 8)
    ]
  },
  {
    id: 'calm',
    name: 'Спокойное дыхание',
    description: 'Длинный выдох без задержек.',
    phases: [
      phase('calm-inhale', 'inhale', 'Вдох', 4),
      phase('calm-exhale', 'exhale', 'Выдох', 6)
    ]
  },
  {
    id: 'focus',
    name: 'Фокус',
    description: 'Симметричный темп для концентрации.',
    phases: [
      phase('focus-inhale', 'inhale', 'Вдох', 5),
      phase('focus-exhale', 'exhale', 'Выдох', 5)
    ]
  },
  {
    id: 'antistress',
    name: 'Антистресс',
    description: 'Короткий вдох и спокойный длинный выдох.',
    phases: [
      phase('antistress-inhale', 'inhale', 'Вдох', 3),
      phase('antistress-exhale', 'exhale', 'Выдох', 6)
    ]
  }
];

export const practiceDurations = [1, 3, 5, 10];
