import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft, ChevronLeft, ChevronRight, Home, Lightbulb, Lock, Music, Pause, Play,
  RotateCcw, Settings as SettingsIcon, Shuffle, Star, Volume2, VolumeX, Check,
} from "lucide-react";
import { getLevel, TOTAL_LEVELS, type Difficulty, imageUrl } from "./levels";
import { loadSave, writeSave, defaultSave, type SaveData } from "./storage";
import { sfx, startMusic, stopMusic } from "./audio";

type Screen = { name: "home" } | { name: "levels" } | { name: "settings" } | { name: "play"; level: number };

export function Game() {
  const [save, setSave] = useState<SaveData>(defaultSave);
  const [ready, setReady] = useState(false);
  const [screen, setScreen] = useState<Screen>({ name: "home" });

  useEffect(() => {
    setSave(loadSave());
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready) writeSave(save);
  }, [save, ready]);
  useEffect(() => {
    if (!ready) return;
    if (save.music) {
      const start = () => startMusic();
      window.addEventListener("pointerdown", start, { once: true });
      return () => {
        window.removeEventListener("pointerdown", start);
        stopMusic();
      };
    } else stopMusic();
  }, [save.music, ready]);

  const play = useCallback((s: () => void) => {
    if (save.sound) s();
  }, [save.sound]);

  const go = (s: Screen) => {
    play(sfx.click);
    setScreen(s);
  };

  if (screen.name === "play")
    return (
      <PlayScreen
        key={screen.level}
        level={screen.level}
        save={save}
        sound={play}
        onToggleSound={() => setSave((s) => ({ ...s, sound: !s.sound }))}
        onHome={() => go({ name: "home" })}
        onComplete={(stars) =>
          setSave((s) => ({
            ...s,
            stars: { ...s.stars, [screen.level]: Math.max(stars, s.stars[screen.level] ?? 0) },
            unlocked: Math.max(s.unlocked, Math.min(TOTAL_LEVELS, screen.level + 1)),
            current: Math.min(TOTAL_LEVELS, screen.level + 1),
          }))
        }
        onNext={() => go({ name: "play", level: Math.min(TOTAL_LEVELS, screen.level + 1) })}
      />
    );

  if (screen.name === "levels")
    return <LevelSelect save={save} onBack={() => go({ name: "home" })} onPick={(l) => go({ name: "play", level: l })} />;

  if (screen.name === "settings")
    return <SettingsScreen save={save} setSave={setSave} onBack={() => go({ name: "home" })} />;

  const hasProgress = Object.keys(save.stars).length > 0;
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 px-6 py-10 text-center">
      <div className="grid grid-cols-3 gap-1.5 anim-float">
        {[1, 7, 13, 21, 34, 55, 89, 144, 233].map((l) => (
          <img key={l} src={imageUrl(l, 120)} alt="" className="size-16 rounded-xl object-cover shadow-md sm:size-20" />
        ))}
      </div>
      <div>
        <h1 className="title-3d text-5xl font-bold leading-tight sm:text-7xl">Pick Puzzle Solve</h1>
        <p className="mt-3 text-lg text-muted-foreground">300 picture puzzles · drag, drop, solve!</p>
      </div>
      <div className="flex w-full max-w-xs flex-col gap-4">
        <button className="btn-game bg-primary text-primary-foreground text-2xl" onClick={() => go({ name: "play", level: hasProgress ? save.current : 1 })}>
          <Play className="size-6 fill-current" /> Play
        </button>
        {hasProgress && (
          <button className="btn-game bg-success text-success-foreground" onClick={() => go({ name: "play", level: save.current })}>
            Continue · Level {save.current}
          </button>
        )}
        <button className="btn-game bg-secondary text-secondary-foreground" onClick={() => go({ name: "levels" })}>
          Select Level
        </button>
        <button className="btn-game bg-card text-foreground" onClick={() => go({ name: "settings" })}>
          <SettingsIcon className="size-5" /> Settings
        </button>
      </div>
    </main>
  );
}

