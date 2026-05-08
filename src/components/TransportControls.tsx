import type { RuntimeStatus } from '../types';

interface TransportControlsProps {
  status: RuntimeStatus;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  disabled?: boolean;
}

export const TransportControls = ({ status, onStart, onPause, onReset, disabled }: TransportControlsProps) => (
  <div className="transport">
    {status === 'running' ? (
      <button className="primary-action" type="button" onClick={onPause}>
        Пауза
      </button>
    ) : (
      <button className="primary-action" type="button" onClick={onStart} disabled={disabled}>
        {status === 'paused' ? 'Продолжить' : 'Старт'}
      </button>
    )}
    <button className="secondary-action" type="button" onClick={onReset}>
      Сброс
    </button>
  </div>
);
