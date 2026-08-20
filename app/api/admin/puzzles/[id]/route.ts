import { createAuthServerClient } from "../../../../../lib/supabase/auth-server";
import { createServerSupabaseClient } from "../../../../../lib/supabase/server";

type PuzzleStatus =
    | "draft"
    | "scheduled"
    | "archived";

type CategoryInput = {
    name: string;
    words: string[];
};

type UpdatePuzzleRequest = {
    title: string;
    publicationDate: string | null;
    status: PuzzleStatus;
    categories: CategoryInput[];
};

type RouteContext = {
    params: Promise<{
        id: string;
    }>;
};

function isPuzzleStatus(
    value: unknown,
): value is PuzzleStatus {
    return (
        value === "draft" ||
        value === "scheduled" ||
        value === "archived"
    );
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

function isUpdatePuzzleRequest(
    value: unknown,
): value is UpdatePuzzleRequest {
    if (
        typeof value !== "object" ||
        value === null
    ) {
        return false;
    }

    const request =
        value as Partial<UpdatePuzzleRequest>;

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
    request: UpdatePuzzleRequest,
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

export async function PATCH(
    request: Request,
    context: RouteContext,
) {
    const authClient =
        await createAuthServerClient();

    const {
        data: { user },
        error: authError,
    } = await authClient.auth.getUser();

    if (authError || !user) {
        return Response.json(
            { error: "Brak uprawnień." },
            { status: 401 },
        );
    }

    const { id } = await context.params;
    const puzzleId = Number(id);

    if (!Number.isInteger(puzzleId)) {
        return Response.json(
            {
                error: "Niepoprawny identyfikator planszy.",
            },
            { status: 400 },
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
            { status: 400 },
        );
    }

    if (!isUpdatePuzzleRequest(requestBody)) {
        return Response.json(
            {
                error: "Niepoprawne dane planszy.",
            },
            { status: 400 },
        );
    }

    const validationError =
        validateRequest(requestBody);

    if (validationError) {
        return Response.json(
            { error: validationError },
            { status: 400 },
        );
    }

    const supabase =
        createServerSupabaseClient();

    const { error } = await supabase.rpc(
        "update_puzzle",
        {
            target_puzzle_id: puzzleId,
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
        },
    );

    if (error) {
        let message =
            "Nie udało się zaktualizować planszy.";

        if (
            error.message.includes(
                "puzzles_publication_date_key",
            )
        ) {
            message =
                "Istnieje już inna plansza na wybraną datę.";
        }

        if (
            error.message.includes(
                "Plansza nie istnieje",
            )
        ) {
            message = "Plansza nie istnieje.";
        }

        return Response.json(
            { error: message },
            { status: 400 },
        );
    }

    return Response.json({
        puzzleId,
    });
}
