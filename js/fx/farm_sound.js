// Original, deterministic material sounds. No recordings or network requests.
export const FARM_SOUND_KEY = 'enter-the-market.farm-sounds';
const durations = { plant: .12, water: .24, sale: .20 };

export function renderFarmCue(name, sampleRate) {
  if (!Object.hasOwn(durations, name)) return null;
  const length = Math.ceil(durations[name] * sampleRate);
  const samples = new Float32Array(length);
  let seed = 36111, slow = 0, previous = 0;
  const pulse = (t, delay, attack, decay) => {
    const x = t - delay;
    return x < 0 ? 0 : (1 - Math.exp(-x / attack)) * Math.exp(-x / decay);
  };
  const sine = (t, hz) => Math.sin(2 * Math.PI * hz * t);
  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const noise = seed / 2147483648 - 1;
    slow += (noise - slow) * (1 - Math.exp(-11000 / sampleRate));
    const grain = slow - previous;
    previous = slow;
    let s;
    if (name === 'plant') {
      s = .28 * sine(t, 150) * pulse(t, 0, .003, .025)
        + grain * (.4 * pulse(t, 0, .0015, .016) + .25 * pulse(t, .028, .002, .014));
    } else if (name === 'water') {
      s = .47 * grain * pulse(t, 0, .025, .063)
        + .14 * sine(t, 810 - 2500 * t) * pulse(t, .028, .003, .03)
        + .08 * sine(t, 460 + 840 * t) * pulse(t, .087, .004, .039);
    } else {
      s = .45 * grain * pulse(t, 0, .002, .016)
        + .18 * sine(t, 203) * pulse(t, .023, .003, .025)
        + .14 * sine(t, 911) * pulse(t, .039, .002, .058)
        + .09 * sine(t, 1379) * pulse(t, .043, .002, .045);
    }
    samples[i] = s * Math.min(1, (length - i - 1) / (sampleRate * .02));
  }
  return samples;
}

export function createFarmSound({ makeContext, readPreference, writePreference } = {}) {
  let enabled = false, context = null, volume = null, pending = false;
  const cache = new Map(), lastPlayed = new Map();
  try { enabled = readPreference?.() === 'on'; } catch {}
  function activate() {
    if (!enabled || !makeContext || pending) return;
    try {
      if (!context) {
        context = makeContext();
        volume = context.createGain();
        volume.gain.value = .34;
        volume.connect(context.destination);
      }
      if (context.state === 'running') return;
      pending = true;
      Promise.resolve(context.resume()).catch(() => {}).finally(() => { pending = false; });
    } catch { pending = false; }
  }
  function setEnabled(value) {
    enabled = !!value;
    if (volume) volume.gain.value = enabled ? .34 : 0;
    try { writePreference?.(enabled ? 'on' : 'off'); } catch {}
    if (enabled) activate();
  }
  function play(name) {
    if (!enabled || context?.state !== 'running') return;
    try {
      const now = context.currentTime;
      const last = lastPlayed.get(name);
      if (name !== 'sale' && last !== undefined && now - last < .065) return;
      let buffer = cache.get(name);
      if (!buffer) {
        const samples = renderFarmCue(name, context.sampleRate);
        if (!samples) return;
        buffer = context.createBuffer(1, samples.length, context.sampleRate);
        buffer.getChannelData(0).set(samples);
        cache.set(name, buffer);
      }
      const source = context.createBufferSource();
      source.buffer = buffer;
      source.connect(volume);
      source.start();
      lastPlayed.set(name, now);
    } catch { /* Audio never gates a gameplay action. */ }
  }
  return { activate, play, setEnabled, isEnabled: () => enabled };
}
