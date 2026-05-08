import { useEffect, useState } from 'react';
import { clamp } from '../lib/time';

const bpmMarks = [
  { value: 30, label: 'медленно' },
  { value: 90, label: 'спокойно' },
  { value: 120, label: 'умеренно' },
  { value: 160, label: 'быстро' },
  { value: 240, label: 'очень быстро' }
];

const bpmPresets = [60, 90, 120, 150, 180];

interface BpmControlProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
}

export const BpmControl = ({ value, onChange, min = 30, max = 240, step = 1, disabled }: BpmControlProps) => {
  const safeValue = clamp(Math.round(value || min), min, max);
  const [draftValue, setDraftValue] = useState(String(safeValue));

  useEffect(() => {
    setDraftValue(String(safeValue));
  }, [safeValue]);

  const commitValue = (nextValue: number) => {
    const normalized = clamp(Math.round(nextValue || safeValue), min, max);
    onChange(normalized);
    setDraftValue(String(normalized));
  };

  const handleInputChange = (rawValue: string) => {
    const numericOnly = rawValue.replace(/\D/g, '');
    setDraftValue(numericOnly);

    if (numericOnly) {
      const numericValue = Number(numericOnly);
      if (numericValue >= min && numericValue <= max) {
        onChange(numericValue);
      }
    }
  };

  const handleBlur = () => {
    if (!draftValue) {
      setDraftValue(String(safeValue));
      return;
    }

    commitValue(Number(draftValue));
  };

  return (
    <div className="bpm-control">
      <div className="bpm-control-top">
        <button type="button" onClick={() => commitValue(safeValue - 5)} disabled={disabled}>
          −5
        </button>
        <button type="button" onClick={() => commitValue(safeValue - 1)} disabled={disabled}>
          −1
        </button>
        <label className="bpm-value-field">
          <span>{safeValue} BPM</span>
          <input
            inputMode="numeric"
            pattern="[0-9]*"
            value={draftValue}
            disabled={disabled}
            aria-label="BPM"
            onChange={(event) => handleInputChange(event.target.value)}
            onBlur={handleBlur}
          />
        </label>
        <button type="button" onClick={() => commitValue(safeValue + 1)} disabled={disabled}>
          +1
        </button>
        <button type="button" onClick={() => commitValue(safeValue + 5)} disabled={disabled}>
          +5
        </button>
      </div>

      <input
        className="bpm-slider"
        type="range"
        min={min}
        max={max}
        step={step}
        value={safeValue}
        disabled={disabled}
        onChange={(event) => commitValue(Number(event.target.value))}
      />

      <div className="bpm-scale" aria-hidden="true">
        {bpmMarks.map((mark) => (
          <span key={mark.value}>
            <strong>{mark.value}</strong>
            {mark.label}
          </span>
        ))}
      </div>

      <div className="bpm-presets" aria-label="Быстрые BPM-пресеты">
        {bpmPresets.map((preset) => (
          <button
            key={preset}
            type="button"
            className={preset === safeValue ? 'active' : ''}
            disabled={disabled}
            onClick={() => commitValue(preset)}
          >
            {preset}
          </button>
        ))}
      </div>
    </div>
  );
};
