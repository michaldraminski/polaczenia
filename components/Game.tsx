"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { shuffle, shuffleWithSeed } from "../lib/shuffle";
import {
    checkSelectionLocally,
    maximumMistakes,
    revealSolution,
} from "../lib/gameLogic";
import {
    getStorageKey,
    getClientGameId,
    getGameStartedAt,
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
import { PuzzleFeedback } from "./PuzzleFeedback";
import { GameModal } from "./GameModal";

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
    const [fadingWordIds, setFadingWordIds] = useState<number[]>([]);
    const gameStartedAt = useRef<number | null>(null);
    const resultReported = useRef(false);
    const [isGameModalOpen, setIsGameModalOpen] = useState(false);

    const storageKey = getStorageKey(puzzle);

    useEffect(() => {
        gameStartedAt.current = getGameStartedAt(puzzle);

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
        if (
            !isSavedGameLoaded ||
            gameStatus === "playing" ||
            resultReported.current
        ) {
            return;
        }

        resultReported.current = true;
        const startedAt = gameStartedAt.current ?? Date.now();

        void fetch("/api/puzzles/result", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                puzzleId: puzzle.id,
                clientGameId: getClientGameId(puzzle),
                result: gameStatus,
                mistakes,
                durationSeconds: Math.min(
                    Math.max(Math.floor((Date.now() - startedAt) / 1000), 0),
                    86400,
                ),
            }),
        }).catch(() => {
            resultReported.current = false;
        });
    }, [
        gameStatus,
        isSavedGameLoaded,
        mistakes,
        puzzle,
        solvedCategories.length,
    ]);

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
        if (gameStatus !== "playing" || isChecking) {
            return;
        }

        if (selectedWordIds.length !== 4) {
            showToast("Zaznacz dokładnie cztery słowa.");
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

                setFadingWordIds(selectedWordIds);

                setTimeout(() => {
                    setSolvedCategories(newSolvedCategories);
                    setSelectedWordIds([]);
                    setFadingWordIds([]);

                    if (
                        newSolvedCategories.length ===
                        puzzle.categoryCount
                        ) {
                        setGameStatus("won");
                        setMessage(
                            "Brawo! Wszystkie grupy zostały rozwiązane.",
                        );

                        setTimeout(() => {
                            setIsGameModalOpen(true);
                        }, 350);
                    } else {
                        setMessage("Dobrze!");
                    }

                    setIsChecking(false);
                }, 320);

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

                setTimeout(() => {
                    setIsGameModalOpen(true);
                }, 100);

                setIsChecking(false);
                return;
            }

            if (checkResult.result === "one-away") {
                showToast("Blisko!");
            } else {
                showToast("Te słowa nie tworzą grupy.");
            }

            setIsChecking(false);
        } catch (error) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "Wystąpił nieoczekiwany błąd.";

            setMessage(errorMessage);
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
        <main className="relative min-h-screen overflow-hidden bg-[#0b1220] px-4 py-8 text-slate-100 sm:px-6 sm:py-12">

            <div className="game-background">
                <span className="game-corner game-corner-top-right" />
                <span className="game-corner game-corner-bottom-left" />
            </div>

            {toast && (
                <Toast text={toast.text} visible={toastVisible} />
            )}

            <div className="relative z-10 mx-auto w-full max-w-2xl">
                <GameHeader />

                <SolvedCategories
                    categories={solvedCategories}
                />

                <WordBoard
                    words={remainingWords}
                    selectedWordIds={selectedWordIds}
                    disabled={gameStatus !== "playing" || isChecking}
                    fadingWordIds={fadingWordIds}
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

                {isGameModalOpen && gameStatus === "won" && (
                    <GameModal
                        title="Gratulacje!"
                        message="Wszystkie grupy zostały rozwiązane."
                        type="success"
                        onClose={() => setIsGameModalOpen(false)}
                    >
                        <PuzzleFeedback
                            puzzle={puzzle}
                            onSubmitted={() => setIsGameModalOpen(false)}
                        />
                    </GameModal>
                    )}

                    {isGameModalOpen && gameStatus === "lost" && (
                    <GameModal
                        title="Koniec gry"
                        message="Niestety, wykorzystałeś wszystkie próby."
                        type="failure"
                        onClose={() => setIsGameModalOpen(false)}
                    >
                        {!isSolutionRevealed && (
                        <p className="text-center text-stone-300">
                            Możesz zamknąć to okno i zobaczyć poprawne rozwiązanie.
                        </p>
                        )}
                    </GameModal>
                )}

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
