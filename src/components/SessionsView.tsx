import { useMemo, useState } from 'react';
import type { AppSettings, BreathPhase, Meter, RhythmSession, SessionStep, StepMode } from '../types';
import { demoSession } from '../data/sessions';
import { breathingPresets } from '../data/breathingPresets';
import { formatTime, uid, clamp } from '../lib/time';
import { useSessionEngine } from '../hooks/useSessionEngine';
import { useWakeLock } from '../hooks/useWakeLock';
import { TransportControls } from './TransportControls';
import { BpmControl } from './BpmControl';
import { WakeLockIndicator } from './WakeLockIndicator';

const meters: Meter[] = ['1/4', '2/4', '3/4', '4/4', '6/8'];

const createStep = (): SessionStep => ({
  id: uid('step'),
  title: 'Новый этап',
  duration: 60,
  mode: 'metronome',
  metronome: { bpm: 90, meter: '4/4', accentFirstBeat: false, soundPreset: 'classic' }
});

const cloneDemo = (): RhythmSession => ({
  ...demoSession,
  id: 'demo-ramp-return',
  steps: demoSession.steps.map((step) => ({
    ...step,
    metronome: step.metronome ? { ...step.metronome } : undefined,
    breathing: step.breathing ? { phases: [...step.breathing.phases] } : undefined
  }))
});

const serializePhases = (phases: BreathPhase[]) =>
  phases.map((phase) => `${phase.label.toLowerCase()} ${phase.duration}`).join(', ');

const parsePhases = (value: string): BreathPhase[] => {
  const parsed = value
    .split(',')
    .map((part) => {
      const match = part.trim().match(/^(.+?)\s+(\d+)$/);
      if (!match) return null;
      const label = match[1].trim();
      const lower = label.toLowerCase();
      const kind = lower.includes('выдох')
        ? 'exhale'
        : lower.includes('задерж')
          ? 'hold'
          : lower.includes('пау')
            ? 'pause'
            : 'inhale';

      return {
        id: uid('phase'),
        label,
        kind,
        duration: clamp(Number(match[2]), 1, 120)
      } satisfies BreathPhase;
    })
    .filter((phase): phase is BreathPhase => Boolean(phase));

  return parsed.length ? parsed : breathingPresets[0].phases;
};

const stepSummary = (step: SessionStep) => {
  if (step.mode === 'metronome' && step.metronome) {
    return `${step.duration} сек · Метроном · ${step.metronome.bpm} BPM`;
  }

  if (step.mode === 'breathing' && step.breathing) {
    return `${step.duration} сек · Дыхание · ${serializePhases(step.breathing.phases)}`;
  }

  return `${step.duration} сек`;
};

interface SessionsViewProps {
  settings: AppSettings;
  savedSessions: RhythmSession[];
  onSaveSessions: (sessions: RhythmSession[]) => void;
}

