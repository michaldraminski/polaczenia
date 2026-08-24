import type {
    GameStatus,
    SolvedCategory,
} from "../types/game";

export type SavedGame = {
    boardWordIds: number[];
    selectedWordIds: number[];
    solvedCategories: SolvedCategory[];
    mistakes: number;
    gameStatus: GameStatus;
    isSolutionRevealed: boolean;
};