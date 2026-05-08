interface SoundSettingsProps {
  enabled: boolean;
  volume: number;
  keepScreenAwake: boolean;
  onEnabledChange: (enabled: boolean) => void;
  onVolumeChange: (volume: number) => void;
  onKeepScreenAwakeChange: (enabled: boolean) => void;
}

const wakeLockSupported = () => typeof navigator !== 'undefined' && 'wakeLock' in navigator;

export const SoundSettings = ({
  enabled,
  volume,
  keepScreenAwake,
  onEnabledChange,
  onVolumeChange,
  onKeepScreenAwakeChange
}: SoundSettingsProps) => (
  <section className="settings-card sound-card">
    <label className="toggle-row">
      <input type="checkbox" checked={enabled} onChange={(event) => onEnabledChange(event.target.checked)} />
      <span>Звук</span>
    </label>
    <label className="field grow">
      <span>Громкость</span>
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={volume}
        disabled={!enabled}
        onChange={(event) => onVolumeChange(Number(event.target.value))}
      />
    </label>
    <label className="toggle-row wake-toggle">
      <input
        type="checkbox"
        checked={keepScreenAwake}
        onChange={(event) => onKeepScreenAwakeChange(event.target.checked)}
      />
      <span>
        Не выключать экран
        <small>
          {wakeLockSupported()
            ? 'Пока идёт практика, приложение будет пытаться удерживать экран включённым.'
            : 'На этом устройстве удержание экрана может не поддерживаться браузером.'}
        </small>
      </span>
    </label>
  </section>
);
