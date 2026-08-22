import "server-only";

import { getCurrentDateInPoland } from "./date";
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

export async function archivePastPuzzles(): Promise<void> {
    const supabase = createServerSupabaseClient();
    const currentDate = getCurrentDateInPoland();

    const { error } = await supabase.rpc(
        "archive_past_puzzles",
        {
            current_date_in_poland: currentDate,
        },
    );

    if (error) {
        throw new Error(
            `Nie udało się zarchiwizować plansz: ${error.message}`,
        );
    }
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

export type AdminPuzzleCategory = {
    id: number;
    name: string;
    difficulty: 1 | 2 | 3 | 4;
    words: {
        id: number;
        value: string;
        position: number;
    }[];
};

export type AdminPuzzleDetails = {
    id: number;
    title: string;
    publicationDate: string | null;
    status: "draft" | "scheduled" | "archived";
    categories: AdminPuzzleCategory[];
};

type PuzzleDetailsRow = {
    id: number;
    title: string;
    publication_date: string | null;
    status: string;
};

type CategoryDetailsRow = {
    id: number;
    name: string;
    difficulty: number;
};

type WordDetailsRow = {
    id: number;
    category_id: number;
    value: string;
    position: number;
};

function isDifficulty(
    value: number,
): value is 1 | 2 | 3 | 4 {
    return value >= 1 && value <= 4;
}

export async function getAdminPuzzle(
    puzzleId: number,
): Promise<AdminPuzzleDetails | null> {
    const supabase = createServerSupabaseClient();

    const {
        data: puzzleData,
        error: puzzleError,
    } = await supabase
        .from("puzzles")
        .select(
            "id, title, publication_date, status",
        )
        .eq("id", puzzleId)
        .maybeSingle();

    if (puzzleError) {
        throw new Error(
            `Nie udało się pobrać planszy: ${puzzleError.message}`,
        );
    }

    if (!puzzleData) {
        return null;
    }

    const puzzle = puzzleData as PuzzleDetailsRow;

    if (!isPuzzleStatus(puzzle.status)) {
        throw new Error(
            `Niepoprawny status planszy: ${puzzle.status}`,
        );
    }

    const {
        data: categoryData,
        error: categoriesError,
    } = await supabase
        .from("categories")
        .select("id, name, difficulty")
        .eq("puzzle_id", puzzleId)
        .order("difficulty");

    if (categoriesError) {
        throw new Error(
            `Nie udało się pobrać kategorii: ${categoriesError.message}`,
        );
    }

    const categories =
        categoryData as CategoryDetailsRow[];

    const categoryIds = categories.map(
        (category) => category.id,
    );

    let words: WordDetailsRow[] = [];

    if (categoryIds.length > 0) {
        const {
            data: wordData,
            error: wordsError,
        } = await supabase
            .from("words")
            .select(
                "id, category_id, value, position",
            )
            .in("category_id", categoryIds)
            .order("position");

        if (wordsError) {
            throw new Error(
                `Nie udało się pobrać słów: ${wordsError.message}`,
            );
        }

        words = wordData as WordDetailsRow[];
    }

    return {
        id: puzzle.id,
        title: puzzle.title,
        publicationDate:
            puzzle.publication_date,
        status: puzzle.status,
        categories: categories.map((category) => {
            if (!isDifficulty(category.difficulty)) {
                throw new Error(
                    `Niepoprawna trudność kategorii: ${category.difficulty}`,
                );
            }

            return {
                id: category.id,
                name: category.name,
                difficulty: category.difficulty,
                words: words
                    .filter(
                        (word) =>
                            word.category_id ===
                            category.id,
                    )
                    .sort(
                        (firstWord, secondWord) =>
                            firstWord.position -
                            secondWord.position,
                    )
                    .map((word) => ({
                        id: word.id,
                        value: word.value,
                        position: word.position,
                    })),
            };
        }),
    };
}