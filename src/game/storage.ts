export interface SaveData {
  unlocked: number;
  stars: Record<number, number>;
  sound: boolean;
  music: boolean;
  current: number;
}

const KEY = "pick-puzzle-solve-v1";
export const defaultSave: SaveData = { unlocked: 1, stars: {}, sound: true, music: false, current: 1 };

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...defaultSave };
    return { ...defaultSave, ...JSON.parse(raw) };
  } catch {
    return { ...defaultSave };
  }
}

export function writeSave(s: SaveData) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}
