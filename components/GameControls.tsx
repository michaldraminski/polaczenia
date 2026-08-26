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
        <div className="mt-7 flex flex-col items-center gap-4">

            <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-slate-400 sm:text-base">

                <span className="mr-1">
                    Pozostałe próby:
                </span>

                {Array.from({
                    length: remainingLives,
                }).map((_, index) => (
                    <span
                        key={index}
                        className="
                            h-3 w-3
                            rounded-full
                            bg-[#d4af55]
                        "
                    />
                ))}

            </div>

            <p className="text-sm text-slate-400">
                <span className="text-slate-500">
                    Zaznaczono:
                </span>{" "}
                {selectedCount} / 4
            </p>

            <div className="flex w-full max-w-sm gap-3">

                <button
                    type="button"
                    onClick={onShuffle}
                    disabled={
                        gameStatus !== "playing" ||
                        isChecking
                    }
                    className="
                        min-w-0
                        flex-1
                        rounded-lg
                        border
                        border-slate-600
                        bg-transparent
                        px-3
                        py-3
                        text-sm
                        font-bold
                        text-slate-300
                        transition-all
                        hover:border-slate-400
                        hover:bg-white/[0.04]
                        hover:text-white
                        disabled:cursor-not-allowed
                        disabled:opacity-30
                        sm:px-6
                        sm:text-base
                    "
                >
                    ⤨&nbsp; POMIESZAJ
                </button>

                <button
                    type="button"
                    onClick={onCheck}
                    disabled={
                        selectedCount !== 4 ||
                        gameStatus !== "playing" ||
                        isChecking
                    }
                    className="
                        min-w-0
                        flex-1
                        rounded-lg
                        border
                        border-[#d4af55]
                        bg-[#d4af55]
                        px-3
                        py-3
                        text-sm
                        font-bold
                        text-[#101827]
                        transition-all
                        hover:bg-[#e2c16d]
                        hover:border-[#e2c16d]
                        disabled:cursor-not-allowed
                        disabled:border-slate-700
                        disabled:bg-slate-700
                        disabled:text-slate-500
                        sm:px-6
                        sm:text-base
                    "
                >
                    {isChecking
                        ? "SPRAWDZAM..."
                        : "SPRAWDŹ"}
                </button>

            </div>

            {gameStatus === "lost" &&
                !isSolutionRevealed && (
                    <button
                        type="button"
                        onClick={onShowSolution}
                        className="
                            w-full
                            max-w-sm
                            rounded-lg
                            border
                            border-red-400/50
                            px-4
                            py-3
                            text-sm
                            font-bold
                            text-red-300
                            transition
                            hover:bg-red-400/10
                            sm:px-6
                            sm:text-base
                        "
                    >
                        Pokaż rozwiązanie
                    </button>
                )}

        </div>
    );
}