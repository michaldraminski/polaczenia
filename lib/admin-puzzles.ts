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
    createdByUserId: string | null;
    lastEditedByUserId: string | null;
    createdBy: string | null;
    lastEditedBy: string | null;
    gameStats: PuzzleGameStats;
};

export type PuzzleGameStats = {
    games: number;
    wins: number;
    winRate: number | null;
    averageMistakes: number | null;
    averageDurationSeconds: number | null;
    feedbackCount: number;
    averageDifficulty: number | null;
    averageQuality: number | null;
};

type PuzzleRow = {
    id: number;
    title: string;
    publication_date: string | null;
    status: string;
    created_by_user_id: string | null;
    last_edited_by_user_id: string | null;
};

type CategoryRow = {
    id: number;
    puzzle_id: number;
};

type WordRow = {
    category_id: number;
};

type GameResultRow = {
    puzzle_id: number;
    result: "won" | "lost";
    mistakes: number;
    duration_seconds: number;
};

type FeedbackRow = {
    puzzle_id: number;
    difficulty_rating: number;
    quality_rating: number;
};

const emptyPuzzleGameStats: PuzzleGameStats = {
    games: 0,
    wins: 0,
    winRate: null,
    averageMistakes: null,
    averageDurationSeconds: null,
    feedbackCount: 0,
    averageDifficulty: null,
    averageQuality: null,
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

async function getModeratorDisplayName(
    supabase: ReturnType<typeof createServerSupabaseClient>,
    userId: string | null,
): Promise<string | null> {
    if (!userId) {
        return null;
    }

    const adminClient = (
        supabase.auth as unknown as {
            admin?: {
                getUserById?: (userId: string) => Promise<{
                    data: {
                        user?: {
                            email?: string | null;
                        } | null;
                    };
                    error: { message: string } | null;
                }>;
            };
        }
    ).admin;

    if (!adminClient?.getUserById) {
        return null;
    }

    const { data, error } =
        await adminClient.getUserById(userId);

    if (error || !data.user) {
        return null;
    }

    return data.user.email ?? null;
}

async function getModeratorDisplayNames(
    supabase: ReturnType<typeof createServerSupabaseClient>,
    puzzleRows: PuzzleRow[],
): Promise<Map<string, string | null>> {
    const userIds = new Set(
        puzzleRows
            .flatMap((puzzle) => [
                puzzle.created_by_user_id,
                puzzle.last_edited_by_user_id,
            ])
            .filter(
                (userId): userId is string =>
                    typeof userId === "string",
            ),
    );

    const displayNames = new Map<string, string | null>();

    for (const userId of userIds) {
        displayNames.set(
            userId,
            await getModeratorDisplayName(
                supabase,
                userId,
            ),
        );
    }

    return displayNames;
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

    const puzzleSelect = supabase
        .from("puzzles")
        .select(
            "id, title, publication_date, status, created_by_user_id, last_edited_by_user_id",
        )
        .eq("game_type", "connections")
        .order("publication_date", {
            ascending: false,
            nullsFirst: true,
        })
        .order("created_at", {
            ascending: false,
        });

    let { data: puzzleRows, error: puzzlesError } =
        await puzzleSelect;

    if (
        puzzlesError?.message.includes(
            "game_type does not exist",
        )
    ) {
        ({ data: puzzleRows, error: puzzlesError } =
            await supabase
                .from("puzzles")
                .select(
                    "id, title, publication_date, status, created_by_user_id, last_edited_by_user_id",
                )
                .order("publication_date", {
                    ascending: false,
                    nullsFirst: true,
                })
                .order("created_at", {
                    ascending: false,
                }));
    }

    if (puzzlesError) {
        throw new Error(
            `Nie udało się pobrać plansz: ${puzzlesError.message}`,
        );
    }

    const puzzles = puzzleRows as PuzzleRow[];
    const moderatorDisplayNames =
        await getModeratorDisplayNames(
            supabase,
            puzzles,
        );

    if (puzzles.length === 0) {
        return [];
    }

    const puzzleIds = puzzles.map(
        (puzzle) => puzzle.id,
    );

    const { data: gameResultData, error: gameResultsError } = await supabase
        .from("game_results")
        .select("puzzle_id, result, mistakes, duration_seconds")
        .in("puzzle_id", puzzleIds);

    if (gameResultsError) {
        throw new Error(
            `Nie udało się pobrać statystyk gier: ${gameResultsError.message}`,
        );
    }

    const { data: feedbackData, error: feedbackError } = await supabase
        .from("puzzle_feedback")
        .select("puzzle_id, difficulty_rating, quality_rating")
        .in("puzzle_id", puzzleIds);

    if (feedbackError) {
        throw new Error(
            `Nie udało się pobrać ocen plansz: ${feedbackError.message}`,
        );
    }

    const gameResults = gameResultData as GameResultRow[];
    const feedbackRows = feedbackData as FeedbackRow[];

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
            createdByUserId:
                puzzle.created_by_user_id,
            lastEditedByUserId:
                puzzle.last_edited_by_user_id,
            createdBy:
                puzzle.created_by_user_id
                    ? moderatorDisplayNames.get(
                          puzzle.created_by_user_id,
                      ) ?? null
                    : null,
            lastEditedBy:
                puzzle.last_edited_by_user_id
                    ? moderatorDisplayNames.get(
                          puzzle.last_edited_by_user_id,
                      ) ?? null
                    : null,
            gameStats: getPuzzleGameStats(
                puzzle.id,
                gameResults,
                feedbackRows,
            ),
        };
    });
}

