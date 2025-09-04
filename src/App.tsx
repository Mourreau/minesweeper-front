// src/App.tsx
import { useEffect, useState } from "react";
import { Board } from "./components/Board";
import {
  createGameByDifficulty,
  revealCell,
  toggleFlag,
  getGame,
  type GameStateDto,
  type Difficulty,
} from "./api/games";

/* ===== helpers: URL + localStorage ===== */
const LS_KEY = "ms:lastGameId";

function setUrlGameId(id: string) {
  const url = new URL(window.location.href);
  url.searchParams.set("gameId", id);
  window.history.pushState({}, "", url.toString());
}
function clearUrlGameId() {
  const url = new URL(window.location.href);
  url.searchParams.delete("gameId");
  window.history.pushState({}, "", url.toString());
}
function getUrlGameId(): string | null {
  const url = new URL(window.location.href);
  return url.searchParams.get("gameId");
}

/* ===== сложности (строковый enum) ===== */
const DIFFICULTIES: { label: string; value: Difficulty }[] = [
  { label: "Easy", value: "Easy" },
  { label: "Medium", value: "Medium" },
  { label: "Hard", value: "Hard" },
  { label: "Custom", value: "Custom" },
];

export default function App() {
  const [difficulty, setDifficulty] = useState<Difficulty>("Easy");
  const [game, setGame] = useState<GameStateDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const gameOver = game?.status === "Won" || game?.status === "Lost";

  /* ===== Автовосстановление игры при входе ===== */
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const idFromUrl = getUrlGameId();
        const saved = idFromUrl || localStorage.getItem(LS_KEY);
        if (!saved) return;

        const state = await getGame(saved);
        if (cancelled) return;

        setGame(state);
        if (!idFromUrl && state.gameId) setUrlGameId(state.gameId);
      } catch {
        localStorage.removeItem(LS_KEY);
        clearUrlGameId();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  /* ===== Создать новую игру ===== */
  async function startNew() {
    setErr(null);
    setLoading(true);
    try {
      const state = await createGameByDifficulty(difficulty);
      setGame(state);

      if (state.gameId) {
        localStorage.setItem(LS_KEY, state.gameId);
        setUrlGameId(state.gameId);
      } else {
        setErr("Server did not return gameId");
      }
    } catch {
      setErr("Failed to create game");
    } finally {
      setLoading(false);
    }
  }

  /* ===== Ходы ===== */
  async function onLeft(x: number, y: number) {
    if (!game || gameOver) return;
    if (!game.gameId) {
      setErr("gameId is empty — create a new game.");
      return;
    }
    try {
      const next = await revealCell(game.gameId, x, y);
      setGame(next);
    } catch {
      setErr("Reveal failed");
    }
  }

  async function onRight(x: number, y: number) {
    if (!game || gameOver) return;
    if (!game.gameId) {
      setErr("gameId is empty — create a new game.");
      return;
    }
    try {
      const next = await toggleFlag(game.gameId, x, y);
      setGame(next);
    } catch {
      setErr("Toggle flag failed");
    }
  }

  /* ===== UI ===== */
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#111",
        color: "#eee",
        padding: 24,
        fontFamily: "ui-sans-serif, system-ui, Arial, Helvetica",
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
          <h1 style={{ fontSize: 42, margin: 0 }}>Minesweeper</h1>
          {game && (
            <span style={{ opacity: 0.85, fontSize: 16 }}>
              Status: <b>{game.status}</b> · {game.rows}×{game.cols}
            </span>
          )}
        </div>

        {/* Диагностика: текущий gameId (полезно для dev) */}
        <code
          style={{
            background: "#1b1b1b",
            border: "1px solid #333",
            padding: "4px 8px",
            borderRadius: 6,
            fontSize: 12,
            color: game?.gameId ? "#8ef" : "#ff9",
          }}
        >
          gameId: {game?.gameId || "(empty)"}
        </code>
      </header>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          startNew();
        }}
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          flexWrap: "wrap",
          marginTop: 12,
          marginBottom: 12,
        }}
      >
        <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
          Difficulty:
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as Difficulty)}
            style={{
              background: "#1f1f1f",
              color: "#fff",
              padding: "6px 10px",
              borderRadius: 6,
              border: "1px solid #333",
            }}
            aria-label="Choose difficulty"
          >
            {DIFFICULTIES.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </label>

        <button
          type="submit"
          disabled={loading}
          style={{
            background: loading ? "#555" : "#3a86ff",
            color: "#fff",
            padding: "8px 14px",
            border: "none",
            borderRadius: 8,
            cursor: loading ? "default" : "pointer",
            fontWeight: 600,
          }}
        >
          {loading ? "Creating..." : "New game"}
        </button>

        {game && (
          <button
            type="button"
            onClick={() => {
              localStorage.removeItem(LS_KEY);
              clearUrlGameId();
              setGame(null);
            }}
            style={{
              background: "#444",
              color: "#fff",
              padding: "8px 12px",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Clear saved
          </button>
        )}
      </form>

      {err && (
        <div
          role="alert"
          style={{
            color: "#ff6b6b",
            background: "#2a1414",
            border: "1px solid #5a1f1f",
            padding: "8px 12px",
            borderRadius: 8,
            marginBottom: 12,
            maxWidth: 560,
          }}
        >
          {err}
        </div>
      )}

      <main>
        {game ? (
          <>
            {game.status === "Created" && !gameOver && (
              <div style={{ color: "#9aa", marginBottom: 8 }}>
                Первый клик будет безопасным — выбери любую клетку.
              </div>
            )}
            <Board
              state={game}
              onLeft={onLeft}
              onRight={onRight}
              disabled={gameOver} // блокируем клики, когда Won/Lost
            />
          </>
        ) : (
          <p style={{ color: "#bbb" }}>
            Создай новую игру, чтобы начать. Выбери сложность и нажми{" "}
            <b>New game</b>.
          </p>
        )}
      </main>
    </div>
  );
}