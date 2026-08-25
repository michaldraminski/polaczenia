import type {
    GameStatus,
    PublicPuzzle,
    SolvedCategory,
} from "../types/game";

import type { SavedGame } from "./gameTypes";

export const getStorageKey = (puzzle: PublicPuzzle) =>
    `polaczenia:game:${puzzle.id}:${puzzle.updatedAt}`;

const getStartedAtKey = (puzzle: PublicPuzzle) =>
    `polaczenia:started:${puzzle.id}:${puzzle.updatedAt}`;

const getClientGameIdKey = (puzzle: PublicPuzzle) =>
    `polaczenia:client-game:${puzzle.id}:${puzzle.updatedAt}`;

export function getGameStartedAt(puzzle: PublicPuzzle): number {
    const key = getStartedAtKey(puzzle);
    const savedValue = localStorage.getItem(key);
    const startedAt = savedValue ? Number(savedValue) : NaN;

    if (Number.isFinite(startedAt)) {
        return startedAt;
    }

    const currentTime = Date.now();
    localStorage.setItem(key, String(currentTime));
    return currentTime;
}

export function getClientGameId(puzzle: PublicPuzzle): string {
    const key = getClientGameIdKey(puzzle);
    const savedValue = localStorage.getItem(key);

    if (savedValue) {
        return savedValue;
    }

    const clientGameId = crypto.randomUUID();
    localStorage.setItem(key, clientGameId);
    return clientGameId;
}

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
