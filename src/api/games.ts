// src/api/games.ts
import { api } from "./client";

/* ------ RAW types from backend ------ */
export type RawGameStatus = "Created" | "InProgress" | "Won" | "Lost";

export interface RawCell {
  x: number;
  y: number;
  isRevealed: boolean;
  isFlagged: boolean;
  isMine?: boolean | null;
  adjacentMines?: number | null;
  adjacentMinesCount?: number | null;
}

export interface RawGameState {
  gameStatus: RawGameStatus;
  gameBoard?: RawCell[][];
  cells?: RawCell[];
  width?: number;
  height?: number;
  rows?: number;
  cols?: number;

  gameId?: string | null;
  id?: string | null;
  mines?: number;
  flagsLeft?: number;
}

/* ------ Front DTO ------ */
export type Difficulty = "Easy" | "Medium" | "Hard" | "Custom";
export type GameStatus = RawGameStatus;

export interface CellDto {
  x: number;
  y: number;
  isRevealed: boolean;
  isFlagged: boolean;
  adjacentMines: number;
  isMine?: boolean;
}

export interface GameStateDto {
  gameId: string;
  status: GameStatus;
  rows: number;
  cols: number;
  mines: number;
  flagsLeft: number;
  cells: CellDto[];
}

/* ------ helpers ------ */
const API_BASE = import.meta.env.VITE_API_BASE as string;
const ZERO_GUID = "00000000-0000-0000-0000-000000000000";

function isNonEmptyGuid(v: unknown): v is string {
  return (
    typeof v === "string" &&
    v.length > 0 &&
    v !== ZERO_GUID
  );
}

function pickGameId(raw: RawGameState, fallback?: string): string {
  if (isNonEmptyGuid(raw.gameId)) return raw.gameId;
  if (isNonEmptyGuid(raw.id)) return raw.id;
  return fallback ?? "";
}

/* ------ mapper RAW -> DTO ------ */
function toGameStateDto(raw: RawGameState, fallbackGameId?: string): GameStateDto {
  const rows = raw.rows ?? raw.height ?? 0;
  const cols = raw.cols ?? raw.width ?? 0;

  let cellsRaw: RawCell[] | RawCell[][] = raw.cells ?? raw.gameBoard ?? [];
  if (Array.isArray(cellsRaw) && Array.isArray((cellsRaw as RawCell[][])[0])) {
    cellsRaw = (cellsRaw as RawCell[][]).flat();
  }

  const cells: CellDto[] = (cellsRaw as RawCell[]).map((c) => ({
    x: c.x,
    y: c.y,
    isRevealed: Boolean(c.isRevealed),
    isFlagged: Boolean(c.isFlagged),
    isMine: c.isMine ?? undefined,
    adjacentMines: c.adjacentMines ?? c.adjacentMinesCount ?? 0,
  }));

  return {
    gameId: pickGameId(raw, fallbackGameId),
    status: raw.gameStatus,
    rows,
    cols,
    mines: raw.mines ?? 0,
    flagsLeft: raw.flagsLeft ?? 0,
    cells,
  };
}

/* ------ create by difficulty ------ */
export async function createGameByDifficulty(difficulty: Difficulty): Promise<GameStateDto> {
  const res = await fetch(`${API_BASE}/games/minesweeper/preset`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ difficulty }),
  });

  if (!res.ok) throw new Error(`Create ${res.status}: ${res.statusText}`);

  const ct = res.headers.get("content-type") ?? "";
  const location = res.headers.get("location") ?? undefined;
  const idFromLocation = location?.split("/").pop();

  if (ct.includes("application/json")) {
    const raw = (await res.json()) as RawGameState;
    return toGameStateDto(raw, idFromLocation);
  }

  if (!location) throw new Error("Create returned no body and no Location header");

  const followUrl = location.startsWith("http") ? location : `${API_BASE}${location}`;
  const res2 = await fetch(followUrl, { method: "GET" });
  if (!res2.ok) throw new Error(`Follow GET ${res2.status}: ${res2.statusText}`);
  const raw2 = (await res2.json()) as RawGameState;
  return toGameStateDto(raw2, idFromLocation);
}

/* ------ get state ------ */
export async function getGame(gameId: string): Promise<GameStateDto> {
  const raw = await api<RawGameState>(`/games/minesweeper/${gameId}`, { method: "GET" });
  return toGameStateDto(raw, gameId);
}

/* ------ reveal (PATCH у бэка) ------ */
export async function revealCell(gameId: string, x: number, y: number): Promise<GameStateDto> {
  const url = `${API_BASE}/games/minesweeper/${gameId}/reveal`;
  const res = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ x, y }),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Reveal ${res.status}: ${txt || res.statusText}`);
  }

  const ct = res.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) {
    const raw = (await res.json()) as RawGameState;
    return toGameStateDto(raw, gameId);
  }

  // Пустой ответ -> дочитываем состояние
  const res2 = await fetch(`${API_BASE}/games/minesweeper/${gameId}`, { method: "GET" });
  if (!res2.ok) throw new Error(`Follow GET ${res2.status}: ${res2.statusText}`);
  const raw2 = (await res2.json()) as RawGameState;
  return toGameStateDto(raw2, gameId);
}

/* ------ toggle flag (скорее всего тоже PATCH) ------ */
export async function toggleFlag(gameId: string, x: number, y: number): Promise<GameStateDto> {
  const url = `${API_BASE}/games/minesweeper/${gameId}/toggle-flag`; // поправь путь, если у тебя другой
  const res = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ x, y }),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Toggle ${res.status}: ${txt || res.statusText}`);
  }

  const ct = res.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) {
    const raw = (await res.json()) as RawGameState;
    return toGameStateDto(raw, gameId);
  }

  const res2 = await fetch(`${API_BASE}/games/minesweeper/${gameId}`, { method: "GET" });
  if (!res2.ok) throw new Error(`Follow GET ${res2.status}: ${res2.statusText}`);
  const raw2 = (await res2.json()) as RawGameState;
  return toGameStateDto(raw2, gameId);
}