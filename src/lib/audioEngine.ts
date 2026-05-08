export type ClickKind = 'regular' | 'accent' | 'stage' | 'finish';

export class AudioEngine {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private volume = 0.7;
  private enabled = true;

  async unlock() {
    if (!this.context) {
      this.context = new AudioContext();
      this.master = this.context.createGain();
      this.master.connect(this.context.destination);
      this.updateMaster();
    }

    if (this.context.state === 'suspended') {
      await this.context.resume();
    }

    // Unlocking mobile audio should not emit a metronome-like tick.
  }

  get currentTime() {
    return this.context?.currentTime ?? 0;
  }

  get state() {
    return this.context?.state ?? 'closed';
  }

  setVolume(volume: number) {
    this.volume = Number.isFinite(volume) ? Math.min(1, Math.max(0, volume)) : 0.85;
    this.updateMaster();
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    this.updateMaster();
  }

  playClick(kind: ClickKind, when = this.currentTime, duration?: number) {
    if (!this.context || !this.master || !this.enabled) return;
    if ((kind === 'regular' || kind === 'accent') && when < this.context.currentTime) return;
    const startTime = kind === 'regular' || kind === 'accent' ? when : Math.max(when, this.context.currentTime + 0.001);

    if (kind === 'regular' || kind === 'accent') {
      this.playClassicMetronomeClick(kind, startTime);
      return;
    }

    const settings = {
      stage: { frequency: 540, gain: 0.16, duration: 0.12 },
      finish: { frequency: 420, gain: 0.2, duration: 0.22 }
    }[kind];

    const length = Math.max(0.01, duration ?? settings.duration);
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(settings.frequency, startTime);
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(settings.gain, startTime + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + length);

    oscillator.connect(gain);
    gain.connect(this.master);
    oscillator.start(startTime);
    oscillator.stop(startTime + length + 0.02);
  }

  private playClassicMetronomeClick(kind: 'regular' | 'accent', when: number) {
    if (!this.context || !this.master) return;

    const isAccent = kind === 'accent';
    const bodyFrequency = isAccent ? 2350 : 2200;
    const snapFrequency = isAccent ? 4100 : 3800;
    const bodyGain = isAccent ? 0.34 : 0.3;
    const snapGain = isAccent ? 0.18 : 0.16;
    const noiseGain = isAccent ? 0.08 : 0.07;
    const duration = isAccent ? 0.052 : 0.046;

    const output = this.context.createGain();
    output.gain.setValueAtTime(0.92, when);
    output.gain.setValueAtTime(0.92, when + duration);
    output.gain.exponentialRampToValueAtTime(0.0001, when + duration + 0.012);
    output.connect(this.master);

    this.playClickOscillator(bodyFrequency, bodyGain, duration, 'triangle', when, output);
    this.playClickOscillator(snapFrequency, snapGain, 0.018, 'square', when, output);
    this.playNoiseSnap(noiseGain, 0.018, when, output);

    window.setTimeout(() => output.disconnect(), Math.max(0, (when - this.context.currentTime + duration + 0.05) * 1000));
  }

  private playClickOscillator(
    frequency: number,
    peakGain: number,
    duration: number,
    type: OscillatorType,
    when: number,
    destination: AudioNode
  ) {
    if (!this.context) return;

    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, when);
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.exponentialRampToValueAtTime(peakGain, when + 0.0015);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);

    oscillator.connect(gain);
    gain.connect(destination);
    oscillator.start(when);
    oscillator.stop(when + duration + 0.004);
  }

  private playNoiseSnap(peakGain: number, duration: number, when: number, destination: AudioNode) {
    if (!this.context) return;

    const sampleCount = Math.max(1, Math.floor(this.context.sampleRate * duration));
    const buffer = this.context.createBuffer(1, sampleCount, this.context.sampleRate);
    const data = buffer.getChannelData(0);

    for (let index = 0; index < sampleCount; index += 1) {
      const decay = 1 - index / sampleCount;
      data[index] = (Math.random() * 2 - 1) * decay;
    }

    const source = this.context.createBufferSource();
    const filter = this.context.createBiquadFilter();
    const gain = this.context.createGain();

    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1800, when);
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.exponentialRampToValueAtTime(peakGain, when + 0.001);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);

    source.buffer = buffer;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(destination);
    source.start(when);
    source.stop(when + duration + 0.002);
  }

  playFinish() {
    if (!this.context) return;
    this.playClick('finish', this.context.currentTime + 0.01, 0.18);
    this.playClick('stage', this.context.currentTime + 0.2, 0.16);
    this.playClick('finish', this.context.currentTime + 0.39, 0.24);
  }

  private updateMaster() {
    if (!this.master) return;
    this.master.gain.value = this.enabled ? (Number.isFinite(this.volume) ? this.volume : 0.85) : 0;
  }
}

export const audioEngine = new AudioEngine();
