import type { Difficulty } from "../types/game";

export function getCategoryColor(
    difficulty: Difficulty,
): string {
    switch (difficulty) {
        case 1:
            return "bg-amber-200";
        case 2:
            return "bg-emerald-300";
        case 3:
            return "bg-sky-300";
        case 4:
            return "bg-violet-300";
    }
}
