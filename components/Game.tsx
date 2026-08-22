"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
    shuffle,
    shuffleWithSeed,
} from "../lib/shuffle";
import type {
    CheckResult,
    Difficulty,
    GameStatus,
    PublicPuzzle,
    SolvedCategory,
} from "../types/game";

type GameProps = {
    puzzle: PublicPuzzle;
};

type SavedGame = {
    boardWordIds: number[];
    selectedWordIds: number[];
    solvedCategories: SolvedCategory[];
    mistakes: number;
    gameStatus: GameStatus;
    isSolutionRevealed: boolean;
};

const maximumMistakes = 4;

function getCategoryColor(
    difficulty: Difficulty,
): string {
    switch (difficulty) {
        case 1:
            return "bg-amber-200";
        case 2:
            return "bg-emerald-300";
        case 3:
            return "bg-sky-300";
        case 4:
            return "bg-violet-300";
    }
}

function isGameStatus(
    value: unknown,
): value is GameStatus {
    return (
        value === "playing" ||
        value === "won" ||
        value === "lost"
    );
}

function isSavedGame(
    value: unknown,
): value is SavedGame {
    if (
        typeof value !== "object" ||
        value === null
    ) {
        return false;
    }

    const savedGame =
        value as Partial<SavedGame>;

    return (
        Array.isArray(savedGame.boardWordIds) &&
        savedGame.boardWordIds.every(
            Number.isInteger,
        ) &&
        Array.isArray(savedGame.selectedWordIds) &&
        savedGame.selectedWordIds.every(
            Number.isInteger,
        ) &&
        Array.isArray(savedGame.solvedCategories) &&
        typeof savedGame.mistakes === "number" &&
        Number.isInteger(savedGame.mistakes) &&
        isGameStatus(savedGame.gameStatus) &&
        typeof savedGame.isSolutionRevealed ===
            "boolean"
    );
}

