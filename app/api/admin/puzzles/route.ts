import { createAuthServerClient } from "../../../../lib/supabase/auth-server";
import { createServerSupabaseClient } from "../../../../lib/supabase/server";

type PuzzleStatus = "draft" | "scheduled";

type CategoryInput = {
    name: string;
    words: string[];
};

type CreatePuzzleRequest = {
    title: string;
    publicationDate: string | null;
    status: PuzzleStatus;
    categories: CategoryInput[];
};

function isPuzzleStatus(
    value: unknown,
): value is PuzzleStatus {
    return value === "draft" || value === "scheduled";
}

function isCategoryInput(
    value: unknown,
): value is CategoryInput {
    if (
        typeof value !== "object" ||
        value === null
    ) {
        return false;
    }

    const category =
        value as Partial<CategoryInput>;

    return (
        typeof category.name === "string" &&
        Array.isArray(category.words) &&
        category.words.length === 4 &&
        category.words.every(
            (word) => typeof word === "string",
        )
    );
}

function isCreatePuzzleRequest(
    value: unknown,
): value is CreatePuzzleRequest {
    if (
        typeof value !== "object" ||
        value === null
    ) {
        return false;
    }

    const request =
        value as Partial<CreatePuzzleRequest>;

    return (
        typeof request.title === "string" &&
        (typeof request.publicationDate ===
            "string" ||
            request.publicationDate === null) &&
        isPuzzleStatus(request.status) &&
        Array.isArray(request.categories) &&
        request.categories.length === 4 &&
        request.categories.every(isCategoryInput)
    );
}

function validateRequest(
    request: CreatePuzzleRequest,
): string | null {
    if (!request.title.trim()) {
        return "Podaj tytuł planszy.";
    }

    if (
        request.status === "scheduled" &&
        !request.publicationDate
    ) {
        return "Zaplanowana plansza musi mieć datę publikacji.";
    }

    if (
        request.categories.some(
            (category) => !category.name.trim(),
        )
    ) {
        return "Każda kategoria musi mieć nazwę.";
    }

    const words = request.categories.flatMap(
        (category) =>
            category.words.map((word) =>
                word.trim(),
            ),
    );

    if (words.some((word) => !word)) {
        return "Każda kategoria musi mieć cztery słowa.";
    }

    const normalizedWords = words.map((word) =>
        word.toLocaleLowerCase("pl-PL"),
    );

    if (
        new Set(normalizedWords).size !==
        normalizedWords.length
    ) {
        return "Słowa na planszy nie mogą się powtarzać.";
    }

    return null;
}

export async function POST(request: Request) {
    const authClient =
        await createAuthServerClient();

    const {
        data: { user },
        error: authError,
    } = await authClient.auth.getUser();

    if (authError || !user) {
        return Response.json(
            {
                error: "Brak uprawnień.",
            },
            {
                status: 401,
            },
        );
    }

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

    if (!isCreatePuzzleRequest(requestBody)) {
        return Response.json(
            {
                error: "Niepoprawne dane planszy.",
            },
            {
                status: 400,
            },
        );
    }

    const validationError =
        validateRequest(requestBody);

    if (validationError) {
        return Response.json(
            {
                error: validationError,
            },
            {
                status: 400,
            },
        );
    }

    const supabase =
        createServerSupabaseClient();

    const { data: puzzleId, error } =
        await supabase.rpc("create_puzzle", {
            puzzle_title:
                requestBody.title.trim(),
            puzzle_publication_date:
                requestBody.publicationDate ||
                null,
            puzzle_status: requestBody.status,
            puzzle_categories:
                requestBody.categories.map(
                    (category) => ({
                        name: category.name.trim(),
                        words: category.words.map(
                            (word) => word.trim(),
                        ),
                    }),
                ),
        });

    if (error) {
        const message =
            error.message.includes(
                "puzzles_publication_date_key",
            )
                ? "Istnieje już plansza na wybraną datę."
                : "Nie udało się zapisać planszy.";

        return Response.json(
            {
                error: message,
            },
            {
                status: 400,
            },
        );
    }

    return Response.json(
        {
            puzzleId,
        },
        {
            status: 201,
        },
    );
}