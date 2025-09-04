// src/components/Cell.tsx
import React from "react";
import type { CellDto } from "../api/games";

type Props = {
  cell: CellDto;
  disabled: boolean;
  onLeft: (x: number, y: number) => void;
  onRight: (x: number, y: number) => void;
};

export function Cell({ cell, disabled, onLeft, onRight }: Props) {
  const handleLeft = (e: React.MouseEvent) => {
    e.preventDefault();
    // Диагностика: видно, что клик дошёл до клетки
    console.log("[UI] left click on cell", { x: cell.x, y: cell.y, disabled });
    if (!disabled) onLeft(cell.x, cell.y);
  };

  const handleRight = (e: React.MouseEvent) => {
    e.preventDefault();
    console.log("[UI] right click on cell", { x: cell.x, y: cell.y, disabled });
    if (!disabled) onRight(cell.x, cell.y);
  };

  let content = "";
  if (cell.isRevealed) {
    if (cell.isMine) content = "💣";
    else if (cell.adjacentMines > 0) content = String(cell.adjacentMines);
  } else if (cell.isFlagged) {
    content = "🚩";
  }

  return (
    <button
      className="cell"
      onClick={handleLeft}
      onContextMenu={handleRight}
      disabled={disabled}
      style={{
        width: 32,
        height: 32,
        border: "1px solid #444",
        background: cell.isRevealed ? "#e6e6e6" : "#9aa0a6",
        color: "#111",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        userSelect: "none",
        fontWeight: 700,
        cursor: disabled ? "default" : "pointer",
      }}
      aria-label={`cell ${cell.x},${cell.y}`}
    >
      {content}
    </button>
  );
}