import { createServerSupabaseClient } from "../../../../lib/supabase/server";
import type {
    CheckResult,
    Difficulty,
    SolvedCategory,
    Word,
} from "../../../../types/game";

type CheckRequest = {
    puzzleId: number;
    wordIds: number[];
};

type CategoryRow = {
    id: number;
    name: string;
    difficulty: number;
};

type SelectedWordRow = {
    id: number;
    category_id: number;
};

type CategoryWordRow = {
    id: number;
    value: string;
    position: number;
};

function isDifficulty(
    value: number,
): value is Difficulty {
    return value >= 1 && value <= 4;
}

function isCheckRequest(
    value: unknown,
): value is CheckRequest {
    if (
        typeof value !== "object" ||
        value === null
    ) {
        return false;
    }

    const request = value as Partial<CheckRequest>;

    if (
        !Number.isInteger(request.puzzleId) ||
        !Array.isArray(request.wordIds)
    ) {
        return false;
    }

    if (
        request.wordIds.length !== 4 ||
        !request.wordIds.every(Number.isInteger)
    ) {
        return false;
    }

    return new Set(request.wordIds).size === 4;
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

    if (!isCheckRequest(requestBody)) {
        return Response.json(
            {
                error: "Wybierz dokładnie cztery różne słowa.",
            },
            {
                status: 400,
            },
        );
    }

    const { puzzleId, wordIds } = requestBody;
    const supabase = createServerSupabaseClient();

    const {
        data: categoryRows,
        error: categoriesError,
    } = await supabase
        .from("categories")
        .select("id, name, difficulty")
        .eq("puzzle_id", puzzleId);

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
        data: selectedWordRows,
        error: selectedWordsError,
    } = await supabase
        .from("words")
        .select("id, category_id")
        .in("id", wordIds)
        .in("category_id", categoryIds);

    if (selectedWordsError) {
        return Response.json(
            {
                error: "Nie udało się sprawdzić słów.",
            },
            {
                status: 500,
            },
        );
    }

    const selectedWords =
        selectedWordRows as SelectedWordRow[];

    if (selectedWords.length !== 4) {
        return Response.json(
            {
                error: "Wybrane słowa nie należą do tej planszy.",
            },
            {
                status: 400,
            },
        );
    }

    const categoryCounts = new Map<number, number>();

    for (const word of selectedWords) {
        const currentCount =
            categoryCounts.get(word.category_id) ?? 0;

        categoryCounts.set(
            word.category_id,
            currentCount + 1,
        );
    }

    const matchingCategoryId = [
        ...categoryCounts.entries(),
    ].find(([, count]) => count === 4)?.[0];

    if (matchingCategoryId !== undefined) {
        const category = categories.find(
            (currentCategory) =>
                currentCategory.id === matchingCategoryId,
        );

        if (
            !category ||
            !isDifficulty(category.difficulty)
        ) {
            return Response.json(
                {
                    error: "Kategoria ma niepoprawne dane.",
                },
                {
                    status: 500,
                },
            );
        }

        const {
            data: categoryWordRows,
            error: categoryWordsError,
        } = await supabase
            .from("words")
            .select("id, value, position")
            .eq("category_id", matchingCategoryId)
            .order("position");

        if (categoryWordsError) {
            return Response.json(
                {
                    error: "Nie udało się pobrać rozwiązania.",
                },
                {
                    status: 500,
                },
            );
        }

        const words: Word[] = (
            categoryWordRows as CategoryWordRow[]
        ).map((wordRow) => ({
            id: wordRow.id,
            value: wordRow.value,
        }));

        const solvedCategory: SolvedCategory = {
            name: category.name,
            difficulty: category.difficulty,
            words,
        };

        const result: CheckResult = {
            result: "correct",
            category: solvedCategory,
        };

        return Response.json(result);
    }

    const isOneAway = [
        ...categoryCounts.values(),
    ].some((count) => count === 3);

    const result: CheckResult = isOneAway
        ? {
              result: "one-away",
          }
        : {
              result: "incorrect",
          };

    return Response.json(result);
}