let ctx: AudioContext | null = null;
function ac() {
  if (typeof window === "undefined") return null;
  if (!ctx) ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function tone(freq: number, dur: number, type: OscillatorType = "sine", vol = 0.15, delay = 0) {
  const c = ac();
  if (!c) return;
  const t = c.currentTime + delay;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(c.destination);
  o.start(t);
  o.stop(t + dur + 0.05);
}

export const sfx = {
  pick: () => tone(520, 0.08, "triangle", 0.1),
  snap: () => {
    tone(660, 0.1, "triangle", 0.15);
    tone(990, 0.15, "sine", 0.12, 0.06);
  },
  wrong: () => tone(180, 0.18, "sawtooth", 0.06),
  click: () => tone(800, 0.05, "square", 0.05),
  win: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.3, "triangle", 0.15, i * 0.12)),
};

let musicTimer: ReturnType<typeof setInterval> | null = null;
const melody = [392, 440, 523, 587, 659, 587, 523, 440];
export function startMusic() {
  if (musicTimer) return;
  let i = 0;
  musicTimer = setInterval(() => {
    const f = melody[i % melody.length] ?? 440;
    tone(f, 0.45, "sine", 0.04);
    if (i % 4 === 0) tone(f / 2, 0.9, "triangle", 0.03);
    i++;
  }, 420);
}
export function stopMusic() {
  if (musicTimer) clearInterval(musicTimer);
  musicTimer = null;
}
