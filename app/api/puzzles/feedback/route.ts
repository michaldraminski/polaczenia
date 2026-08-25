import { createServerSupabaseClient } from "../../../../lib/supabase/server";

type FeedbackRequest = {
    puzzleId: number;
    clientGameId: string;
    difficultyRating: number;
    qualityRating: number;
};

function isFeedbackRequest(value: unknown): value is FeedbackRequest {
    if (typeof value !== "object" || value === null) {
        return false;
    }

    const request = value as Partial<FeedbackRequest>;
    const difficultyRating = request.difficultyRating;
    const qualityRating = request.qualityRating;

    if (
        !Number.isInteger(request.puzzleId) ||
        typeof request.clientGameId !== "string" ||
        request.clientGameId.length === 0 ||
        request.clientGameId.length > 128
    ) {
        return false;
    }

    return (
        typeof difficultyRating === "number" &&
        Number.isInteger(difficultyRating) &&
        difficultyRating >= 1 &&
        difficultyRating <= 5 &&
        typeof qualityRating === "number" &&
        Number.isInteger(qualityRating) &&
        qualityRating >= 1 &&
        qualityRating <= 5
    );
}

export async function POST(request: Request) {
    let requestBody: unknown;

    try {
        requestBody = await request.json();
    } catch {
        return Response.json(
            { error: "Niepoprawny format żądania." },
            { status: 400 },
        );
    }

    if (!isFeedbackRequest(requestBody)) {
        return Response.json(
            { error: "Niepoprawne dane oceny." },
            { status: 400 },
        );
    }

    const supabase = createServerSupabaseClient();
    const { error } = await supabase.rpc("record_puzzle_feedback", {
        feedback_puzzle_id: requestBody.puzzleId,
        feedback_client_game_id: requestBody.clientGameId,
        feedback_difficulty_rating: requestBody.difficultyRating,
        feedback_quality_rating: requestBody.qualityRating,
    });

    if (error) {
        return Response.json(
            { error: "Nie udało się zapisać oceny." },
            { status: 500 },
        );
    }

    return Response.json({ saved: true });
}