/* ---------------- Level select ---------------- */
const GROUPS: { d: Difficulty; from: number; to: number; cls: string }[] = [
  { d: "Easy", from: 1, to: 50, cls: "bg-success text-success-foreground" },
  { d: "Medium", from: 51, to: 100, cls: "bg-secondary text-secondary-foreground" },
  { d: "Hard", from: 101, to: 200, cls: "bg-primary text-primary-foreground" },
  { d: "Expert", from: 201, to: 300, cls: "bg-accent text-accent-foreground" },
];

function LevelSelect({ save, onBack, onPick }: { save: SaveData; onBack: () => void; onPick: (l: number) => void }) {
  const initial = Math.max(0, GROUPS.findIndex((g) => save.unlocked >= g.from && save.unlocked <= g.to));
  const [tab, setTab] = useState(initial);
  const g = GROUPS[tab];
  const totalStars = Object.values(save.stars).reduce((a, b) => a + b, 0);
  return (
    <main className="mx-auto flex min-h-dvh max-w-4xl flex-col gap-5 px-4 py-6">
      <header className="flex items-center justify-between">
        <button className="icon-btn" onClick={onBack} aria-label="Back"><ArrowLeft /></button>
        <h2 className="text-3xl font-bold">Select Level</h2>
        <div className="flex items-center gap-1 rounded-full bg-card px-3 py-2 font-bold shadow-sm">
          <Star className="size-5 fill-sunny text-sunny" /> {totalStars}
        </div>
      </header>
      <div className="grid grid-cols-4 gap-2">
        {GROUPS.map((gr, i) => (
          <button key={gr.d} onClick={() => setTab(i)}
            className={`rounded-2xl px-2 py-2 font-display text-sm font-semibold sm:text-base ${i === tab ? gr.cls : "bg-card text-muted-foreground"}`}>
            {gr.d}
            <div className="text-xs opacity-80">{gr.from}–{gr.to}</div>
          </button>
        ))}
      </div>
      <div className="grid grid-cols-5 gap-2 sm:grid-cols-8 md:grid-cols-10">
        {Array.from({ length: g.to - g.from + 1 }, (_, i) => g.from + i).map((l) => {
          const stars = save.stars[l];
          const locked = l > save.unlocked;
          const current = l === save.unlocked && !stars;
          return (
            <button key={l} disabled={locked} onClick={() => onPick(l)} aria-label={`Level ${l}${locked ? " locked" : ""}`}
              className={`relative flex aspect-square flex-col items-center justify-center rounded-2xl font-display text-lg font-bold shadow-sm transition active:scale-95 ${
                locked ? "bg-muted text-muted-foreground" : stars ? g.cls : "bg-card text-foreground ring-4 ring-sunny"
              } ${current ? "anim-float" : ""}`}>
              {locked ? <Lock className="size-5" /> : l}
              {stars ? (
                <span className="flex">
                  {[1, 2, 3].map((s) => (
                    <Star key={s} className={`size-3 ${s <= stars ? "fill-sunny text-sunny" : "opacity-40"}`} />
                  ))}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </main>
  );
}

/* ---------------- Settings ---------------- */
function SettingsScreen({ save, setSave, onBack }: { save: SaveData; setSave: (f: (s: SaveData) => SaveData) => void; onBack: () => void }) {
  const [confirm, setConfirm] = useState(false);
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-6 px-6 py-8">
      <header className="flex items-center gap-4">
        <button className="icon-btn" onClick={onBack} aria-label="Back"><ArrowLeft /></button>
        <h2 className="text-3xl font-bold">Settings</h2>
      </header>
      <div className="flex flex-col gap-3 rounded-3xl bg-card p-5 shadow-sm">
        <Toggle label="Sound effects" icon={save.sound ? <Volume2 /> : <VolumeX />} on={save.sound} onClick={() => setSave((s) => ({ ...s, sound: !s.sound }))} />
        <Toggle label="Background music" icon={<Music />} on={save.music} onClick={() => setSave((s) => ({ ...s, music: !s.music }))} />
      </div>
      <div className="rounded-3xl bg-card p-5 shadow-sm">
        <p className="mb-3 text-muted-foreground">Progress is saved automatically on this device.</p>
        {confirm ? (
          <div className="flex gap-2">
            <button className="btn-game flex-1 bg-destructive text-destructive-foreground" onClick={() => { setSave(() => ({ ...defaultSave, sound: save.sound, music: save.music })); setConfirm(false); }}>Yes, reset</button>
            <button className="btn-game flex-1 bg-muted text-foreground" onClick={() => setConfirm(false)}>Cancel</button>
          </div>
        ) : (
          <button className="btn-game w-full bg-muted text-foreground" onClick={() => setConfirm(true)}>Reset progress</button>
        )}
      </div>
      <p className="text-center text-sm text-muted-foreground">Photos courtesy of Lorem Picsum / Unsplash photographers.</p>
    </main>
  );
}

function Toggle({ label, icon, on, onClick }: { label: string; icon: React.ReactNode; on: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center justify-between rounded-2xl px-2 py-2 text-lg font-semibold" role="switch" aria-checked={on}>
      <span className="flex items-center gap-3">{icon}{label}</span>
      <span className={`relative h-8 w-14 rounded-full transition ${on ? "bg-success" : "bg-muted"}`}>
        <span className={`absolute top-1 size-6 rounded-full bg-card shadow transition-all ${on ? "left-7" : "left-1"}`} />
      </span>
    </button>
  );
}

/* ---------------- Play ---------------- */
function shuffled<T>(a: T[]): T[] {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

interface Drag { id: number; x: number; y: number }

function PlayScreen({ level, save, sound, onToggleSound, onHome, onComplete, onNext }: {
  level: number; save: SaveData; sound: (f: () => void) => void; onToggleSound: () => void;
  onHome: () => void; onComplete: (stars: number) => void; onNext: () => void;
}) {
  const def = useMemo(() => getLevel(level), [level]);
  const total = def.cols * def.rows;
  const [placed, setPlaced] = useState<Set<number>>(new Set());
  const [tray, setTray] = useState<number[]>(() => shuffled(Array.from({ length: total }, (_, i) => i)));
  const [page, setPage] = useState(0);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [preview, setPreview] = useState(true);
  const [showFull, setShowFull] = useState(false);
  const [hintId, setHintId] = useState<number | null>(null);
  const [hints, setHints] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [paused, setPaused] = useState(false);
  const [done, setDone] = useState<number | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [shakeId, setShakeId] = useState<number | null>(null);
  const [popId, setPopId] = useState<number | null>(null);
  const [retry, setRetry] = useState(0);
  const boardRef = useRef<HTMLDivElement>(null);
  const [boardW, setBoardW] = useState(300);
  const [pageSize, setPageSize] = useState(10);

  // image preload
  useEffect(() => {
    setLoaded(false); setLoadError(false);
    const img = new Image();
    img.onload = () => setLoaded(true);
    img.onerror = () => setLoadError(true);
    img.src = def.image + (retry ? `?r=${retry}` : "");
  }, [def.image, retry]);

  useEffect(() => {
    if (!loaded) return;
    setPreview(true);
    const t = setTimeout(() => setPreview(false), 1800);
    return () => clearTimeout(t);
  }, [loaded]);

  useEffect(() => {
    if (!loaded || paused || done !== null || preview) return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [loaded, paused, done, preview]);

  useEffect(() => {
    const el = boardRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setBoardW(el.clientWidth));
    ro.observe(el);
    const upd = () => setPageSize(window.innerWidth >= 1024 ? 16 : window.innerWidth >= 640 ? 12 : 8);
    upd();
    window.addEventListener("resize", upd);
    return () => { ro.disconnect(); window.removeEventListener("resize", upd); };
  }, []);

  const cw = boardW / def.cols;
  const ch = boardW / def.rows;
  const pages = Math.max(1, Math.ceil(tray.length / pageSize));
  const curPage = Math.min(page, pages - 1);
  const visible = tray.slice(curPage * pageSize, curPage * pageSize + pageSize);
  const trayW = pageSize === 8 ? 64 : 76;
  const trayH = (trayW * def.cols) / def.rows;

  const bg = (id: number, w: number, h: number): React.CSSProperties => {
    const c = id % def.cols, r = Math.floor(id / def.cols);
    return {
      backgroundImage: `url(${def.image})`,
      backgroundSize: `${w * def.cols}px ${h * def.rows}px`,
      backgroundPosition: `${-c * w}px ${-r * h}px`,
    };
  };

  // dragging
  useEffect(() => {
    if (!drag) return;
    const move = (e: PointerEvent) => { e.preventDefault(); setDrag((d) => d && { ...d, x: e.clientX, y: e.clientY }); };
    const up = (e: PointerEvent) => {
      const id = drag.id;
      const rect = boardRef.current?.getBoundingClientRect();
      setDrag(null);
      if (!rect) return;
      const x = e.clientX - rect.left, y = e.clientY - rect.top;
      if (x < 0 || y < 0 || x > rect.width || y > rect.height) return; // dropped outside: back to tray
      const col = Math.floor(x / (rect.width / def.cols));
      const row = Math.floor(y / (rect.height / def.rows));
      if (row * def.cols + col === id) {
        sound(sfx.snap);
        setPopId(id);
        setHintId((h) => (h === id ? null : h));
        setTray((t) => t.filter((p) => p !== id));
        setPlaced((p) => new Set(p).add(id));
      } else {
        sound(sfx.wrong);
        setMistakes((m) => m + 1);
        setShakeId(id);
        setTimeout(() => setShakeId(null), 350);
      }
    };
    window.addEventListener("pointermove", move, { passive: false });
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, [drag?.id, def.cols, def.rows, sound]); // eslint-disable-line react-hooks/exhaustive-deps

  // completion
  useEffect(() => {
    if (placed.size === total && done === null) {
      const stars = hints === 0 && mistakes <= Math.ceil(total / 4) ? 3 : hints <= 2 && mistakes <= total ? 2 : 1;
      setTimeout(() => { setDone(stars); sound(sfx.win); onComplete(stars); }, 400);
    }
  }, [placed.size]); // eslint-disable-line react-hooks/exhaustive-deps

  const startDrag = (e: React.PointerEvent, id: number) => {
    if (paused || done !== null) return;
    e.preventDefault();
    sound(sfx.pick);
    setDrag({ id, x: e.clientX, y: e.clientY });
  };

  const hint = () => {
    if (tray.length === 0) return;
    sound(sfx.click);
    setHints((h) => h + 1);
    const id = tray[Math.floor(Math.random() * tray.length)];
    setHintId(id);
    setTray((t) => [id, ...t.filter((p) => p !== id)]);
    setPage(0);
    setShowFull(true);
    setTimeout(() => setShowFull(false), 1500);
  };
  const doShuffle = () => { sound(sfx.click); setTray((t) => shuffled(t)); setPage(0); };
  const restart = () => {
    sound(sfx.click);
    setPlaced(new Set()); setTray(shuffled(Array.from({ length: total }, (_, i) => i)));
    setHints(0); setMistakes(0); setSeconds(0); setDone(null); setHintId(null); setPage(0); setPaused(false);
    setPreview(true); setTimeout(() => setPreview(false), 1800);
  };

  const mm = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

  return (
    <main className="mx-auto flex min-h-dvh max-w-6xl flex-col gap-3 px-3 py-3 select-none sm:px-6">
      {/* top bar */}
      <header className="flex items-center justify-between gap-2">
        <div className="flex gap-2">
          <button className="icon-btn" onClick={onHome} aria-label="Home"><Home /></button>
          <button className="icon-btn" onClick={() => { sound(sfx.click); setPaused(true); }} aria-label="Pause"><Pause /></button>
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold leading-none">Level {level}</h2>
          <div className="text-sm font-semibold text-muted-foreground">{def.difficulty} · {total} pieces · {mm}</div>
        </div>
        <button className="icon-btn" onClick={onToggleSound} aria-label={save.sound ? "Mute" : "Unmute"}>
          {save.sound ? <Volume2 /> : <VolumeX />}
        </button>
      </header>

      {/* progress */}
      <div className="flex items-center gap-3">
        <div className="h-4 flex-1 overflow-hidden rounded-full bg-card shadow-inner">
          <div className="h-full rounded-full bg-success transition-all duration-300" style={{ width: `${(placed.size / total) * 100}%` }} />
        </div>
        <span className="whitespace-nowrap font-display text-sm font-semibold">
          {placed.size} placed · {total - placed.size} left
        </span>
      </div>

      <div className="flex flex-1 flex-col items-center gap-4 lg:flex-row lg:items-start lg:justify-center">
        {/* board */}
        <div ref={boardRef}
          className="relative aspect-square w-full max-w-[min(92vw,56vh)] touch-none overflow-hidden rounded-3xl bg-board shadow-xl ring-8 ring-card lg:max-w-[min(600px,78vh)]">
          {loadError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4 text-center">
              <p className="font-semibold">This picture couldn't load. Check your connection.</p>
              <button className="btn-game bg-primary text-primary-foreground" onClick={() => setRetry((r) => r + 1)}>Retry</button>
            </div>
          ) : !loaded ? (
            <div className="absolute inset-0 flex items-center justify-center font-display text-lg text-muted-foreground">Loading picture…</div>
          ) : (
            <>
              <img src={def.image} alt="" draggable={false}
                className="pointer-events-none absolute inset-0 size-full transition-opacity duration-700"
                style={{ opacity: preview || showFull || done !== null ? 1 : def.ghostOpacity }} />
              {/* grid lines */}
              {!preview && done === null && (
                <div className="pointer-events-none absolute inset-0"
                  style={{
                    backgroundImage: `linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)`,
                    backgroundSize: `${cw}px ${ch}px`,
                  }} />
              )}
              {[...placed].map((id) => (
                <div key={id} className={`absolute ${popId === id ? "anim-pop" : ""}`}
                  style={{ left: (id % def.cols) * cw, top: Math.floor(id / def.cols) * ch, width: cw, height: ch, ...bg(id, cw, ch), opacity: showFull ? 0 : 1 }} />
              ))}
              {hintId !== null && (
                <div className="pointer-events-none absolute rounded-md anim-glow"
                  style={{ left: (hintId % def.cols) * cw, top: Math.floor(hintId / def.cols) * ch, width: cw, height: ch }} />
              )}
              {preview && (
                <div className="absolute inset-x-0 bottom-3 text-center">
                  <span className="rounded-full bg-card px-4 py-1 font-display font-semibold shadow">Remember the picture!</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* tray + controls */}
        <div className="flex w-full max-w-[min(92vw,56vh)] flex-col gap-3 lg:max-w-sm">
          <div className="rounded-3xl bg-card p-3 shadow-md">
            <div className="flex min-h-[9rem] flex-wrap content-start justify-center gap-2">
              {loaded && !preview && visible.map((id) => (
                <div key={id} onPointerDown={(e) => startDrag(e, id)}
                  className={`cursor-grab touch-none rounded-lg shadow-md ring-2 ring-card transition-transform hover:scale-105 ${drag?.id === id ? "opacity-20" : ""} ${shakeId === id ? "anim-shake" : ""} ${hintId === id ? "ring-4 ring-sunny" : ""}`}
                  style={{ width: trayW, height: trayH, ...bg(id, trayW, trayH) }}
                  aria-label={`Puzzle piece ${id + 1}`} role="button" />
              ))}
              {tray.length === 0 && <p className="self-center font-display text-lg text-success">All pieces placed!</p>}
            </div>
            {pages > 1 && (
              <div className="mt-2 flex items-center justify-between">
                <button className="icon-btn" onClick={() => setPage((curPage - 1 + pages) % pages)} aria-label="Previous pieces"><ChevronLeft /></button>
                <span className="text-sm font-semibold text-muted-foreground">Pieces {curPage + 1}/{pages}</span>
                <button className="icon-btn" onClick={() => setPage((curPage + 1) % pages)} aria-label="Next pieces"><ChevronRight /></button>
              </div>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button className="btn-game bg-sunny text-foreground px-2 text-base" onClick={hint} disabled={!loaded || tray.length === 0}><Lightbulb className="size-5" /> Hint</button>
            <button className="btn-game bg-secondary text-secondary-foreground px-2 text-base" onClick={doShuffle} disabled={!loaded}><Shuffle className="size-5" /> Shuffle</button>
            <button className="btn-game bg-accent text-accent-foreground px-2 text-base" onClick={restart}><RotateCcw className="size-5" /> Restart</button>
          </div>
          <p className="text-center text-sm text-muted-foreground">Drag a piece onto its spot in the picture. It snaps in when it's right!</p>
        </div>
      </div>

      {/* drag ghost */}
      {drag && (
        <div className="pointer-events-none fixed z-50 rounded-md shadow-2xl ring-2 ring-card"
          style={{ left: drag.x - cw / 2, top: drag.y - ch / 2, width: cw, height: ch, ...bg(drag.id, cw, ch), transform: "scale(1.05)" }} />
      )}

      {paused && (
        <Overlay>
          <h3 className="text-4xl font-bold">Paused</h3>
          <button className="btn-game w-full bg-primary text-primary-foreground" onClick={() => { sound(sfx.click); setPaused(false); }}><Play className="size-5 fill-current" /> Resume</button>
          <button className="btn-game w-full bg-accent text-accent-foreground" onClick={restart}><RotateCcw className="size-5" /> Restart</button>
          <button className="btn-game w-full bg-muted text-foreground" onClick={onHome}><Home className="size-5" /> Home</button>
        </Overlay>
      )}

      {done !== null && (
        <>
          <Confetti />
          <Overlay>
            <h3 className="title-3d text-4xl font-bold">Level Completed!</h3>
            <div className="flex gap-2">
              {[1, 2, 3].map((s) => (
                <Star key={s} className={`size-12 anim-pop ${s <= done ? "fill-sunny text-sunny" : "text-muted"}`} style={{ animationDelay: `${s * 0.15}s` }} />
              ))}
            </div>
            <p className="text-muted-foreground">Time {mm} · Hints {hints} · Misses {mistakes}</p>
            {level < TOTAL_LEVELS ? (
              <button className="btn-game w-full bg-success text-success-foreground" onClick={onNext}><Check className="size-5" /> Next Level</button>
            ) : (
              <p className="font-display text-xl text-success">You finished all 300 levels!</p>
            )}
            <div className="flex w-full gap-2">
              <button className="btn-game flex-1 bg-accent text-accent-foreground" onClick={restart}><RotateCcw className="size-5" /> Restart</button>
              <button className="btn-game flex-1 bg-muted text-foreground" onClick={onHome}><Home className="size-5" /> Home</button>
            </div>
          </Overlay>
        </>
      )}
    </main>
  );
}

function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-foreground/40 p-6 backdrop-blur-sm">
      <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-3xl bg-card p-6 text-center shadow-2xl anim-pop">{children}</div>
    </div>
  );
}

function Confetti() {
  const colors = ["var(--primary)", "var(--secondary)", "var(--sunny)", "var(--success)", "var(--accent)"];
  const bits = useMemo(() => Array.from({ length: 70 }, (_, i) => ({
    left: Math.random() * 100, delay: Math.random() * 0.8, dur: 2 + Math.random() * 2, color: colors[i % colors.length],
  })), []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <>
      {bits.map((b, i) => (
        <span key={i} className="confetti" style={{ left: `${b.left}vw`, background: b.color, animationDelay: `${b.delay}s`, animationDuration: `${b.dur}s` }} />
      ))}
    </>
  );
}
