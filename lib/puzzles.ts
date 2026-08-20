import "server-only";

import { getCurrentDateInPoland } from "./date";
import { createServerSupabaseClient } from "./supabase/server";
import type {
    Category,
    Difficulty,
    Puzzle,
} from "../types/game";

type CategoryRow = {
    id: number;
    name: string;
    difficulty: number;
};

type WordRow = {
    category_id: number;
    value: string;
    position: number;
};

function isDifficulty(
    value: number,
): value is Difficulty {
    return value >= 1 && value <= 4;
}

export async function getTodaysPuzzle(): Promise<Puzzle | null> {
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
        .eq("puzzle_id", puzzleRow.id)
        .order("difficulty");

    if (categoriesError) {
        throw new Error(
            `Nie udało się pobrać kategorii: ${categoriesError.message}`,
        );
    }

    const categoryIds = categoryRows.map(
        (category) => category.id,
    );

    const {
        data: wordRows,
        error: wordsError,
    } = await supabase
        .from("words")
        .select("category_id, value, position")
        .in("category_id", categoryIds)
        .order("position");

    if (wordsError) {
        throw new Error(
            `Nie udało się pobrać słów: ${wordsError.message}`,
        );
    }

    const categories: Category[] = (
        categoryRows as CategoryRow[]
    ).map((categoryRow) => {
        if (!isDifficulty(categoryRow.difficulty)) {
            throw new Error(
                `Niepoprawna trudność kategorii: ${categoryRow.difficulty}`,
            );
        }

        const words = (wordRows as WordRow[])
            .filter(
                (wordRow) =>
                    wordRow.category_id === categoryRow.id,
            )
            .sort(
                (firstWord, secondWord) =>
                    firstWord.position -
                    secondWord.position,
            )
            .map((wordRow) => wordRow.value);

        return {
            name: categoryRow.name,
            difficulty: categoryRow.difficulty,
            words,
        };
    });

    return {
        categories,
    };
}