"use client";

import { useEffect, useState } from "react";

import { shuffle } from "../lib/shuffle";
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

type ErrorResponse = {
    error?: string;
};

type RevealResponse = {
    categories: SolvedCategory[];
};

const maximumMistakes = 4;

function getCategoryColor(
    difficulty: Difficulty,
): string {
    switch (difficulty) {
        case 1:
            return "bg-yellow-300";
        case 2:
            return "bg-green-400";
        case 3:
            return "bg-blue-400";
        case 4:
            return "bg-purple-400";
    }
}

export default function Game({ puzzle }: GameProps) {
    const [boardWords, setBoardWords] = useState(
        puzzle.words,
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

    useEffect(() => {
        setBoardWords(shuffle(puzzle.words));
    }, [puzzle]);

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

    async function revealSolution(): Promise<
        SolvedCategory[]
    > {
        const response = await fetch(
            "/api/puzzles/reveal",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    puzzleId: puzzle.id,
                }),
            },
        );

        const responseBody: unknown =
            await response.json();

        if (!response.ok) {
            const errorResponse =
                responseBody as ErrorResponse;

            throw new Error(
                errorResponse.error ??
                    "Nie udało się pobrać rozwiązania.",
            );
        }

        const revealResponse =
            responseBody as RevealResponse;

        return revealResponse.categories;
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
            const response = await fetch(
                "/api/puzzles/check",
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json",
                    },
                    body: JSON.stringify({
                        puzzleId: puzzle.id,
                        wordIds: selectedWordIds,
                    }),
                },
            );

            const responseBody: unknown =
                await response.json();

            if (!response.ok) {
                const errorResponse =
                    responseBody as ErrorResponse;

                throw new Error(
                    errorResponse.error ??
                        "Nie udało się sprawdzić odpowiedzi.",
                );
            }

            const checkResult =
                responseBody as CheckResult;

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
                const revealedCategories =
                    await revealSolution();

                setSolvedCategories(revealedCategories);
                setGameStatus("lost");
                setMessage(
                    "Koniec gry. Oto poprawne rozwiązanie.",
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
        gameStatus === "lost"
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
        <main className="min-h-screen bg-stone-800 px-4 py-8 text-white">
            <div className="mx-auto max-w-3xl">
                <header className="mb-8 text-center">
                    <h1 className="text-4xl font-bold">
                        Połączenia
                    </h1>

                    <p className="mt-3 text-lg">
                        Znajdź cztery grupy po cztery
                        powiązane słowa.
                    </p>
                </header>

                <section className="mb-2 space-y-2">
                    {displayedCategories.map(
                        (category) => (
                            <div
                                key={category.name}
                                className={`rounded-md p-5 text-center text-black ${getCategoryColor(
                                    category.difficulty,
                                )}`}
                            >
                                <h2 className="font-bold">
                                    {category.name}
                                </h2>

                                <p className="mt-1">
                                    {category.words
                                        .map(
                                            (word) =>
                                                word.value,
                                        )
                                        .join(", ")}
                                </p>
                            </div>
                        ),
                    )}
                </section>

                <section className="grid grid-cols-4 gap-2">
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
                                className={`flex min-h-24 items-center justify-center rounded-md p-2 text-center text-sm font-bold transition sm:text-base ${
                                    isSelected
                                        ? "bg-stone-500 text-white"
                                        : "bg-stone-200 text-black hover:bg-stone-300"
                                } disabled:cursor-not-allowed`}
                            >
                                {word.value}
                            </button>
                        );
                    })}
                </section>

                <div className="mt-5 flex flex-col items-center gap-3">
                    <div className="flex items-center gap-2">
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
                            className="rounded-full border border-white px-6 py-3 font-bold transition hover:bg-white hover:text-stone-900 disabled:cursor-not-allowed disabled:opacity-40"
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
                            className="rounded-full bg-white px-6 py-3 font-bold text-stone-900 transition disabled:cursor-not-allowed disabled:bg-stone-600 disabled:text-stone-400"
                        >
                            {isChecking
                                ? "Sprawdzam..."
                                : "Sprawdź"}
                        </button>
                    </div>

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
            </div>
        </main>
    );
}