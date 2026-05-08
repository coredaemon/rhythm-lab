import type { AppMode, ThemeMode } from '../types';

interface HeaderProps {
  activeMode: AppMode;
  theme: ThemeMode;
  onModeChange: (mode: AppMode) => void;
  onThemeChange: (theme: ThemeMode) => void;
}

const modes: Array<{ id: AppMode; label: string }> = [
  { id: 'breathing', label: 'Дыхание' },
  { id: 'metronome', label: 'Метроном' },
  { id: 'sessions', label: 'Сессии' }
];

export const Header = ({ activeMode, theme, onModeChange, onThemeChange }: HeaderProps) => (
  <header className="app-header">
    <div>
      <p className="eyebrow">PWA rhythm assistant</p>
      <h1>RhythmLab</h1>
      <p className="subtitle">Ритм для дыхания, фокуса, музыки и тренировок.</p>
    </div>
    <button
      className="icon-button"
      type="button"
      aria-label="Переключить тему"
      title="Переключить тему"
      onClick={() => onThemeChange(theme === 'light' ? 'dark' : 'light')}
    >
      {theme === 'light' ? '☾' : '☀'}
    </button>
    <nav className="tabs" aria-label="Основные разделы">
      {modes.map((mode) => (
        <button
          key={mode.id}
          className={activeMode === mode.id ? 'tab active' : 'tab'}
          type="button"
          onClick={() => onModeChange(mode.id)}
        >
          {mode.label}
        </button>
      ))}
    </nav>
  </header>
);
