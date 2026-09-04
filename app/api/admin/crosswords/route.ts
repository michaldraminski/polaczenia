import { randomInt } from "node:crypto";

import { createAuthServerClient } from "../../../../lib/supabase/auth-server";
import { createServerSupabaseClient } from "../../../../lib/supabase/server";
import { getCurrentDateInPoland } from "../../../../lib/date";
import { generateCrossword } from "../../../../lib/crossword-generator";

export const runtime = "nodejs";

type CreateCrosswordRequest = { title?: string; publicationDate?: string | null };

function getNextDate(date: string): string {
    const next = new Date(`${date}T12:00:00Z`);
    next.setUTCDate(next.getUTCDate() + 1);
    return next.toISOString().slice(0, 10);
}

async function getFirstAvailableDate(
    supabase: ReturnType<typeof createServerSupabaseClient>,
    startingDate: string,
): Promise<string> {
    let candidateDate = startingDate;

    while (true) {
        const { data, error } = await supabase
            .from("puzzles")
            .select("id")
            .eq("game_type", "crossword")
            .eq("publication_date", candidateDate)
            .maybeSingle();

        if (error) {
            throw new Error(error.message);
        }

        if (!data) {
            return candidateDate;
        }

        candidateDate = getNextDate(candidateDate);
    }
}

export async function POST(request: Request) {
    const authClient = await createAuthServerClient();
    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) return Response.json({ error: "Brak uprawnień." }, { status: 401 });

    let body: CreateCrosswordRequest = {};
    try { body = await request.json(); } catch { /* optional body */ }
    const title = body.title?.trim() || "Krzyżóweczka";

    try {
        const generatorSeed = randomInt(0, 2_147_483_647);
        const generated = await generateCrossword(generatorSeed);
        const supabase = createServerSupabaseClient();
        const requestedDate = await getFirstAvailableDate(
            supabase,
            body.publicationDate || getNextDate(getCurrentDateInPoland()),
        );
        const { data: puzzle, error: puzzleError } = await supabase.from("puzzles").insert({
            title,
            publication_date: requestedDate,
            status: "scheduled",
            game_type: "crossword",
            created_by_user_id: user.id,
            last_edited_by_user_id: user.id,
        }).select("id").single();
        if (puzzleError || !puzzle) throw new Error(puzzleError?.message || "Nie udało się utworzyć planszy.");

        const horizontal = generated.words.filter((word) => word.direction === "horizontal");
        const vertical = generated.words.filter((word) => word.direction === "vertical");
        const entries = generated.words.map((word, index) => ({
            puzzle_id: puzzle.id,
            number: (word.direction === "horizontal" ? horizontal : vertical).indexOf(word) + 1,
            direction: word.direction,
            row_index: word.row,
            column_index: word.col,
            length: word.length,
            answer: word.word,
            clue: word.clue,
            position: index + 1,
        }));
        const { error: boardError } = await supabase.from("crossword_puzzles").insert({ puzzle_id: puzzle.id, size: generated.size, grid: generated.grid, generator_seed: generatorSeed });
        const { error: entriesError } = await supabase.from("crossword_entries").insert(entries);
        if (boardError || entriesError) throw new Error(boardError?.message || entriesError?.message || "Nie udało się zapisać haseł.");
        return Response.json({ puzzleId: puzzle.id }, { status: 201 });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Nie udało się wygenerować krzyżówki.";
        const missingMigration = message.includes("game_type") && message.includes("puzzles");
        return Response.json({
            error: missingMigration
                ? "Baza danych nie ma jeszcze struktury krzyżówek. Zastosuj migrację 202609030001_create_crosswords.sql w Supabase SQL Editor."
                : `Nie udało się wygenerować krzyżówki: ${message}`,
        }, { status: 400 });
    }
}