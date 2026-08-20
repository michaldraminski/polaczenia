import { createServerSupabaseClient } from "../../../../lib/supabase/server";
import type {
    Difficulty,
    SolvedCategory,
    Word,
} from "../../../../types/game";

type RevealRequest = {
    puzzleId: number;
};

type CategoryRow = {
    id: number;
    name: string;
    difficulty: number;
};

type WordRow = {
    id: number;
    category_id: number;
    value: string;
    position: number;
};

function isDifficulty(
    value: number,
): value is Difficulty {
    return value >= 1 && value <= 4;
}

function isRevealRequest(
    value: unknown,
): value is RevealRequest {
    if (
        typeof value !== "object" ||
        value === null
    ) {
        return false;
    }

    const request = value as Partial<RevealRequest>;

    return Number.isInteger(request.puzzleId);
}

export async function POST(request: Request) {
    let requestBody: unknown;

    try {
        requestBody = await request.json();
    } catch {
        return Response.json(
            {
                error: "Niepoprawny format żądania.",
            },
            {
                status: 400,
            },
        );
    }

    if (!isRevealRequest(requestBody)) {
        return Response.json(
            {
                error: "Niepoprawny identyfikator planszy.",
            },
            {
                status: 400,
            },
        );
    }

    const supabase = createServerSupabaseClient();

    const {
        data: categoryRows,
        error: categoriesError,
    } = await supabase
        .from("categories")
        .select("id, name, difficulty")
        .eq("puzzle_id", requestBody.puzzleId)
        .order("difficulty");

    if (categoriesError) {
        return Response.json(
            {
                error: "Nie udało się pobrać kategorii.",
            },
            {
                status: 500,
            },
        );
    }

    const categories = categoryRows as CategoryRow[];

    if (categories.length === 0) {
        return Response.json(
            {
                error: "Nie znaleziono planszy.",
            },
            {
                status: 404,
            },
        );
    }

    const categoryIds = categories.map(
        (category) => category.id,
    );

    const {
        data: wordRows,
        error: wordsError,
    } = await supabase
        .from("words")
        .select("id, category_id, value, position")
        .in("category_id", categoryIds)
        .order("position");

    if (wordsError) {
        return Response.json(
            {
                error: "Nie udało się pobrać rozwiązania.",
            },
            {
                status: 500,
            },
        );
    }

    const words = wordRows as WordRow[];

    const revealedCategories: SolvedCategory[] =
        categories.map((category) => {
            if (!isDifficulty(category.difficulty)) {
                throw new Error(
                    `Niepoprawna trudność kategorii: ${category.difficulty}`,
                );
            }

            const categoryWords: Word[] = words
                .filter(
                    (word) =>
                        word.category_id === category.id,
                )
                .sort(
                    (firstWord, secondWord) =>
                        firstWord.position -
                        secondWord.position,
                )
                .map((word) => ({
                    id: word.id,
                    value: word.value,
                }));

            return {
                name: category.name,
                difficulty: category.difficulty,
                words: categoryWords,
            };
        });

    return Response.json({
        categories: revealedCategories,
    });
}