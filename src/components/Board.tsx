// src/components/Board.tsx
import React from "react";
import type { GameStateDto } from "../api/games";
import { Cell } from "./Cell";

type Props = {
  state: GameStateDto;
  disabled?: boolean; // Won/Lost — блокируем клики и показываем оверлей
  onLeft: (x: number, y: number) => void;
  onRight: (x: number, y: number) => void;
};

export function Board({ state, disabled = false, onLeft, onRight }: Props) {
  const { cols, cells, status } = state;

  return (
    <div
      style={{
        position: "relative",         // важно для оверлея
        display: "inline-block",
      }}
    >
      {/* Сетка */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${cols}, 32px)`,
          gridAutoRows: "32px",
          gap: 4,
          pointerEvents: disabled ? "none" : "auto", // блок кликов
          filter: disabled ? "grayscale(0.2)" : "none",
        }}
      >
        {cells.map((c) => (
          <Cell
            key={`${c.x}-${c.y}`}
            cell={c}
            disabled={disabled}
            onLeft={onLeft}
            onRight={onRight}
          />
        ))}
      </div>

      {/* Оверлей поверх сетки */}
      {disabled && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10, // гарантируем поверх
            pointerEvents: "none",
            background:
              "linear-gradient(to bottom, rgba(17,17,17,0.00), rgba(17,17,17,0.45))",
            borderRadius: 6,
          }}
        >
          <div
            style={{
              padding: "10px 14px",
              borderRadius: 8,
              background: "rgba(0,0,0,0.55)",
              border: "1px solid rgba(255,255,255,0.15)",
              color: status === "Won" ? "#8efc9c" : "#ff7b7b",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: 1,
              boxShadow: "0 6px 24px rgba(0,0,0,0.35)",
            }}
          >
            {status === "Won" ? "You win 🎉" : "Game over 💥"}
          </div>
        </div>
      )}
    </div>
  );
}