export const DEBUG_AUDIO = false;

export const debugAudio = (event: string, data: Record<string, unknown>) => {
  if (!DEBUG_AUDIO) return;
  console.debug(`[RhythmLab audio] ${event}`, data);
};
