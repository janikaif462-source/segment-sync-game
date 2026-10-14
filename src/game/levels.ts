import { PHOTO_IDS } from "./photoIds";

export const TOTAL_LEVELS = 300;

export type Difficulty = "Easy" | "Medium" | "Hard" | "Expert";

export interface LevelDef {
  level: number;
  difficulty: Difficulty;
  cols: number;
  rows: number;
  image: string;
  ghostOpacity: number;
}

export function difficultyOf(level: number): Difficulty {
  if (level <= 50) return "Easy";
  if (level <= 100) return "Medium";
  if (level <= 200) return "Hard";
  return "Expert";
}

/** Grid size grows smoothly: 2x2 at level 1 up to 9x9 at level 300. */
function gridFor(level: number): [number, number] {
  let n: number;
  if (level <= 50) n = 2 + Math.floor(((level - 1) / 50) * 3); // 2..4
  else if (level <= 100) n = 4 + Math.floor(((level - 51) / 50) * 2); // 4..5
  else if (level <= 200) n = 5 + Math.floor(((level - 101) / 100) * 2.99); // 5..7
  else n = 7 + Math.floor(((level - 201) / 100) * 2.99); // 7..9
  // alternate an extra column on odd levels for gradual increments
  const cols = level > 1 && level % 2 === 0 ? n + 1 : n;
  return [Math.min(cols, 10), n];
}

export function imageUrl(level: number, size = 800) {
  const id = PHOTO_IDS[(level - 1) % PHOTO_IDS.length];
  return `https://picsum.photos/id/${id}/${size}/${size}`;
}

export function getLevel(level: number): LevelDef {
  const [cols, rows] = gridFor(level);
  const d = difficultyOf(level);
  return {
    level,
    difficulty: d,
    cols,
    rows,
    image: imageUrl(level),
    ghostOpacity: d === "Easy" ? 0.3 : d === "Medium" ? 0.2 : d === "Hard" ? 0.12 : 0.07,
  };
}
