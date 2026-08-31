"use client";

import { useEffect, useState } from "react";

import type {
    CrosswordDirection,
    CrosswordGrid,
    CrosswordEntry,
} from "../types/crossword";

type CrosswordBoardProps = {
    grid: CrosswordGrid;
    entries: CrosswordEntry[];
};

type Position = {
    row: number;
    column: number;
};

export function CrosswordBoard({
    grid,
    entries,
}: CrosswordBoardProps) {
    const [selectedCell, setSelectedCell] =
        useState<Position | null>(null);

    const [direction, setDirection] =
        useState<CrosswordDirection>("across");

    const [values, setValues] = useState<string[][]>(() =>
        grid.map((row) =>
            row.map((cell) =>
                cell.blocked ? "" : cell.value ?? ""
            )
        )
    );

    const selectedEntry = selectedCell
        ? findEntry(
              selectedCell.row,
              selectedCell.column,
              direction,
              entries
          )
        : null;

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (!selectedCell) {
                return;
            }

            if (event.key === "Backspace") {
                event.preventDefault();

                setValues((current) => {
                    const next = current.map((row) => [...row]);

                    next[selectedCell.row][selectedCell.column] = "";

                    return next;
                });

                moveToPreviousCell();
                return;
            }

            if (event.key === "ArrowRight") {
                event.preventDefault();
                moveToNextCell("right");
                return;
            }

            if (event.key === "ArrowLeft") {
                event.preventDefault();
                moveToNextCell("left");
                return;
            }

            if (event.key === "ArrowDown") {
                event.preventDefault();
                moveToNextCell("down");
                return;
            }

            if (event.key === "ArrowUp") {
                event.preventDefault();
                moveToNextCell("up");
                return;
            }

            if (
                /^[a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ]$/.test(
                    event.key
                )
            ) {
                event.preventDefault();

                const letter = event.key.toUpperCase();

                setValues((current) => {
                    const next = current.map((row) => [...row]);

                    next[selectedCell.row][selectedCell.column] =
                        letter;

                    return next;
                });

                moveToNextCell(
                    direction === "across"
                        ? "right"
                        : "down"
                );
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener(
                "keydown",
                handleKeyDown
            );
        };
    }, [selectedCell, direction]);

    function moveToNextCell(
        moveDirection:
            | "right"
            | "left"
            | "up"
            | "down"
    ) {
        if (!selectedCell) {
            return;
        }

        let row = selectedCell.row;
        let column = selectedCell.column;

        if (moveDirection === "right") {
            column++;
        }

        if (moveDirection === "left") {
            column--;
        }

        if (moveDirection === "down") {
            row++;
        }

        if (moveDirection === "up") {
            row--;
        }

        if (
            row < 0 ||
            row >= grid.length ||
            column < 0 ||
            column >= grid[row].length ||
            grid[row][column].blocked
        ) {
            return;
        }

        setSelectedCell({ row, column });
    }

    function moveToPreviousCell() {
        moveToNextCell(
            direction === "across" ? "left" : "up"
        );
    }

    function handleCellClick(
        row: number,
        column: number
    ) {
        if (grid[row][column].blocked) {
            return;
        }

        if (
            selectedCell &&
            selectedCell.row === row &&
            selectedCell.column === column
        ) {
            setDirection((current) =>
                current === "across"
                    ? "down"
                    : "across"
            );

            return;
        }

        setSelectedCell({ row, column });
    }

    function isCellSelected(
        row: number,
        column: number
    ) {
        return (
            selectedCell?.row === row &&
            selectedCell?.column === column
        );
    }

    function isCellInSelectedEntry(
        row: number,
        column: number
    ) {
        if (!selectedEntry) {
            return false;
        }

        const length = selectedEntry.answer.length;

        if (selectedEntry.direction === "across") {
            return (
                row === selectedEntry.row &&
                column >= selectedEntry.column &&
                column <
                    selectedEntry.column + length
            );
        }

        return (
            column === selectedEntry.column &&
            row >= selectedEntry.row &&
            row < selectedEntry.row + length
        );
    }

    return (
        <div className="grid grid-cols-5 w-full max-w-[400px] aspect-square border-2 border-gray-900">
            {grid.map((row, rowIndex) =>
                row.map((cell, columnIndex) => {
                    const blocked = cell.blocked;

                    const selected = isCellSelected(
                        rowIndex,
                        columnIndex
                    );

                    const inEntry =
                        isCellInSelectedEntry(
                            rowIndex,
                            columnIndex
                        );

                    return (
                        <button
                            key={`${rowIndex}-${columnIndex}`}
                            type="button"
                            disabled={blocked}
                            onClick={() =>
                                handleCellClick(
                                    rowIndex,
                                    columnIndex
                                )
                            }
                            className={`
                                relative
                                aspect-square
                                border border-gray-400
                                flex items-center justify-center
                                font-bold
                                text-2xl
                                select-none
                                ${
                                    blocked
                                        ? "bg-gray-900 cursor-default"
                                        : "bg-white text-gray-900"
                                }
                                ${
                                    !blocked && inEntry
                                        ? "bg-sky-100"
                                        : ""
                                }
                                ${
                                    !blocked && selected
                                        ? "!bg-sky-400"
                                        : ""
                                }
                            `}
                        >
                            {!blocked && (
                                <span className="text-gray-950">
                                    {values[rowIndex][columnIndex]}
                                </span>
                            )}
                        </button>
                    );
                })
            )}
        </div>
    );
}

function findEntry(
    row: number,
    column: number,
    direction: CrosswordDirection,
    entries: CrosswordEntry[]
) {
    return entries.find((entry) => {
        if (entry.direction !== direction) {
            return false;
        }

        if (direction === "across") {
            return (
                row === entry.row &&
                column >= entry.column &&
                column <
                    entry.column + entry.answer.length
            );
        }

        return (
            column === entry.column &&
            row >= entry.row &&
            row <
                entry.row + entry.answer.length
        );
    });
}
