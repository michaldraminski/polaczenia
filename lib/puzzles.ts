import "server-only";

import { getCurrentDateInPoland } from "./date";
import { createServerSupabaseClient } from "./supabase/server";
import type { PublicPuzzle, Word } from "../types/game";

type CategoryRow = {
    id: number;
};

type WordRow = {
    id: number;
    value: string;
};

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
        .select("id")
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
        .select("id, value")
        .in("category_id", categoryIds);

    if (wordsError) {
        throw new Error(
            `Nie udało się pobrać słów: ${wordsError.message}`,
        );
    }

    const words: Word[] = (wordRows as WordRow[]).map(
        (wordRow) => ({
            id: wordRow.id,
            value: wordRow.value,
        }),
    );

    return {
        id: puzzleRow.id,
        words,
        categoryCount: categories.length,
    };
}