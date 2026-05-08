import type { WakeLockState } from '../hooks/useWakeLock';

interface WakeLockIndicatorProps {
  enabled: boolean;
  active: boolean;
  wakeLock: WakeLockState;
}

export const WakeLockIndicator = ({ enabled, active, wakeLock }: WakeLockIndicatorProps) => {
  if (!active) return null;

  let label = 'Запрос удержания экрана';
  if (!enabled) label = 'Удержание экрана отключено';
  else if (!wakeLock.isSupported) label = 'Удержание экрана недоступно';
  else if (wakeLock.isActive) label = 'Экран удерживается';
  else if (wakeLock.error) label = 'Удержание экрана недоступно';

  return <p className="wake-lock-indicator">{label}</p>;
};
