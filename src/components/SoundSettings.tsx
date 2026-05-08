interface SoundSettingsProps {
  enabled: boolean;
  volume: number;
  onEnabledChange: (enabled: boolean) => void;
  onVolumeChange: (volume: number) => void;
}

export const SoundSettings = ({ enabled, volume, onEnabledChange, onVolumeChange }: SoundSettingsProps) => (
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
  </section>
);
