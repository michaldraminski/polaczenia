"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { shuffle, shuffleWithSeed } from "../lib/shuffle";
import {
    checkSelectionLocally,
    maximumMistakes,
    revealSolution,
} from "../lib/gameLogic";
import {
    getStorageKey,
    loadSavedGame,
    saveGame,
} from "../lib/gameStorage";
import type { SavedGame } from "../lib/gameTypes";
import type {
    GameStatus,
    PublicPuzzle,
} from "../types/game";
import { GameHeader } from "./GameHeader";
import { Toast } from "./Toast";
import { SolvedCategories } from "./SolvedCategories";
import { WordBoard } from "./WordBoard";
import { GameControls } from "./GameControls";
import { GameStatusMessage } from "./GameStatusMessage";

type GameProps = {
    puzzle: PublicPuzzle;
};

export default function Game({ puzzle }: GameProps) {
    const [boardWords, setBoardWords] = useState(() =>
        shuffleWithSeed(puzzle.words, puzzle.id),
    );
    const [selectedWordIds, setSelectedWordIds] = useState<number[]>([]);
    const [solvedCategories, setSolvedCategories] = useState<
        import("../types/game").SolvedCategory[]
    >([]);
    const [message, setMessage] = useState("");
    const [mistakes, setMistakes] = useState(0);
    const [gameStatus, setGameStatus] =
        useState<GameStatus>("playing");
    const [isChecking, setIsChecking] = useState(false);
    const [isSavedGameLoaded, setIsSavedGameLoaded] = useState(false);
    const [isSolutionRevealed, setIsSolutionRevealed] =
        useState(false);

    const [toast, setToast] = useState<{ text: string; key: number } | null>(null);
    const [toastVisible, setToastVisible] = useState(false);

    const storageKey = getStorageKey(puzzle);

    useEffect(() => {
        const initialBoardWords = shuffleWithSeed(
            puzzle.words,
            puzzle.id,
        );

        const savedGame = loadSavedGame(puzzle);

        if (!savedGame) {
            setBoardWords(initialBoardWords);
            setIsSavedGameLoaded(true);
            return;
        }

        const availableWordIds = new Set(
            puzzle.words.map((word) => word.id),
        );

        const restoredBoardWords = savedGame.boardWordIds
            .map((wordId) =>
                puzzle.words.find((word) => word.id === wordId),
            )
            .filter(
                (
                    word,
                ): word is PublicPuzzle["words"][number] =>
                    word !== undefined,
            );

        const missingWords = puzzle.words.filter(
            (word) => !savedGame.boardWordIds.includes(word.id),
        );

        setBoardWords([
            ...restoredBoardWords,
            ...missingWords,
        ]);

        setSelectedWordIds(
            savedGame.selectedWordIds.filter((wordId) =>
                availableWordIds.has(wordId),
            ),
        );
        setSolvedCategories(savedGame.solvedCategories);
        setMistakes(savedGame.mistakes);
        setGameStatus(savedGame.gameStatus);
        setIsSolutionRevealed(savedGame.isSolutionRevealed);

        if (savedGame.gameStatus === "won") {
            setMessage(
                "Brawo! Wszystkie grupy zostały rozwiązane.",
            );
        } else if (savedGame.gameStatus === "lost") {
            setMessage(
                savedGame.isSolutionRevealed
                    ? "Koniec gry. Oto poprawne rozwiązanie."
                    : "Koniec prób. Czy chcesz zobaczyć rozwiązanie?",
            );
        }

        setIsSavedGameLoaded(true);
    }, [puzzle, storageKey]);

    useEffect(() => {
        if (!toast) return;

        setToastVisible(true);

        const hideTimeout = setTimeout(() => setToastVisible(false), 1600);
        const removeTimeout = setTimeout(() => setToast(null), 1900);

        return () => {
            clearTimeout(hideTimeout);
            clearTimeout(removeTimeout);
        };
    }, [toast]);

    useEffect(() => {
        if (!isSavedGameLoaded) {
            return;
        }

        const savedGame: SavedGame = {
            boardWordIds: boardWords.map((word) => word.id),
            selectedWordIds,
            solvedCategories,
            mistakes,
            gameStatus,
            isSolutionRevealed,
        };

        saveGame(puzzle, savedGame);
    }, [
        boardWords,
        selectedWordIds,
        solvedCategories,
        mistakes,
        gameStatus,
        isSolutionRevealed,
        isSavedGameLoaded,
        puzzle,
    ]);

    function toggleWord(wordId: number) {
        if (
            gameStatus !== "playing" ||
            isChecking
        ) {
            return;
        }

        const isSelected = selectedWordIds.includes(wordId);

        setMessage("");

        if (isSelected) {
            setSelectedWordIds((previousWordIds) =>
                previousWordIds.filter(
                    (selectedWordId) =>
                        selectedWordId !== wordId,
                ),
            );
            return;
        }

        if (selectedWordIds.length < 4) {
            setSelectedWordIds((previousWordIds) => [
                ...previousWordIds,
                wordId,
            ]);
        }
    }

    function showSolution() {
        if (gameStatus !== "lost") {
            return;
        }

        setSolvedCategories(revealSolution(puzzle));
        setIsSolutionRevealed(true);
        setMessage(
            "Koniec gry. Oto poprawne rozwiązanie.",
        );
    }

    async function checkSelection() {
        if (
            gameStatus !== "playing" ||
            isChecking
        ) {
            return;
        }

        if (selectedWordIds.length !== 4) {
            showToast(
                "Zaznacz dokładnie cztery słowa.",
            );
            return;
        }

        setIsChecking(true);
        setMessage("");

        try {
            const checkResult = checkSelectionLocally(
                puzzle,
                selectedWordIds,
            );

            if (checkResult.result === "correct") {
                const newSolvedCategories = [
                    ...solvedCategories,
                    checkResult.category,
                ];

                setSolvedCategories(newSolvedCategories);
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
                setGameStatus("lost");
                setIsSolutionRevealed(false);
                setMessage(
                    "Koniec prób. Czy chcesz zobaczyć rozwiązanie?",
                );
                return;
            }

            if (checkResult.result === "one-away") {
                showToast("Brakuje jednego!");
                return;
            }

            showToast("Te słowa nie tworzą grupy.");
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

    function showToast(text: string) {
        setToast({ text, key: Date.now() });
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

    const solvedWordIds = solvedCategories.flatMap(
        (category) =>
            category.words.map((word) => word.id),
    );

    const remainingWords =
        gameStatus === "lost" && isSolutionRevealed
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
            {toast && (
                <Toast text={toast.text} visible={toastVisible} />
            )}

            <div className="mx-auto w-full max-w-3xl">
                <GameHeader />

                <SolvedCategories
                    categories={solvedCategories}
                />

                <WordBoard
                    words={remainingWords}
                    selectedWordIds={selectedWordIds}
                    disabled={
                        gameStatus !== "playing" ||
                        isChecking
                    }
                    onToggleWord={toggleWord}
                />

                <GameControls
                    remainingLives={remainingLives}
                    selectedCount={selectedWordIds.length}
                    gameStatus={gameStatus}
                    isChecking={isChecking}
                    isSolutionRevealed={isSolutionRevealed}
                    onShuffle={shuffleWords}
                    onCheck={checkSelection}
                    onShowSolution={showSolution}
                />

                <GameStatusMessage
                    gameStatus={gameStatus}
                    message={message}
                />

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
