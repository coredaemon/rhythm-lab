import { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { FirstRunNotice } from './components/FirstRunNotice';
import { SoundSettings } from './components/SoundSettings';
import { BreathingView } from './components/BreathingView';
import { MetronomeView } from './components/MetronomeView';
import { SessionsView } from './components/SessionsView';
import { loadSessions, loadSettings, saveSessions, saveSettings } from './storage/localStorage';
import type { AppSettings, RhythmSession } from './types';

export const App = () => {
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [sessions, setSessions] = useState<RhythmSession[]>(() => loadSessions());

  useEffect(() => {
    document.documentElement.dataset.theme = settings.theme;
    saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    saveSessions(sessions);
  }, [sessions]);

  return (
    <div className="app-shell">
      <Header
        activeMode={settings.activeMode}
        theme={settings.theme}
        onModeChange={(activeMode) => setSettings({ ...settings, activeMode })}
        onThemeChange={(theme) => setSettings({ ...settings, theme })}
      />

      {!settings.firstRunDismissed && (
        <FirstRunNotice onDismiss={() => setSettings({ ...settings, firstRunDismissed: true })} />
      )}

      {settings.activeMode === 'breathing' && <BreathingView settings={settings} onSettingsChange={setSettings} />}
      {settings.activeMode === 'metronome' && <MetronomeView settings={settings} onSettingsChange={setSettings} />}
      {settings.activeMode === 'sessions' && (
        <SessionsView settings={settings} savedSessions={sessions} onSaveSessions={setSessions} />
      )}

      <SoundSettings
        enabled={settings.soundEnabled}
        volume={settings.volume}
        keepScreenAwake={settings.keepScreenAwake}
        onEnabledChange={(soundEnabled) => setSettings({ ...settings, soundEnabled })}
        onVolumeChange={(volume) => setSettings({ ...settings, volume })}
        onKeepScreenAwakeChange={(keepScreenAwake) => setSettings({ ...settings, keepScreenAwake })}
      />
    </div>
  );
};
