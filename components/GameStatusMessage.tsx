import type { GameStatus } from "../types/game";

type GameStatusMessageProps = {
    gameStatus: GameStatus;
    message: string;
};

export function GameStatusMessage({
    gameStatus,
    message,
}: GameStatusMessageProps) {
    if (gameStatus === "playing" || !message) {
        return <div className="min-h-7" />;
    }

    return (
        <div
            className={`
                mt-5 text-center text-sm font-semibold
                tracking-wide animate-[fadeIn_250ms_ease-out]
                ${
                    gameStatus === "won"
                        ? "text-emerald-400"
                        : "text-red-400"
                }
            `}
        >
            {message}
        </div>
    );
}