function getPuzzleGameStats(
    puzzleId: number,
    gameResults: GameResultRow[],
    feedbackRows: FeedbackRow[],
): PuzzleGameStats {
    const results = gameResults.filter(
        (result) => result.puzzle_id === puzzleId,
    );
    const feedback = feedbackRows.filter(
        (row) => row.puzzle_id === puzzleId,
    );

    if (results.length === 0 && feedback.length === 0) {
        return emptyPuzzleGameStats;
    }

    const wins = results.filter(
        (result) => result.result === "won",
    ).length;

    return {
        games: results.length,
        wins,
        winRate: results.length > 0
            ? Math.round((wins / results.length) * 100)
            : null,
        averageMistakes: results.length > 0
            ? average(results.map((result) => result.mistakes))
            : null,
        averageDurationSeconds: results.length > 0
            ? average(results.map((result) => result.duration_seconds))
            : null,
        feedbackCount: feedback.length,
        averageDifficulty: feedback.length > 0
            ? average(feedback.map((row) => row.difficulty_rating))
            : null,
        averageQuality: feedback.length > 0
            ? average(feedback.map((row) => row.quality_rating))
            : null,
    };
}

function average(values: number[]): number {
    return Math.round(
        (values.reduce((sum, value) => sum + value, 0) / values.length) * 10,
    ) / 10;
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
    createdByUserId: string | null;
    lastEditedByUserId: string | null;
    createdBy: string | null;
    lastEditedBy: string | null;
    categories: AdminPuzzleCategory[];
};

type PuzzleDetailsRow = {
    id: number;
    title: string;
    publication_date: string | null;
    status: string;
    created_by_user_id: string | null;
    last_edited_by_user_id: string | null;
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
            "id, title, publication_date, status, created_by_user_id, last_edited_by_user_id",
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

    const createdBy =
        await getModeratorDisplayName(
            supabase,
            puzzle.created_by_user_id,
        );
    const lastEditedBy =
        await getModeratorDisplayName(
            supabase,
            puzzle.last_edited_by_user_id,
        );

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
        createdByUserId: puzzle.created_by_user_id,
        lastEditedByUserId:
            puzzle.last_edited_by_user_id,
        createdBy,
        lastEditedBy,
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