import type { AppSettings, Meter } from '../types';
import { useMetronomeEngine } from '../hooks/useMetronomeEngine';
import { TransportControls } from './TransportControls';
import { BpmControl } from './BpmControl';

const meters: Meter[] = ['1/4', '2/4', '3/4', '4/4', '6/8'];

interface MetronomeViewProps {
  settings: AppSettings;
  onSettingsChange: (settings: AppSettings) => void;
}

export const MetronomeView = ({ settings, onSettingsChange }: MetronomeViewProps) => {
  const engine = useMetronomeEngine(settings.metronome, settings.soundEnabled, settings.volume);
  const active = engine.status === 'running';

  const updateBpm = (bpm: number) => {
    onSettingsChange({
      ...settings,
      metronome: { ...settings.metronome, bpm }
    });
  };

  return (
    <main className={active ? 'mode-view active-session' : 'mode-view'}>
      <section className="hero-panel">
        <div className="hero-meta">
          <span>{settings.metronome.meter}</span>
          <span>Доля {engine.beat} / {engine.beatsPerBar}</span>
        </div>
        <div className="metronome-visual" data-pulse={engine.pulse}>
          <span
            key={engine.pulse}
            className={settings.metronome.accentFirstBeat && engine.beat === 1 ? 'beat-dot accent' : 'beat-dot'}
          />
        </div>
        <h2>Метроном</h2>
        <div className="big-time">{settings.metronome.bpm}</div>
        <p className="supporting-time">BPM</p>
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
            <h3>Скорость</h3>
            <BpmControl value={settings.metronome.bpm} onChange={updateBpm} />
          </div>
          <div className="settings-card">
            <h3>Размер</h3>
            <div className="segmented">
              {meters.map((meter) => (
                <button
                  key={meter}
                  className={settings.metronome.meter === meter ? 'active' : ''}
                  type="button"
                  onClick={() => onSettingsChange({ ...settings, metronome: { ...settings.metronome, meter } })}
                >
                  {meter}
                </button>
              ))}
            </div>
            <label className="toggle-row">
              <input
                type="checkbox"
                checked={settings.metronome.accentFirstBeat}
                onChange={(event) =>
                  onSettingsChange({
                    ...settings,
                    metronome: { ...settings.metronome, accentFirstBeat: event.target.checked }
                  })
                }
              />
              <span>Акцент первой доли</span>
            </label>
          </div>
        </section>
      )}
    </main>
  );
};
