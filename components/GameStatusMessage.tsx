import type { GameStatus } from "../types/game";

type GameStatusMessageProps = {
    gameStatus: GameStatus;
    message: string;
};

export function GameStatusMessage({
    gameStatus,
    message,
}: GameStatusMessageProps) {
    return (
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
    );
}
