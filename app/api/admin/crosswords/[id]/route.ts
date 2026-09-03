import { createAuthServerClient } from "../../../../../lib/supabase/auth-server";
import { createServerSupabaseClient } from "../../../../../lib/supabase/server";

type RouteContext = { params: Promise<{ id: string }> };
type UpdateBody = {
    title: string;
    publicationDate: string | null;
    status: "draft" | "scheduled" | "archived";
    entries: Array<{ id: number; clue: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
    const authClient = await createAuthServerClient();
    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) return Response.json({ error: "Brak uprawnień." }, { status: 401 });
    const puzzleId = Number((await context.params).id);
    if (!Number.isInteger(puzzleId)) return Response.json({ error: "Niepoprawny identyfikator planszy." }, { status: 400 });

    let body: UpdateBody;
    try { body = await request.json(); } catch { return Response.json({ error: "Niepoprawny format żądania." }, { status: 400 }); }
    if (!body.title?.trim() || !Array.isArray(body.entries) || body.entries.some((entry) => !entry.clue?.trim())) {
        return Response.json({ error: "Tytuł i wszystkie wskazówki są wymagane." }, { status: 400 });
    }
    if (body.status === "scheduled" && !body.publicationDate) {
        return Response.json({ error: "Zaplanowana plansza musi mieć datę publikacji." }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    const { error: puzzleError } = await supabase.from("puzzles").update({
        title: body.title.trim(),
        publication_date: body.publicationDate || null,
        status: body.status,
        last_edited_by_user_id: user.id,
        updated_at: new Date().toISOString(),
    }).eq("id", puzzleId).eq("game_type", "crossword");
    if (puzzleError) return Response.json({ error: puzzleError.message.includes("publication") ? "Istnieje już krzyżówka na wybraną datę." : "Nie udało się zapisać planszy." }, { status: 400 });

    for (const entry of body.entries) {
        const { error } = await supabase.from("crossword_entries").update({ clue: entry.clue.trim() }).eq("id", entry.id).eq("puzzle_id", puzzleId);
        if (error) return Response.json({ error: "Nie udało się zapisać wskazówek." }, { status: 400 });
    }
    return Response.json({ puzzleId });
}

export async function DELETE(_request: Request, context: RouteContext) {
    const authClient = await createAuthServerClient();
    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) return Response.json({ error: "Brak uprawnień." }, { status: 401 });

    const puzzleId = Number((await context.params).id);
    if (!Number.isInteger(puzzleId)) return Response.json({ error: "Niepoprawny identyfikator planszy." }, { status: 400 });

    const supabase = createServerSupabaseClient();
    const { error } = await supabase.rpc("delete_scheduled_crossword", {
        target_puzzle_id: puzzleId,
    });

    if (error) {
        return Response.json({ error: error.message.includes("nie istnieje") ? "Krzyżówka nie istnieje." : "Nie udało się usunąć krzyżówki." }, { status: 400 });
    }

    return Response.json({ puzzleId });
}