"use client";

import { useEffect, useMemo, useState } from "react";

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

type CheckState = "idle" | "correct" | "incorrect";

export function CrosswordBoard({
    grid,
    entries,
}: CrosswordBoardProps) {
    const orderedEntries = useMemo(
        () => sortEntries(entries),
        [entries]
    );

    const numberByCell = useMemo(() => {
        const map = new Map<string, number>();

        for (const entry of entries) {
            const key = `${entry.row}-${entry.column}`;

            if (!map.has(key)) {
                map.set(key, entry.number);
            }
        }

        return map;
    }, [entries]);

    const [selectedCell, setSelectedCell] =
        useState<Position | null>(
            orderedEntries.length > 0
                ? {
                      row: orderedEntries[0].row,
                      column: orderedEntries[0].column,
                  }
                : null
        );

    const [direction, setDirection] =
        useState<CrosswordDirection>(
            orderedEntries[0]?.direction ?? "across"
        );

    const [values, setValues] = useState<string[][]>(() =>
        grid.map((row) =>
            row.map((cell) =>
                cell.blocked ? "" : cell.value ?? ""
            )
        )
    );

    const [checkState, setCheckState] =
        useState<CheckState>("idle");

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
                setCheckState("idle");

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

            if (event.key === "Tab") {
                event.preventDefault();
                goToAdjacentEntry(event.shiftKey ? -1 : 1);
                return;
            }

            if (
                /^[a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ]$/.test(event.key)
            ) {
                event.preventDefault();
                setCheckState("idle");

                const letter = event.key.toUpperCase();

                setValues((current) => {
                    const next = current.map((row) => [...row]);
                    next[selectedCell.row][selectedCell.column] =
                        letter;
                    return next;
                });

                moveToNextCell(
                    direction === "across" ? "right" : "down"
                );
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedCell, direction]);

    function moveToNextCell(
        moveDirection: "right" | "left" | "up" | "down"
    ) {
        if (!selectedCell) {
            return;
        }

        let row = selectedCell.row;
        let column = selectedCell.column;

        if (moveDirection === "right") column++;
        if (moveDirection === "left") column--;
        if (moveDirection === "down") row++;
        if (moveDirection === "up") row--;

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
        moveToNextCell(direction === "across" ? "left" : "up");
    }

    function handleCellClick(row: number, column: number) {
        if (grid[row][column].blocked) {
            return;
        }

        if (
            selectedCell &&
            selectedCell.row === row &&
            selectedCell.column === column
        ) {
            setDirection((current) =>
                current === "across" ? "down" : "across"
            );
            return;
        }

        setSelectedCell({ row, column });
    }

    function goToEntry(entry: CrosswordEntry) {
        setSelectedCell({ row: entry.row, column: entry.column });
        setDirection(entry.direction);
    }

    function goToAdjacentEntry(step: 1 | -1) {
        if (!selectedEntry || orderedEntries.length === 0) {
            return;
        }

        const currentIndex = orderedEntries.findIndex(
            (entry) =>
                entry.number === selectedEntry.number &&
                entry.direction === selectedEntry.direction
        );

        if (currentIndex === -1) {
            return;
        }

        const nextIndex =
            (currentIndex + step + orderedEntries.length) %
            orderedEntries.length;

        goToEntry(orderedEntries[nextIndex]);
    }

    function handleCheck() {
        const isComplete = values.every((row, r) =>
            row.every((value, c) => grid[r][c].blocked || value !== "")
        );

        if (!isComplete) {
            return;
        }

        const isCorrect = entries.every((entry) => {
            for (let i = 0; i < entry.answer.length; i++) {
                const r =
                    entry.direction === "across"
                        ? entry.row
                        : entry.row + i;

                const c =
                    entry.direction === "across"
                        ? entry.column + i
                        : entry.column;

                if (values[r][c] !== entry.answer[i]) {
                    return false;
                }
            }

            return true;
        });

        setCheckState(isCorrect ? "correct" : "incorrect");
    }

    function isCellSelected(row: number, column: number) {
        return (
            selectedCell?.row === row &&
            selectedCell?.column === column
        );
    }

    function isCellInSelectedEntry(row: number, column: number) {
        if (!selectedEntry) {
            return false;
        }

        const length = selectedEntry.answer.length;

        if (selectedEntry.direction === "across") {
            return (
                row === selectedEntry.row &&
                column >= selectedEntry.column &&
                column < selectedEntry.column + length
            );
        }

        return (
            column === selectedEntry.column &&
            row >= selectedEntry.row &&
            row < selectedEntry.row + length
        );
    }

    return (
        <div className="mx-auto w-full max-w-[420px]">
            <div className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-[0_20px_50px_-15px_rgba(0,0,0,0.6)]">
                <div
                    className="grid gap-[1px] bg-[#0b1220]/10 p-[1px]"
                    style={{
                        gridTemplateColumns: `repeat(${grid[0].length}, 1fr)`,
                    }}
                >
                    {grid.map((row, rowIndex) =>
                        row.map((cell, columnIndex) => {
                            const blocked = cell.blocked;
                            const selected = isCellSelected(
                                rowIndex,
                                columnIndex
                            );
                            const inEntry = isCellInSelectedEntry(
                                rowIndex,
                                columnIndex
                            );
                            const number = numberByCell.get(
                                `${rowIndex}-${columnIndex}`
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
                                        relative aspect-square
                                        flex items-center justify-center
                                        select-none
                                        text-[1.35rem] font-semibold
                                        transition-colors duration-100
                                        sm:text-2xl
                                        ${
                                            blocked
                                                ? "cursor-default bg-[#0b1220]"
                                                : "bg-white text-[#111827]"
                                        }
                                        ${
                                            !blocked && inEntry && !selected
                                                ? "bg-[#fbeecb]"
                                                : ""
                                        }
                                        ${
                                            !blocked && selected
                                                ? "!bg-[#f5c94c]"
                                                : ""
                                        }
                                    `}
                                >
                                    {!blocked && number !== undefined && (
                                        <span className="pointer-events-none absolute left-1 top-0.5 select-none text-[0.6rem] font-medium leading-none text-gray-500 sm:text-[0.65rem]">
                                            {number}
                                        </span>
                                    )}

                                    {!blocked && (
                                        <span>
                                            {values[rowIndex][columnIndex]}
                                        </span>
                                    )}
                                </button>
                            );
                        })
                    )}
                </div>

                {selectedEntry && (
                    <div className="flex items-center gap-1 border-t border-gray-200 bg-white px-2 py-2.5">
                        <button
                            type="button"
                            onClick={() => goToAdjacentEntry(-1)}
                            aria-label="Poprzednia wskazówka"
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                        >
                            ‹
                        </button>

                        <div className="min-w-0 flex-1 text-center">
                            <p className="truncate text-[0.9rem] leading-tight text-[#1f2430] sm:text-[0.95rem]">
                                <span className="mr-1.5 font-bold">
                                    {selectedEntry.number}
                                    {selectedEntry.direction === "across"
                                        ? " poziomo"
                                        : " pionowo"}
                                </span>
                                {selectedEntry.clue}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => goToAdjacentEntry(1)}
                            aria-label="Następna wskazówka"
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                        >
                            ›
                        </button>
                    </div>
                )}
            </div>

            <div className="mt-5 flex items-center justify-center gap-3">
                <button
                    type="button"
                    onClick={handleCheck}
                    className="rounded-full border border-[#d4af55]/40 bg-white/5 px-5 py-2 text-sm font-medium text-slate-100 transition hover:border-[#d4af55]/70 hover:bg-white/10"
                >
                    Sprawdź
                </button>
            </div>

            {checkState !== "idle" && (
                <p
                    className={`mt-3 text-center text-sm font-medium ${
                        checkState === "correct"
                            ? "text-emerald-400"
                            : "text-rose-400"
                    }`}
                >
                    {checkState === "correct"
                        ? "Brawo, wszystko poprawnie! 🎉"
                        : "Coś się nie zgadza — spróbuj ponownie."}
                </p>
            )}
        </div>
    );
}

function sortEntries(entries: CrosswordEntry[]) {
    return [...entries].sort((a, b) => {
        if (a.number !== b.number) {
            return a.number - b.number;
        }

        if (a.direction === b.direction) {
            return 0;
        }

        return a.direction === "across" ? -1 : 1;
    });
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
                column < entry.column + entry.answer.length
            );
        }

        return (
            column === entry.column &&
            row >= entry.row &&
            row < entry.row + entry.answer.length
        );
    });
}
