import "server-only";

import { getCurrentDateInPoland } from "./date";
import { createServerSupabaseClient } from "./supabase/server";
import type { CrosswordData } from "../components/CrosswordGame";

type CrosswordEntryRow = {
    answer: string;
    row_index: number;
    column_index: number;
    length: number;
    direction: "horizontal" | "vertical";
    clue: string;
};

export async function getTodaysCrossword(): Promise<CrosswordData | null> {
    const supabase = createServerSupabaseClient();
    const { data: puzzle, error: puzzleError } = await supabase
        .from("puzzles")
        .select("id")
        .eq("game_type", "crossword")
        .eq("status", "scheduled")
        .eq("publication_date", getCurrentDateInPoland())
        .maybeSingle();
    if (puzzleError) {
        // Pozwala uruchomić publiczną stronę przed zastosowaniem migracji krzyżówek.
        if (puzzleError.message.includes("game_type does not exist")) return null;
        throw new Error(`Nie udało się pobrać krzyżówki: ${puzzleError.message}`);
    }
    if (!puzzle) return null;

    const { data: board, error: boardError } = await supabase
        .from("crossword_puzzles")
        .select("size, grid")
        .eq("puzzle_id", puzzle.id)
        .single();
    if (boardError) throw new Error(`Nie udało się pobrać planszy krzyżówki: ${boardError.message}`);
    const { data: entries, error: entriesError } = await supabase
        .from("crossword_entries")
        .select("answer, row_index, column_index, length, direction, clue")
        .eq("puzzle_id", puzzle.id)
        .order("position");
    if (entriesError) throw new Error(`Nie udało się pobrać haseł krzyżówki: ${entriesError.message}`);

    return {
        size: board.size,
        grid: board.grid,
        words: (entries as CrosswordEntryRow[]).map((entry) => ({
            word: entry.answer,
            row: entry.row_index,
            col: entry.column_index,
            length: entry.length,
            direction: entry.direction,
            clue: entry.clue,
        })),
    };
}