export const SessionsView = ({ settings, savedSessions, onSaveSessions }: SessionsViewProps) => {
  const allSessions = useMemo(() => [cloneDemo(), ...savedSessions], [savedSessions]);
  const [draft, setDraft] = useState<RhythmSession>(() => allSessions[0]);
  const engine = useSessionEngine(draft, settings.soundEnabled, settings.volume);
  const active = engine.status === 'running';
  const wakeLock = useWakeLock(settings.keepScreenAwake, active);

  const setStep = (stepId: string, patch: Partial<SessionStep>) => {
    setDraft((current) => ({
      ...current,
      steps: current.steps.map((step) => (step.id === stepId ? { ...step, ...patch } : step)),
      updatedAt: new Date().toISOString()
    }));
  };

  const moveStep = (index: number, direction: -1 | 1) => {
    setDraft((current) => {
      const next = [...current.steps];
      const target = index + direction;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return { ...current, steps: next, updatedAt: new Date().toISOString() };
    });
  };

  const saveDraft = () => {
    const sessionToSave = {
      ...draft,
      id: draft.id === demoSession.id ? uid('session') : draft.id,
      updatedAt: new Date().toISOString()
    };
    const next = [sessionToSave, ...savedSessions.filter((session) => session.id !== sessionToSave.id)];
    onSaveSessions(next);
    setDraft(sessionToSave);
  };

  const deleteSaved = (sessionId: string) => {
    onSaveSessions(savedSessions.filter((session) => session.id !== sessionId));
    if (draft.id === sessionId) setDraft(cloneDemo());
  };

  const updateMode = (step: SessionStep, mode: StepMode) => {
    if (mode === 'metronome') {
      setStep(step.id, {
        mode,
        metronome: step.metronome ?? { bpm: 90, meter: '4/4', accentFirstBeat: false, soundPreset: 'classic' },
        breathing: undefined
      });
    } else {
      setStep(step.id, {
        mode,
        breathing: step.breathing ?? { phases: breathingPresets[0].phases },
        metronome: undefined
      });
    }
  };

  const updateStepBpm = (step: SessionStep, bpm: number) => {
    if (!step.metronome) return;
    setStep(step.id, { metronome: { ...step.metronome, bpm } });
  };

  return (
    <main className={active ? 'mode-view active-session' : 'mode-view'}>
      <section className="hero-panel">
        <div className="hero-meta">
          <span>{draft.title}</span>
          <span>{engine.step ? `${engine.stepIndex + 1} / ${draft.steps.length}` : 'Нет этапов'}</span>
        </div>
        <div className="session-visual" data-pulse={engine.pulse}>
          <span>{Math.round(engine.progress * 100)}%</span>
        </div>
        <h2>{engine.status === 'completed' ? 'Сессия завершена' : engine.step?.title ?? 'Сессия'}</h2>
        {engine.step?.mode === 'metronome' && engine.step.metronome && (
          <p className="current-bpm">{engine.step.metronome.bpm} BPM</p>
        )}
        <div className="big-time">{formatTime(engine.stepRemaining)}</div>
        <p className="supporting-time">
          Осталось этапа: {formatTime(engine.stepRemaining)} · Всего: {formatTime(engine.totalRemaining)}
          {engine.breathingPhase ? ` · ${engine.breathingPhase.label} ${formatTime(engine.breathingPhaseRemaining)}` : ''}
        </p>
        <WakeLockIndicator enabled={settings.keepScreenAwake} active={active} wakeLock={wakeLock} />
        <div className="progress-track">
          <span style={{ width: `${engine.progress * 100}%` }} />
        </div>
        <TransportControls
          status={engine.status}
          onStart={engine.start}
          onPause={engine.pause}
          onReset={engine.reset}
          disabled={!draft.steps.length}
        />
      </section>

      {!active && (
        <section className="session-editor">
          <div className="settings-card">
            <h3>Сессия</h3>
            <label className="field">
              <span>Название</span>
              <input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
            </label>
            <div className="button-row">
              <button type="button" onClick={() => setDraft(cloneDemo())}>
                Демо
              </button>
              <button
                type="button"
                onClick={() =>
                  setDraft({
                    id: uid('session'),
                    title: 'Моя сессия',
                    steps: [createStep()],
                    updatedAt: new Date().toISOString()
                  })
                }
              >
                Новая
              </button>
              <button type="button" onClick={saveDraft}>
                Сохранить
              </button>
            </div>
          </div>

          <div className="steps-list">
            {draft.steps.map((step, index) => (
              <article className="step-card" key={step.id}>
                <div className="step-head">
                  <div>
                    <strong>{step.title}</strong>
                    <p>{stepSummary(step)}</p>
                  </div>
                  <div className="step-actions">
                    <button type="button" onClick={() => moveStep(index, -1)} aria-label="Переместить выше">
                      ↑
                    </button>
                    <button type="button" onClick={() => moveStep(index, 1)} aria-label="Переместить ниже">
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => setDraft({ ...draft, steps: draft.steps.filter((item) => item.id !== step.id) })}
                      aria-label="Удалить этап"
                    >
                      ×
                    </button>
                  </div>
                </div>

                <div className="form-grid">
                  <label className="field">
                    <span>Название</span>
                    <input value={step.title} onChange={(event) => setStep(step.id, { title: event.target.value })} />
                  </label>
                  <label className="field">
                    <span>Секунды</span>
                    <input
                      inputMode="numeric"
                      value={step.duration}
                      onChange={(event) => setStep(step.id, { duration: clamp(Number(event.target.value) || 1, 1, 3600) })}
                    />
                  </label>
                  <label className="field">
                    <span>Режим</span>
                    <select value={step.mode} onChange={(event) => updateMode(step, event.target.value as StepMode)}>
                      <option value="metronome">Метроном</option>
                      <option value="breathing">Дыхание</option>
                    </select>
                  </label>
                </div>

                {step.mode === 'metronome' && step.metronome && (
                  <div className="metronome-step-settings">
                    <div className="step-section-title">Скорость</div>
                    <BpmControl value={step.metronome.bpm} onChange={(bpm) => updateStepBpm(step, bpm)} />

                    <div className="form-grid">
                      <label className="field">
                        <span>Размер</span>
                        <select
                          value={step.metronome.meter}
                          onChange={(event) =>
                            setStep(step.id, { metronome: { ...step.metronome!, meter: event.target.value as Meter } })
                          }
                        >
                          {meters.map((meter) => (
                            <option key={meter} value={meter}>
                              {meter}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="toggle-row compact">
                        <input
                          type="checkbox"
                          checked={step.metronome.accentFirstBeat}
                          onChange={(event) =>
                            setStep(step.id, { metronome: { ...step.metronome!, accentFirstBeat: event.target.checked } })
                          }
                        />
                        <span>Акцент первой доли</span>
                      </label>
                    </div>
                  </div>
                )}

                {step.mode === 'breathing' && step.breathing && (
                  <div className="form-grid">
                    <label className="field wide">
                      <span>Пресет фаз</span>
                      <select
                        value={serializePhases(step.breathing.phases)}
                        onChange={(event) => {
                          const preset =
                            breathingPresets.find((item) => serializePhases(item.phases) === event.target.value) ??
                            breathingPresets[0];
                          setStep(step.id, { breathing: { phases: preset.phases } });
                        }}
                      >
                        {breathingPresets.map((preset) => (
                          <option key={preset.id} value={serializePhases(preset.phases)}>
                            {preset.name}: {serializePhases(preset.phases)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="field wide">
                      <span>Фазы вручную</span>
                      <textarea
                        value={serializePhases(step.breathing.phases)}
                        onChange={(event) => setStep(step.id, { breathing: { phases: parsePhases(event.target.value) } })}
                      />
                    </label>
                  </div>
                )}
              </article>
            ))}
          </div>

          <button className="add-step" type="button" onClick={() => setDraft({ ...draft, steps: [...draft.steps, createStep()] })}>
            Добавить этап
          </button>

          <div className="settings-card">
            <h3>Сохранённые</h3>
            <div className="saved-list">
              {savedSessions.length === 0 && <p className="muted">Пока нет пользовательских сессий.</p>}
              {savedSessions.map((session) => (
                <div className="saved-session" key={session.id}>
                  <button type="button" onClick={() => setDraft(session)}>
                    {session.title}
                  </button>
                  <button type="button" onClick={() => deleteSaved(session.id)} aria-label="Удалить сохранённую сессию">
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
};
