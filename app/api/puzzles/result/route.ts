import { createServerSupabaseClient } from "../../../../lib/supabase/server";

type GameResultRequest = {
    puzzleId: number;
    clientGameId: string;
    result: "won" | "lost";
    attempts: number;
    durationSeconds: number;
};

function isGameResultRequest(
    value: unknown,
): value is GameResultRequest {
    if (typeof value !== "object" || value === null) {
        return false;
    }

    const request = value as Partial<GameResultRequest>;
    const attempts = request.attempts;
    const durationSeconds = request.durationSeconds;

    if (
        !Number.isInteger(request.puzzleId) ||
        typeof request.clientGameId !== "string" ||
        request.clientGameId.length === 0 ||
        request.clientGameId.length > 128 ||
        (request.result !== "won" && request.result !== "lost")
    ) {
        return false;
    }

    if (
        typeof attempts !== "number" ||
        !Number.isInteger(attempts) ||
        attempts < 1 ||
        attempts > 4
    ) {
        return false;
    }

    return (
        typeof durationSeconds === "number" &&
        Number.isInteger(durationSeconds) &&
        durationSeconds >= 0 &&
        durationSeconds <= 86400
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

    if (!isGameResultRequest(requestBody)) {
        return Response.json(
            { error: "Niepoprawne dane wyniku." },
            { status: 400 },
        );
    }

    const supabase = createServerSupabaseClient();
    const { error } = await supabase.rpc("record_game_result", {
        result_puzzle_id: requestBody.puzzleId,
        result_client_game_id: requestBody.clientGameId,
        result_status: requestBody.result,
        result_attempts: requestBody.attempts,
        result_duration_seconds: requestBody.durationSeconds,
    });

    if (error) {
        return Response.json(
            { error: "Nie udało się zapisać wyniku." },
            { status: 500 },
        );
    }

    return Response.json({ saved: true });
}