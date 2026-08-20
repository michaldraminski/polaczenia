import "server-only";

import { getCurrentDateInPoland } from "./date";
import { createServerSupabaseClient } from "./supabase/server";
import type {
    Difficulty,
    PublicPuzzle,
    PublicWord,
} from "../types/game";

type CategoryRow = {
    id: number;
    name: string;
    difficulty: number;
};

type WordRow = {
    id: number;
    value: string;
    category_id: number;
};

function isDifficulty(
    value: number,
): value is Difficulty {
    return value >= 1 && value <= 4;
}

export async function getTodaysPuzzle(): Promise<PublicPuzzle | null> {
    const supabase = createServerSupabaseClient();
    const currentDate = getCurrentDateInPoland();

    const {
        data: puzzleRow,
        error: puzzleError,
    } = await supabase
        .from("puzzles")
        .select("id")
        .eq("publication_date", currentDate)
        .eq("status", "scheduled")
        .maybeSingle();

    if (puzzleError) {
        throw new Error(
            `Nie udało się pobrać planszy: ${puzzleError.message}`,
        );
    }

    if (!puzzleRow) {
        return null;
    }

    const {
        data: categoryRows,
        error: categoriesError,
    } = await supabase
        .from("categories")
        .select("id, name, difficulty")
        .eq("puzzle_id", puzzleRow.id);

    if (categoriesError) {
        throw new Error(
            `Nie udało się pobrać kategorii: ${categoriesError.message}`,
        );
    }

    const categories = categoryRows as CategoryRow[];
    const categoryIds = categories.map(
        (category) => category.id,
    );

    if (categoryIds.length === 0) {
        throw new Error(
            "Plansza nie zawiera żadnych kategorii.",
        );
    }

    const {
        data: wordRows,
        error: wordsError,
    } = await supabase
        .from("words")
        .select("id, value, category_id")
        .in("category_id", categoryIds);

    if (wordsError) {
        throw new Error(
            `Nie udało się pobrać słów: ${wordsError.message}`,
        );
    }

    const words: PublicWord[] = (wordRows as WordRow[]).map(
        (wordRow) => ({
            id: wordRow.id,
            value: wordRow.value,
            categoryId: wordRow.category_id,
        }),
    );

    const publicCategories = categories.map(
        (category) => {
            if (!isDifficulty(category.difficulty)) {
                throw new Error(
                    `Niepoprawna trudność kategorii: ${category.difficulty}`,
                );
            }

            return {
                id: category.id,
                name: category.name,
                difficulty: category.difficulty,
                wordIds: words
                    .filter(
                        (word) =>
                            word.categoryId === category.id,
                    )
                    .map((word) => word.id),
            };
        },
    );

    return {
        id: puzzleRow.id,
        words,
        categories: publicCategories,
        categoryCount: categories.length,
    };
}