export default function Game({ puzzle }: GameProps) {
    const [boardWords, setBoardWords] = useState(() =>
        shuffleWithSeed(puzzle.words, puzzle.id),
    );

    const [
        selectedWordIds,
        setSelectedWordIds,
    ] = useState<number[]>([]);

    const [
        solvedCategories,
        setSolvedCategories,
    ] = useState<SolvedCategory[]>([]);

    const [message, setMessage] = useState("");
    const [mistakes, setMistakes] = useState(0);

    const [gameStatus, setGameStatus] =
        useState<GameStatus>("playing");

    const [isChecking, setIsChecking] =
        useState(false);

    const [
        isSavedGameLoaded,
        setIsSavedGameLoaded,
    ] = useState(false);

    const [
        isSolutionRevealed,
        setIsSolutionRevealed,
    ] = useState(false);

    const storageKey =
        `polaczenia:game:${puzzle.id}:${puzzle.updatedAt}`;

    useEffect(() => {
        const initialBoardWords =
            shuffleWithSeed(puzzle.words, puzzle.id);

        try {
            const savedValue =
                localStorage.getItem(storageKey);

            if (!savedValue) {
                setBoardWords(initialBoardWords);
                return;
            }

            const parsedValue: unknown =
                JSON.parse(savedValue);

            if (!isSavedGame(parsedValue)) {
                localStorage.removeItem(storageKey);
                setBoardWords(initialBoardWords);
                return;
            }

            const availableWordIds = new Set(
                puzzle.words.map((word) => word.id),
            );

            const restoredBoardWords =
                parsedValue.boardWordIds
                    .map((wordId) =>
                        puzzle.words.find(
                            (word) => word.id === wordId,
                        ),
                    )
                    .filter(
                        (
                            word,
                        ): word is PublicPuzzle["words"][number] =>
                            word !== undefined,
                    );

            const missingWords = puzzle.words.filter(
                (word) =>
                    !parsedValue.boardWordIds.includes(
                        word.id,
                    ),
            );

            setBoardWords([
                ...restoredBoardWords,
                ...missingWords,
            ]);

            setSelectedWordIds(
                parsedValue.selectedWordIds
                    .filter((wordId) =>
                        availableWordIds.has(wordId),
                    )
                    .slice(0, 4),
            );

            const validSolvedCategories =
                parsedValue.solvedCategories.filter(
                    (category) =>
                        Array.isArray(category.words) &&
                        category.words.every((word) =>
                            availableWordIds.has(word.id),
                        ),
                );

            setSolvedCategories(
                validSolvedCategories,
            );

            setMistakes(
                Math.min(
                    Math.max(parsedValue.mistakes, 0),
                    maximumMistakes,
                ),
            );

            setGameStatus(parsedValue.gameStatus);

            setIsSolutionRevealed(
                parsedValue.isSolutionRevealed,
            );

            if (parsedValue.gameStatus === "won") {
                setMessage(
                    "Brawo! Wszystkie grupy zostały rozwiązane.",
                );
            } else if (
                parsedValue.gameStatus === "lost"
            ) {
                setMessage(
                    parsedValue.isSolutionRevealed
                        ? "Koniec gry. Oto poprawne rozwiązanie."
                        : "Koniec prób. Czy chcesz zobaczyć rozwiązanie?",
                );
            }
        } catch {
            localStorage.removeItem(storageKey);
            setBoardWords(initialBoardWords);
        } finally {
            setIsSavedGameLoaded(true);
        }
    }, [puzzle, storageKey]);

    useEffect(() => {
        if (!isSavedGameLoaded) {
            return;
        }

        const savedGame: SavedGame = {
            boardWordIds: boardWords.map(
                (word) => word.id,
            ),
            selectedWordIds,
            solvedCategories,
            mistakes,
            gameStatus,
            isSolutionRevealed,
        };

        localStorage.setItem(
            storageKey,
            JSON.stringify(savedGame),
        );
    }, [
        boardWords,
        selectedWordIds,
        solvedCategories,
        mistakes,
        gameStatus,
        isSolutionRevealed,
        isSavedGameLoaded,
        storageKey,
    ]);

    function toggleWord(wordId: number) {
        if (
            gameStatus !== "playing" ||
            isChecking
        ) {
            return;
        }

        const isSelected =
            selectedWordIds.includes(wordId);

        setMessage("");

        if (isSelected) {
            setSelectedWordIds(
                (previousWordIds) =>
                    previousWordIds.filter(
                        (selectedWordId) =>
                            selectedWordId !== wordId,
                    ),
            );

            return;
        }

        if (selectedWordIds.length < 4) {
            setSelectedWordIds(
                (previousWordIds) => [
                    ...previousWordIds,
                    wordId,
                ],
            );
        }
    }

    function revealSolution(): SolvedCategory[] {
        return puzzle.categories.map((category) => ({
            name: category.name,
            difficulty: category.difficulty,
            words: category.wordIds.map((wordId) =>
                puzzle.words.find(
                    (word) => word.id === wordId,
                )!,
            ),
        }));
    }

    function showSolution() {
        if (gameStatus !== "lost") {
            return;
        }

        setSolvedCategories(revealSolution());
        setIsSolutionRevealed(true);
        setMessage(
            "Koniec gry. Oto poprawne rozwiązanie.",
        );
    }

    function checkSelectionLocally(): CheckResult {
        const categoryCounts = new Map<number, number>();

        for (const wordId of selectedWordIds) {
            const word = puzzle.words.find(
                (currentWord) => currentWord.id === wordId,
            );

            if (!word) {
                return { result: "incorrect" };
            }

            categoryCounts.set(
                word.categoryId,
                (categoryCounts.get(word.categoryId) ?? 0) + 1,
            );
        }

        const matchingCategoryId = [
            ...categoryCounts.entries(),
        ].find(([, count]) => count === 4)?.[0];

        if (matchingCategoryId !== undefined) {
            const category = puzzle.categories.find(
                (currentCategory) =>
                    currentCategory.id === matchingCategoryId,
            );

            if (!category) {
                return { result: "incorrect" };
            }

            return {
                result: "correct",
                category: {
                    name: category.name,
                    difficulty: category.difficulty,
                    words: category.wordIds.map((wordId) =>
                        puzzle.words.find(
                            (word) => word.id === wordId,
                        )!,
                    ),
                },
            };
        }

        return [
            ...categoryCounts.values(),
        ].some((count) => count === 3)
            ? { result: "one-away" }
            : { result: "incorrect" };
    }

    async function checkSelection() {
        if (
            gameStatus !== "playing" ||
            isChecking
        ) {
            return;
        }

        if (selectedWordIds.length !== 4) {
            setMessage(
                "Zaznacz dokładnie cztery słowa.",
            );

            return;
        }

        setIsChecking(true);
        setMessage("");

        try {
            const checkResult = checkSelectionLocally();

            if (checkResult.result === "correct") {
                const newSolvedCategories = [
                    ...solvedCategories,
                    checkResult.category,
                ];

                setSolvedCategories(
                    newSolvedCategories,
                );

                setSelectedWordIds([]);

                if (
                    newSolvedCategories.length ===
                    puzzle.categoryCount
                ) {
                    setGameStatus("won");
                    setMessage(
                        "Brawo! Wszystkie grupy zostały rozwiązane.",
                    );

                    return;
                }

                setMessage("Dobrze!");
                return;
            }

            const newMistakes = mistakes + 1;

            setMistakes(newMistakes);
            setSelectedWordIds([]);

            if (newMistakes >= maximumMistakes) {
                setSelectedWordIds([]);
                setGameStatus("lost");
                setIsSolutionRevealed(false);
                setMessage(
                    "Koniec prób. Czy chcesz zobaczyć rozwiązanie?",
                );

                return;
            }

            if (checkResult.result === "one-away") {
                setMessage("Brakuje jednego!");
                return;
            }

            setMessage(
                "Te słowa nie tworzą grupy.",
            );
        } catch (error) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "Wystąpił nieoczekiwany błąd.";

            setMessage(errorMessage);
        } finally {
            setIsChecking(false);
        }
    }

    function shuffleWords() {
        if (
            gameStatus !== "playing" ||
            isChecking
        ) {
            return;
        }

        setBoardWords((previousWords) =>
            shuffle(previousWords),
        );
    }

    const solvedWordIds =
        solvedCategories.flatMap((category) =>
            category.words.map((word) => word.id),
        );

    const displayedCategories = [
        ...solvedCategories,
    ].sort(
        (firstCategory, secondCategory) =>
            firstCategory.difficulty -
            secondCategory.difficulty,
    );

    const remainingWords =
        gameStatus === "lost" &&
        isSolutionRevealed
            ? []
            : boardWords.filter(
                (word) =>
                    !solvedWordIds.includes(word.id),
            );

    const remainingLives = Math.max(
        maximumMistakes - mistakes,
        0,
    );

    return (
        <main className="min-h-screen overflow-x-hidden bg-stone-800 px-2 py-5 text-white sm:px-4 sm:py-8">
            <div className="mx-auto w-full max-w-3xl">
                <header className="mb-5 text-center sm:mb-8">
                    <h1 className="text-3xl font-bold sm:text-4xl">
                        Połączenia
                    </h1>

                    <p className="mt-2 text-sm text-stone-200 sm:mt-3 sm:text-lg">
                        Znajdź cztery grupy po cztery
                        powiązane słowa.
                    </p>
                </header>

                <section className="mb-2 space-y-2">
                    {displayedCategories.map(
                        (category) => (
                            <div
                                key={category.name}
                                className={`min-w-0 rounded-lg px-3 py-4 text-center text-stone-900 sm:p-5 ${getCategoryColor(
                                    category.difficulty,
                                )}`}
                            >
                                <h2 className="break-words text-sm font-bold leading-tight sm:text-base">
                                    {category.name}
                                </h2>

                                <div className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-4 sm:gap-2">
                                    {category.words.map((word) => (
                                        <span
                                            key={word.id}
                                            className="min-w-0 break-words rounded-md bg-white/25 px-2 py-2 text-center text-xs font-bold leading-tight sm:text-sm"
                                        >
                                            {word.value}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ),
                    )}
                </section>

                <section className="grid min-w-0 grid-cols-4 gap-1.5 sm:gap-2">
                    {remainingWords.map((word) => {
                        const isSelected =
                            selectedWordIds.includes(
                                word.id,
                            );

                        return (
                            <button
                                key={word.id}
                                type="button"
                                onClick={() =>
                                    toggleWord(word.id)
                                }
                                disabled={
                                    gameStatus !==
                                        "playing" ||
                                    isChecking
                                }
                                className={`flex min-h-20 min-w-0 items-center justify-center overflow-hidden rounded-md px-1 py-2 text-center text-[clamp(0.58rem,2.7vw,1rem)] font-bold leading-tight transition sm:min-h-24 sm:p-2 ${
                                    isSelected
                                        ? "bg-stone-500 text-white"
                                        : "bg-stone-200 text-stone-900 hover:bg-stone-300"
                                } disabled:cursor-not-allowed`}
                            >
                                {word.value}
                            </button>
                        );
                    })}
                </section>

                <div className="mt-5 flex flex-col items-center gap-3">
                    <div className="flex flex-wrap items-center justify-center gap-2 text-sm sm:text-base">
                        <span className="mr-1">
                            Pozostałe próby:
                        </span>

                        {Array.from({
                            length: remainingLives,
                        }).map((_, index) => (
                            <span
                                key={index}
                                className="h-4 w-4 rounded-full bg-white"
                            />
                        ))}
                    </div>

                    <p>
                        Zaznaczono:{" "}
                        {selectedWordIds.length} / 4
                    </p>

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={shuffleWords}
                            disabled={
                                gameStatus !==
                                    "playing" ||
                                isChecking
                            }
                            className="min-w-0 flex-1 rounded-full border border-white px-3 py-3 text-sm font-bold transition hover:bg-white hover:text-stone-900 disabled:cursor-not-allowed disabled:opacity-40 sm:px-6 sm:text-base"
                        >
                            Pomieszaj
                        </button>

                        <button
                            type="button"
                            onClick={checkSelection}
                            disabled={
                                selectedWordIds.length !==
                                    4 ||
                                gameStatus !==
                                    "playing" ||
                                isChecking
                            }
                            className="min-w-0 flex-1 rounded-full bg-white px-3 py-3 text-sm font-bold text-stone-900 transition hover:bg-stone-200 disabled:cursor-not-allowed disabled:bg-stone-600 disabled:text-stone-400 sm:px-6 sm:text-base"
                        >
                            {isChecking
                                ? "Sprawdzam..."
                                : "Sprawdź"}
                        </button>
                    </div>

                    {gameStatus === "lost" &&
                        !isSolutionRevealed && (
                            <button
                                type="button"
                                onClick={showSolution}
                                className="w-full max-w-sm rounded-full border border-red-300 px-4 py-3 text-sm font-bold text-red-200 transition hover:bg-red-300 hover:text-stone-900 sm:px-6 sm:text-base"
                            >
                                Pokaż rozwiązanie
                            </button>
                        )}

                    <p
                        className={`min-h-6 text-center font-medium ${
                            gameStatus === "won"
                                ? "text-green-400"
                                : gameStatus === "lost"
                                  ? "text-red-400"
                                  : "text-white"
                        }`}
                    >
                        {message}
                    </p>
                </div>

                <footer className="mt-10 border-t border-stone-600 pt-5 text-center">
                    <Link
                        href="/archive"
                        className="text-sm font-medium text-stone-300 transition hover:text-white"
                    >
                        Archiwum plansz
                    </Link>
                </footer>
            </div>
        </main>
    );
}