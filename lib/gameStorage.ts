import type { PublicPuzzle } from "../types/game";
import type { SavedGame, SolvedCategory, GameStatus } from "./gameTypes";

export const getStorageKey = (puzzle: PublicPuzzle) =>
    `polaczenia:game:${puzzle.id}:${puzzle.updatedAt}`;

function isGameStatus(value: unknown): value is GameStatus {
    return value === "playing" || value === "won" || value === "lost";
}

function isSavedGame(value: unknown): value is SavedGame {
    if (typeof value !== "object" || value === null) {
        return false;
    }

    const savedGame = value as Partial<SavedGame>;

    return (
        Array.isArray(savedGame.boardWordIds) &&
        savedGame.boardWordIds.every(Number.isInteger) &&
        Array.isArray(savedGame.selectedWordIds) &&
        savedGame.selectedWordIds.every(Number.isInteger) &&
        Array.isArray(savedGame.solvedCategories) &&
        typeof savedGame.mistakes === "number" &&
        Number.isInteger(savedGame.mistakes) &&
        isGameStatus(savedGame.gameStatus) &&
        typeof savedGame.isSolutionRevealed === "boolean"
    );
}

export function loadSavedGame(
    puzzle: PublicPuzzle,
): SavedGame | null {
    const storageKey = getStorageKey(puzzle);

    try {
        const savedValue = localStorage.getItem(storageKey);

        if (!savedValue) {
            return null;
        }

        const parsedValue: unknown = JSON.parse(savedValue);

        if (!isSavedGame(parsedValue)) {
            localStorage.removeItem(storageKey);
            return null;
        }

        const availableWordIds = new Set(
            puzzle.words.map((word) => word.id),
        );

        const boardWordIds = parsedValue.boardWordIds.filter(
            (wordId) => availableWordIds.has(wordId),
        );

        const selectedWordIds = parsedValue.selectedWordIds
            .filter((wordId) => availableWordIds.has(wordId))
            .slice(0, 4);

        const solvedCategories: SolvedCategory[] =
            parsedValue.solvedCategories.filter(
                (category) =>
                    Array.isArray(category.words) &&
                    category.words.every((word) =>
                        availableWordIds.has(word.id),
                    ),
            );

        return {
            boardWordIds,
            selectedWordIds,
            solvedCategories,
            mistakes: Math.min(
                Math.max(parsedValue.mistakes, 0),
                4,
            ),
            gameStatus: parsedValue.gameStatus,
            isSolutionRevealed: parsedValue.isSolutionRevealed,
        };
    } catch {
        localStorage.removeItem(storageKey);
        return null;
    }
}

export function saveGame(
    puzzle: PublicPuzzle,
    savedGame: SavedGame,
): void {
    localStorage.setItem(
        getStorageKey(puzzle),
        JSON.stringify(savedGame),
    );
}
