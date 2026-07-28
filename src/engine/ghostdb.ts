/**
 * Ghost DB — Master Spec §2.7 (offline async mirror model)
 *
 * Zero-login, COPPA-safe: mirrors carry only a nickname and an
 * activated-token array. No accounts, no PII.
 *
 * GhostDb is an interface so the mock can later be swapped for real
 * Next.js API routes (GET /api/wanted, POST /api/breach) without any
 * change to stage components.
 */

export interface DefenseMirror {
  studentId: string;
  nickname: string;
  templateId: string; // which royal bulletin template their bird defends
  activeTokenIds: string[]; // defense tokens fused into their bird
  breachCount: number;
  defendCount: number;
  scar?: number; // permanent baseline penalty from being poisoned (accumulates)
}

export interface GhostDb {
  /** Async GET: 3 random classmate defense mirrors (never your own). */
  fetchWantedBoard(selfNickname: string | null): Promise<DefenseMirror[]>;
  /** Async POST: minimal counter update { targetStudentId, breachCount: +1 }. */
  postBreach(targetStudentId: string, scarDelta?: number): Promise<void>;
  postDefend(targetStudentId: string): Promise<void>;
  /** Upsert the local player's own defense mirror. */
  saveOwnMirror(mirror: DefenseMirror): Promise<void>;
  fetchLeaderboard(): Promise<DefenseMirror[]>;
}

const STORE_KEY = "lucerna_ghost_db_v1";

const SEED_MIRRORS: DefenseMirror[] = [
  { studentId: "gh_01", nickname: "MothQueen", templateId: "tpl_02", activeTokenIds: ["token_history"], breachCount: 1, defendCount: 4 },
  { studentId: "gh_02", nickname: "Sir Bytealot", templateId: "tpl_03", activeTokenIds: ["token_history", "token_guard_seal"], breachCount: 0, defendCount: 6 },
  { studentId: "gh_03", nickname: "PixelWitch", templateId: "tpl_04", activeTokenIds: ["token_sci_fi_003"], breachCount: 3, defendCount: 1 },
  { studentId: "gh_04", nickname: "Captain Crumb", templateId: "tpl_05", activeTokenIds: ["token_fruit_madness"], breachCount: 5, defendCount: 0 },
  { studentId: "gh_05", nickname: "Nocturne", templateId: "tpl_06", activeTokenIds: ["token_history", "token_guard_seal"], breachCount: 0, defendCount: 8 }
];

function hasStorage(): boolean {
  return typeof window !== "undefined" && !!window.localStorage;
}

function load(): DefenseMirror[] {
  if (!hasStorage()) return [...SEED_MIRRORS];
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (!raw) {
      window.localStorage.setItem(STORE_KEY, JSON.stringify(SEED_MIRRORS));
      return [...SEED_MIRRORS];
    }
    return JSON.parse(raw) as DefenseMirror[];
  } catch {
    return [...SEED_MIRRORS];
  }
}

function save(all: DefenseMirror[]) {
  if (hasStorage()) window.localStorage.setItem(STORE_KEY, JSON.stringify(all));
}

/** LocalStorage-backed mock. Simulates async latency so the UI's loading states are real. */
export class LocalGhostDb implements GhostDb {
  private delay(ms = 350) {
    return new Promise((r) => setTimeout(r, ms));
  }

  async fetchWantedBoard(selfNickname: string | null): Promise<DefenseMirror[]> {
    await this.delay();
    const pool = load().filter((m) => m.nickname !== selfNickname);
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3);
  }

  async postBreach(targetStudentId: string, scarDelta = 0.15): Promise<void> {
    await this.delay(150);
    const all = load();
    const t = all.find((m) => m.studentId === targetStudentId);
    if (t) {
      t.breachCount += 1;
      t.scar = Math.min(0.6, (t.scar ?? 0) + scarDelta); // permanent damage, capped
    }
    save(all);
  }

  async postDefend(targetStudentId: string): Promise<void> {
    await this.delay(150);
    const all = load();
    const t = all.find((m) => m.studentId === targetStudentId);
    if (t) t.defendCount += 1;
    save(all);
  }

  async saveOwnMirror(mirror: DefenseMirror): Promise<void> {
    await this.delay(150);
    const all = load();
    const idx = all.findIndex((m) => m.studentId === mirror.studentId);
    if (idx >= 0) all[idx] = mirror;
    else all.push(mirror);
    save(all);
  }

  async fetchLeaderboard(): Promise<DefenseMirror[]> {
    await this.delay(200);
    return load().sort((a, b) => b.defendCount - a.defendCount || a.breachCount - b.breachCount);
  }
}
