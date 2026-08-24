import type {
    CheckResult,
    PublicPuzzle,
    SolvedCategory,
} from "../types/game";

export const maximumMistakes = 4;

export function revealSolution(
    puzzle: PublicPuzzle,
): SolvedCategory[] {
    return puzzle.categories.map((category) => ({
        name: category.name,
        difficulty: category.difficulty,
        words: category.wordIds.map((wordId) =>
            puzzle.words.find((word) => word.id === wordId)!,
        ),
    }));
}

export function checkSelectionLocally(
    puzzle: PublicPuzzle,
    selectedWordIds: number[],
): CheckResult {
    const categoryCounts = new Map<number, number>();

    for (const wordId of selectedWordIds) {
        const word = puzzle.words.find(
            (currentWord) => currentWord.id === wordId,
        );

        if (!word) {
            return { result: "incorrect" };
        }

        categoryCounts.set(
            word.categoryId,
            (categoryCounts.get(word.categoryId) ?? 0) + 1,
        );
    }

    const matchingCategoryId = [
        ...categoryCounts.entries(),
    ].find(([, count]) => count === 4)?.[0];

    if (matchingCategoryId !== undefined) {
        const category = puzzle.categories.find(
            (currentCategory) =>
                currentCategory.id === matchingCategoryId,
        );

        if (!category) {
            return { result: "incorrect" };
        }

        return {
            result: "correct",
            category: {
                name: category.name,
                difficulty: category.difficulty,
                words: category.wordIds.map((wordId) =>
                    puzzle.words.find(
                        (word) => word.id === wordId,
                    )!,
                ),
            },
        };
    }

    return [...categoryCounts.values()].some(
        (count) => count === 3,
    )
        ? { result: "one-away" }
        : { result: "incorrect" };
}
