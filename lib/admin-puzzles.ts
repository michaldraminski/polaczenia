import "server-only";

import { createServerSupabaseClient } from "./supabase/server";

export type AdminPuzzle = {
    id: number;
    title: string;
    publicationDate: string | null;
    status: "draft" | "scheduled" | "archived";
    categoryCount: number;
    wordCount: number;
};

type PuzzleRow = {
    id: number;
    title: string;
    publication_date: string | null;
    status: string;
};

type CategoryRow = {
    id: number;
    puzzle_id: number;
};

type WordRow = {
    category_id: number;
};

function isPuzzleStatus(
    value: string,
): value is AdminPuzzle["status"] {
    return (
        value === "draft" ||
        value === "scheduled" ||
        value === "archived"
    );
}

export async function getAdminPuzzles(): Promise<
    AdminPuzzle[]
> {
    const supabase = createServerSupabaseClient();

    const {
        data: puzzleRows,
        error: puzzlesError,
    } = await supabase
        .from("puzzles")
        .select(
            "id, title, publication_date, status",
        )
        .order("publication_date", {
            ascending: false,
            nullsFirst: true,
        })
        .order("created_at", {
            ascending: false,
        });

    if (puzzlesError) {
        throw new Error(
            `Nie udało się pobrać plansz: ${puzzlesError.message}`,
        );
    }

    const puzzles = puzzleRows as PuzzleRow[];

    if (puzzles.length === 0) {
        return [];
    }

    const puzzleIds = puzzles.map(
        (puzzle) => puzzle.id,
    );

    const {
        data: categoryRows,
        error: categoriesError,
    } = await supabase
        .from("categories")
        .select("id, puzzle_id")
        .in("puzzle_id", puzzleIds);

    if (categoriesError) {
        throw new Error(
            `Nie udało się pobrać kategorii: ${categoriesError.message}`,
        );
    }

    const categories =
        categoryRows as CategoryRow[];

    const categoryIds = categories.map(
        (category) => category.id,
    );

    let words: WordRow[] = [];

    if (categoryIds.length > 0) {
        const {
            data: wordRows,
            error: wordsError,
        } = await supabase
            .from("words")
            .select("category_id")
            .in("category_id", categoryIds);

        if (wordsError) {
            throw new Error(
                `Nie udało się pobrać słów: ${wordsError.message}`,
            );
        }

        words = wordRows as WordRow[];
    }

    return puzzles.map((puzzle) => {
        if (!isPuzzleStatus(puzzle.status)) {
            throw new Error(
                `Niepoprawny status planszy: ${puzzle.status}`,
            );
        }

        const puzzleCategories =
            categories.filter(
                (category) =>
                    category.puzzle_id === puzzle.id,
            );

        const puzzleCategoryIds = new Set(
            puzzleCategories.map(
                (category) => category.id,
            ),
        );

        const wordCount = words.filter((word) =>
            puzzleCategoryIds.has(word.category_id),
        ).length;

        return {
            id: puzzle.id,
            title: puzzle.title,
            publicationDate:
                puzzle.publication_date,
            status: puzzle.status,
            categoryCount:
                puzzleCategories.length,
            wordCount,
        };
    });
}
