import type { Difficulty } from "../types/game";

export function getCategoryColor(
    difficulty: Difficulty,
): string {
    switch (difficulty) {
        case 1:
            return "bg-green-300";
        case 2:
            return "bg-yellow-300";
        case 3:
            return "bg-orange-300";
        case 4:
            return "bg-red-400";
    }
}
