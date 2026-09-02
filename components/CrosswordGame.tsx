"use client";

import { useState, useMemo } from "react";

export type CrosswordData = {
    size: number;
    grid: string[][];
    words: Array<{
        word: string;
        row: number;
        col: number;
        length: number;
        direction: "horizontal" | "vertical";
        clue: string;
    }>;
};

type GridCell = {
    value: string;
    wordIndices: number[]; // indeksy słów które przechodzą przez tę komórkę
};

type Position = { row: number; col: number };

export function CrosswordGame({ crosswordData }: { crosswordData: CrosswordData }) {
    // Inicjalizuj plan rozwiązania
    const initialGrid: GridCell[][] = useMemo(() => {
        const grid: GridCell[][] = crosswordData.grid.map((row) =>
            row.map((cell) => ({
                value: cell === "#" ? "#" : "",
                wordIndices: [],
            }))
        );

        // Przypisz indeksy słów do komórek
        crosswordData.words.forEach((word, wordIdx) => {
            for (let i = 0; i < word.length; i++) {
                const r = word.direction === "horizontal" ? word.row : word.row + i;
                const c = word.direction === "horizontal" ? word.col + i : word.col;
                if (grid[r] && grid[r][c]) {
                    grid[r][c].wordIndices.push(wordIdx);
                }
            }
        });

        return grid;
    }, [crosswordData]);

    const [grid, setGrid] = useState<GridCell[][]>(initialGrid);
    const [selectedCell, setSelectedCell] = useState<Position | null>(null);
    const [selectedDirection, setSelectedDirection] = useState<"horizontal" | "vertical">("horizontal");
    const [highlightedWords, setHighlightedWords] = useState<Set<number>>(new Set());

    // Rozdziel wskazówki na poziome i pionowe - każda grupa ma własne numery 1-5
    const acrossClues = useMemo(
        () =>
            crosswordData.words
                .map((w, idx) => ({
                    ...w,
                    idx,
                }))
                .filter((w) => w.direction === "horizontal")
                .map((w, i) => ({ ...w, number: i + 1 })),
        [crosswordData.words]
    );

    const downClues = useMemo(
        () =>
            crosswordData.words
                .map((w, idx) => ({
                    ...w,
                    idx,
                }))
                .filter((w) => w.direction === "vertical")
                .map((w, i) => ({ ...w, number: i + 1 })),
        [crosswordData.words]
    );

    // Mapa słów które zaczynają się w każdej komórce (z separacją kierunków)
    const getFirstWordNumberAtCell = (row: number, col: number): number | null => {
        const hWord = crosswordData.words.findIndex(
            (w) => w.row === row && w.col === col && w.direction === "horizontal"
        );
        if (hWord !== -1) {
            return acrossClues.findIndex((w) => w.idx === hWord) + 1;
        }

        const vWord = crosswordData.words.findIndex(
            (w) => w.row === row && w.col === col && w.direction === "vertical"
        );
        if (vWord !== -1) {
            return downClues.findIndex((w) => w.idx === vWord) + 1;
        }

        return null;
    };

    const isCellInActiveLine = (row: number, col: number, value: string) =>
        selectedCell !== null &&
        value !== "#" &&
        (selectedDirection === "horizontal"
            ? row === selectedCell.row
            : col === selectedCell.col);

    const handleCellClick = (row: number, col: number) => {
        if (grid[row][col].value === "#") return;

        // Jeśli klika tę samą komórkę - przełącz kierunek
        if (selectedCell?.row === row && selectedCell?.col === col) {
            const wordIndices = grid[row][col].wordIndices;
            const wordInOtherDirection = wordIndices.find(
                (idx) => crosswordData.words[idx].direction !== selectedDirection
            );
            
            if (wordInOtherDirection !== undefined) {
                const newDirection = crosswordData.words[wordInOtherDirection].direction;
                setSelectedDirection(newDirection);
                setHighlightedWords(new Set([wordInOtherDirection]));
            }
            return;
        }

        // Nowa komórka - ustaw domyślnie kierunek poziomy (lub pionowy jeśli nie ma poziomego)
        const wordIndices = grid[row][col].wordIndices;
        let wordToSelect = wordIndices.find(
            (idx) => crosswordData.words[idx].direction === "horizontal"
        );

        if (wordToSelect === undefined) {
            wordToSelect = wordIndices[0];
        }

        if (wordToSelect !== undefined) {
            const selectedWord = crosswordData.words[wordToSelect];
            setSelectedDirection(selectedWord.direction);
            setHighlightedWords(new Set([wordToSelect]));
        }

        setSelectedCell({ row, col });

        // Focus do inputu
        setTimeout(() => {
            const input = document.querySelector(
                `input[data-row="${row}"][data-col="${col}"]`
            ) as HTMLInputElement;
            if (input) {
                input.focus();
                input.select();
            }
        }, 0);
    };

    const handleClueClick = (wordIdx: number) => {
        const word = crosswordData.words[wordIdx];
        setSelectedCell({ row: word.row, col: word.col });
        setSelectedDirection(word.direction);
        setHighlightedWords(new Set([wordIdx]));

        // Focus i cursor do inputu - autoFocus
        setTimeout(() => {
            const input = document.querySelector(
                `input[data-row="${word.row}"][data-col="${word.col}"]`
            ) as HTMLInputElement;
            if (input) {
                input.focus();
                input.select();
            }
        }, 0);
    };

    const handleCellInput = (row: number, col: number, value: string) => {
        if (grid[row][col].value === "#") return;

        const letter = value.toUpperCase().slice(-1);
        if (!/^[A-Z]?$/.test(letter)) return;

        setGrid((current) => {
            const newGrid = current.map((r) => [...r]);
            newGrid[row][col].value = letter;
            return newGrid;
        });

        // Przejdź do następnej komórki w wybranym kierunku
        if (letter && highlightedWords.size > 0) {
            const wordIdx = Array.from(highlightedWords)[0];
            const word = crosswordData.words[wordIdx];

            if (word.direction === "horizontal") {
                const nextCol = col + 1;
                if (nextCol < word.col + word.length && grid[row][nextCol]?.value !== "#") {
                    setTimeout(() => {
                        const input = document.querySelector(
                            `input[data-row="${row}"][data-col="${nextCol}"]`
                        ) as HTMLInputElement;
                        if (input) {
                            input.focus();
                            input.select();
                        }
                    }, 0);
                    setSelectedCell({ row, col: nextCol });
                }
            } else {
                const nextRow = row + 1;
                if (nextRow < word.row + word.length && grid[nextRow]?.[col]?.value !== "#") {
                    setTimeout(() => {
                        const input = document.querySelector(
                            `input[data-row="${nextRow}"][data-col="${col}"]`
                        ) as HTMLInputElement;
                        if (input) {
                            input.focus();
                            input.select();
                        }
                    }, 0);
                    setSelectedCell({ row: nextRow, col });
                }
            }
        }
    };

    const handleKeyDown = (row: number, col: number, e: React.KeyboardEvent) => {
        if (e.key === "Backspace") {
            e.preventDefault();
            setGrid((current) => {
                const newGrid = current.map((r) => [...r]);
                newGrid[row][col].value = "";
                return newGrid;
            });

            // Przejdź do poprzedniej komórki w wybranym kierunku
            const wordIdx = grid[row][col].wordIndices.find(
                (idx) => crosswordData.words[idx].direction === selectedDirection
            );
            
            if (wordIdx !== undefined) {
                const word = crosswordData.words[wordIdx];

                if (word.direction === "horizontal") {
                    const prevCol = col - 1;
                    if (prevCol >= word.col) {
                        setTimeout(() => {
                            const input = document.querySelector(
                                `input[data-row="${row}"][data-col="${prevCol}"]`
                            ) as HTMLInputElement;
                            if (input) {
                                input.focus();
                                input.select();
                            }
                        }, 0);
                        setSelectedCell({ row, col: prevCol });
                    }
                } else {
                    const prevRow = row - 1;
                    if (prevRow >= word.row) {
                        setTimeout(() => {
                            const input = document.querySelector(
                                `input[data-row="${prevRow}"][data-col="${col}"]`
                            ) as HTMLInputElement;
                            if (input) {
                                input.focus();
                                input.select();
                            }
                        }, 0);
                        setSelectedCell({ row: prevRow, col });
                    }
                }
            }
            return;
        }

        if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
            e.preventDefault();
            const direction = e.key === "ArrowLeft" ? -1 : 1;
            const nextCol = col + direction;
            if (
                nextCol >= 0 &&
                nextCol < crosswordData.size &&
                grid[row][nextCol]?.value !== "#"
            ) {
                setSelectedCell({ row, col: nextCol });
                // Ustaw kierunek na poziomy jeśli dostępny
                const wordIdx = grid[row][nextCol].wordIndices.find(
                    (idx) => crosswordData.words[idx].direction === "horizontal"
                );
                if (wordIdx !== undefined) {
                    setSelectedDirection("horizontal");
                    setHighlightedWords(new Set([wordIdx]));
                }
                setTimeout(() => {
                    const input = document.querySelector(
                        `input[data-row="${row}"][data-col="${nextCol}"]`
                    ) as HTMLInputElement;
                    if (input) {
                        input.focus();
                        input.select();
                    }
                }, 0);
            }
        }

        if (e.key === "ArrowUp" || e.key === "ArrowDown") {
            e.preventDefault();
            const direction = e.key === "ArrowUp" ? -1 : 1;
            const nextRow = row + direction;
            if (
                nextRow >= 0 &&
                nextRow < crosswordData.size &&
                grid[nextRow]?.[col]?.value !== "#"
            ) {
                setSelectedCell({ row: nextRow, col });
                // Ustaw kierunek na pionowy jeśli dostępny
                const wordIdx = grid[nextRow][col].wordIndices.find(
                    (idx) => crosswordData.words[idx].direction === "vertical"
                );
                if (wordIdx !== undefined) {
                    setSelectedDirection("vertical");
                    setHighlightedWords(new Set([wordIdx]));
                }
                setTimeout(() => {
                    const input = document.querySelector(
                        `input[data-row="${nextRow}"][data-col="${col}"]`
                    ) as HTMLInputElement;
                    if (input) {
                        input.focus();
                        input.select();
                    }
                }, 0);
            }
        }
    };

    return (
        <div className="flex w-full flex-col gap-4 lg:flex-row lg:items-start lg:gap-6">
            {/* Plansza */}
            <div className="flex-1 flex items-center justify-center min-h-[60vh] lg:min-h-full">
                <div className="rounded-lg border border-[#d4af55]/30 bg-slate-900 p-2 shadow-2xl lg:p-4">
                    <div
                        className="inline-grid gap-0"
                        style={{
                            gridTemplateColumns: `repeat(${crosswordData.size}, minmax(0, 1fr))`,
                        }}
                    >
                        {grid.map((row, rowIdx) =>
                            row.map((cell, colIdx) => (
                                <div key={`${rowIdx}-${colIdx}`} className="relative">
                                    <input
                                        data-row={rowIdx}
                                        data-col={colIdx}
                                        type="text"
                                        value={cell.value === "#" ? "" : cell.value}
                                        onChange={(e) => handleCellInput(rowIdx, colIdx, e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(rowIdx, colIdx, e)}
                                        onClick={() => handleCellClick(rowIdx, colIdx)}
                                        disabled={cell.value === "#"}
                                        maxLength={1}
                                        className={`h-12 w-12 border text-center text-base font-bold transition-colors sm:h-16 sm:w-16 sm:text-xl lg:h-20 lg:w-20 lg:text-2xl ${
                                            cell.value === "#"
                                                ? "cursor-not-allowed bg-slate-950 border-slate-800"
                                                : "bg-slate-800 border-slate-600 text-white focus:bg-blue-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-[#d4af55]"
                                        } ${
                                            selectedCell?.row === rowIdx && selectedCell?.col === colIdx
                                                ? "relative z-10 !border-2 !border-[#d4af55]"
                                                : ""
                                        } ${
                                            highlightedWords.size > 0 &&
                                            cell.wordIndices.some((wordIdx) => highlightedWords.has(wordIdx))
                                                ? "!bg-blue-900/70 !border-blue-400"
                                                : isCellInActiveLine(rowIdx, colIdx, cell.value)
                                                    ? "!bg-amber-900 !border-amber-400"
                                                    : ""
                                        }`}
                                    />
                                    {getFirstWordNumberAtCell(rowIdx, colIdx) && (
                                        <span className="absolute top-0 left-0 text-xs font-bold text-[#d4af55] p-0.5 leading-none lg:text-sm lg:p-1">
                                            {getFirstWordNumberAtCell(rowIdx, colIdx)}
                                        </span>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Wskazówki */}
            <div className="flex w-full flex-col gap-3 lg:w-80 lg:gap-4 lg:pr-2">
                {/* Wskazówki poziome */}
                <div>
                    <h2 className="mb-2 text-sm font-bold text-[#d4af55] lg:mb-3 lg:text-base">
                        POZIOMO
                    </h2>
                    <div className="space-y-1">
                        {acrossClues.map((word) => (
                            <button
                                key={word.idx}
                                onClick={() => handleClueClick(word.idx)}
                                className={`block w-full rounded px-2 py-1 text-left text-xs transition-colors lg:px-2.5 lg:py-1.5 lg:text-xs ${
                                    highlightedWords.has(word.idx)
                                        ? "bg-blue-700 text-white"
                                        : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                                }`}
                            >
                                <span className="font-bold text-[#d4af55]">{word.number}.</span> {word.clue}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Wskazówki pionowe */}
                <div>
                    <h2 className="mb-2 text-sm font-bold text-[#d4af55] lg:mb-3 lg:text-base">
                        PIONOWO
                    </h2>
                    <div className="space-y-1">
                        {downClues.map((word) => (
                            <button
                                key={word.idx}
                                onClick={() => handleClueClick(word.idx)}
                                className={`block w-full rounded px-2 py-1 text-left text-xs transition-colors lg:px-2.5 lg:py-1.5 lg:text-xs ${
                                    highlightedWords.has(word.idx)
                                        ? "bg-blue-700 text-white"
                                        : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                                }`}
                            >
                                <span className="font-bold text-[#d4af55]">{word.number}.</span> {word.clue}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
