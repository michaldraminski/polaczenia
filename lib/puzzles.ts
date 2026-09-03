import "server-only";

import { getCurrentDateInPoland } from "./date";
import { createServerSupabaseClient } from "./supabase/server";
import type {
    Difficulty,
    PublicPuzzle,
    PublicWord,
} from "../types/game";

type PuzzleRow = {
    id: number;
    updated_at: string;
};

type ArchivedPuzzleRow = {
    id: number;
    title: string;
    publication_date: string | null;
};

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

async function getPuzzle(
    filters: {
        publicationDate?: string;
        puzzleId?: number;
        status: "scheduled" | "archived";
    },
): Promise<PublicPuzzle | null> {
    const supabase = createServerSupabaseClient();

    let puzzleQuery = supabase
        .from("puzzles")
        .select("id, updated_at")
        .eq("game_type", "connections")
        .eq("status", filters.status);

    if (filters.publicationDate) {
        puzzleQuery = puzzleQuery.eq(
            "publication_date",
            filters.publicationDate,
        );
    }

    if (filters.puzzleId !== undefined) {
        puzzleQuery = puzzleQuery.eq(
            "id",
            filters.puzzleId,
        );
    }

    let {
        data: puzzleRow,
        error: puzzleError,
    } = await puzzleQuery.maybeSingle();

    if (
        puzzleError?.message.includes(
            "game_type does not exist",
        )
    ) {
        let fallbackQuery = supabase
            .from("puzzles")
            .select("id, updated_at")
            .eq("status", filters.status);

        if (filters.publicationDate) {
            fallbackQuery = fallbackQuery.eq(
                "publication_date",
                filters.publicationDate,
            );
        }

        if (filters.puzzleId !== undefined) {
            fallbackQuery = fallbackQuery.eq(
                "id",
                filters.puzzleId,
            );
        }

        ({ data: puzzleRow, error: puzzleError } =
            await fallbackQuery.maybeSingle());
    }

    if (puzzleError) {
        throw new Error(
            `Nie udało się pobrać planszy: ${puzzleError.message}`,
        );
    }

    if (!puzzleRow) {
        return null;
    }
    const puzzle = puzzleRow as PuzzleRow;

    const {
        data: categoryRows,
        error: categoriesError,
    } = await supabase
        .from("categories")
        .select("id, name, difficulty")
        .eq("puzzle_id", puzzle.id);

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
        id: puzzle.id,
        updatedAt: puzzle.updated_at,
        words,
        categories: publicCategories,
        categoryCount: categories.length,
    };
}

export async function getTodaysPuzzle(): Promise<PublicPuzzle | null> {
    return getPuzzle({
        publicationDate: getCurrentDateInPoland(),
        status: "scheduled",
    });
}

export async function getArchivedPuzzle(
    puzzleId: number,
): Promise<PublicPuzzle | null> {
    return getPuzzle({
        puzzleId,
        status: "archived",
    });
}

export async function getArchivedPuzzles(): Promise<
    ArchivedPuzzleRow[]
> {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
        .from("puzzles")
        .select("id, title, publication_date")
        .eq("game_type", "connections")
        .eq("status", "archived")
        .order("publication_date", {
            ascending: false,
            nullsFirst: false,
        });

    if (error) {
        throw new Error(
            `Nie udało się pobrać archiwum: ${error.message}`,
        );
    }

    return data as ArchivedPuzzleRow[];
}