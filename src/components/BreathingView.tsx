import type { BreathPreset, AppSettings } from '../types';
import { breathingPresets, practiceDurations } from '../data/breathingPresets';
import { formatTime } from '../lib/time';
import { useBreathingEngine } from '../hooks/useBreathingEngine';
import { TransportControls } from './TransportControls';

interface BreathingViewProps {
  settings: AppSettings;
  onSettingsChange: (settings: AppSettings) => void;
}

export const BreathingView = ({ settings, onSettingsChange }: BreathingViewProps) => {
  const preset = breathingPresets.find((item) => item.id === settings.breathingPresetId) ?? breathingPresets[0];
  const engine = useBreathingEngine(preset, settings.breathingDurationMinutes, settings.soundEnabled, settings.volume);
  const active = engine.status === 'running';

  const updatePreset = (nextPreset: BreathPreset) => {
    onSettingsChange({ ...settings, breathingPresetId: nextPreset.id });
  };

  return (
    <main className={active ? 'mode-view active-session' : 'mode-view'}>
      <section className="hero-panel">
        <div className="hero-meta">
          <span>{preset.name}</span>
          <span>{engine.status === 'completed' ? 'Завершено мягко' : 'Дыхательная практика'}</span>
        </div>
        <div className="breath-orbit">
          <div
            className={`breath-circle ${engine.phase.kind}`}
            style={{
              transform: `scale(${engine.scale})`,
              transitionDuration: `${Math.max(0.4, engine.phase.duration)}s`
            }}
          />
        </div>
        <h2>{engine.status === 'completed' ? 'Готово' : engine.phase.label}</h2>
        <div className="big-time">{formatTime(engine.phaseRemaining)}</div>
        <p className="supporting-time">Осталось всего: {formatTime(engine.totalRemaining)}</p>
        <div className="progress-track">
          <span style={{ width: `${engine.progress * 100}%` }} />
        </div>
        <TransportControls
          status={engine.status}
          onStart={engine.start}
          onPause={engine.pause}
          onReset={engine.reset}
        />
      </section>

      {!active && (
        <section className="settings-grid">
          <div className="settings-card">
            <h3>Пресет</h3>
            <div className="preset-grid">
              {breathingPresets.map((item) => (
                <button
                  key={item.id}
                  className={item.id === preset.id ? 'choice active' : 'choice'}
                  type="button"
                  onClick={() => updatePreset(item)}
                >
                  <span>{item.name}</span>
                  <small>{item.description}</small>
                </button>
              ))}
            </div>
          </div>
          <div className="settings-card">
            <h3>Длительность</h3>
            <div className="segmented">
              {practiceDurations.map((duration) => (
                <button
                  key={duration}
                  className={settings.breathingDurationMinutes === duration ? 'active' : ''}
                  type="button"
                  onClick={() => onSettingsChange({ ...settings, breathingDurationMinutes: duration })}
                >
                  {duration} мин
                </button>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
};
