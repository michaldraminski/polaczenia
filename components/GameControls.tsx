import type { GameStatus } from "../types/game";

type GameControlsProps = {
    remainingLives: number;
    selectedCount: number;
    gameStatus: GameStatus;
    isChecking: boolean;
    isSolutionRevealed: boolean;
    onShuffle: () => void;
    onCheck: () => void;
    onShowSolution: () => void;
};

export function GameControls({
    remainingLives,
    selectedCount,
    gameStatus,
    isChecking,
    isSolutionRevealed,
    onShuffle,
    onCheck,
    onShowSolution,
}: GameControlsProps) {
    return (
        <div className="mt-5 flex flex-col items-center gap-3">
            <div className="flex flex-wrap items-center justify-center gap-2 text-sm sm:text-base">
                <span className="mr-1">Pozostałe próby:</span>

                {Array.from({ length: remainingLives }).map((_, index) => (
                    <span
                        key={index}
                        className="h-4 w-4 rounded-full bg-white"
                    />
                ))}
            </div>

            <p>
                Zaznaczono: {selectedCount} / 4
            </p>

            <div className="flex gap-3">
                <button
                    type="button"
                    onClick={onShuffle}
                    disabled={
                        gameStatus !== "playing" || isChecking
                    }
                    className="min-w-0 flex-1 rounded-full border border-white px-3 py-3 text-sm font-bold transition hover:bg-white hover:text-stone-900 disabled:cursor-not-allowed disabled:opacity-40 sm:px-6 sm:text-base"
                >
                    Pomieszaj
                </button>

                <button
                    type="button"
                    onClick={onCheck}
                    disabled={
                        selectedCount !== 4 ||
                        gameStatus !== "playing" ||
                        isChecking
                    }
                    className="min-w-0 flex-1 rounded-full bg-white px-3 py-3 text-sm font-bold text-stone-900 transition hover:bg-stone-200 disabled:cursor-not-allowed disabled:bg-stone-600 disabled:text-stone-400 sm:px-6 sm:text-base"
                >
                    {isChecking ? "Sprawdzam..." : "Sprawdź"}
                </button>
            </div>

            {gameStatus === "lost" && !isSolutionRevealed && (
                <button
                    type="button"
                    onClick={onShowSolution}
                    className="w-full max-w-sm rounded-full border border-red-300 px-4 py-3 text-sm font-bold text-red-200 transition hover:bg-red-300 hover:text-stone-900 sm:px-6 sm:text-base"
                >
                    Pokaż rozwiązanie
                </button>
            )}
        </div>
    );
}
