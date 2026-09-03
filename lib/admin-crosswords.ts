import "server-only";

import { createServerSupabaseClient } from "./supabase/server";

export type CrosswordEntry = {
    id: number;
    number: number;
    direction: "horizontal" | "vertical";
    row: number;
    col: number;
    length: number;
    answer: string;
    clue: string;
};

export type AdminCrossword = {
    id: number;
    title: string;
    publicationDate: string | null;
    status: "draft" | "scheduled" | "archived";
    size: number;
    grid: string[][];
    entries: CrosswordEntry[];
};

type PuzzleRow = {
    id: number;
    title: string;
    publication_date: string | null;
    status: AdminCrossword["status"];
};

type CrosswordRow = {
    puzzle_id: number;
    size: number;
    grid: string[][];
};

type EntryRow = {
    id: number;
    puzzle_id: number;
    number: number;
    direction: CrosswordEntry["direction"];
    row_index: number;
    column_index: number;
    length: number;
    answer: string;
    clue: string;
    position: number;
};

export async function getAdminCrosswords(): Promise<AdminCrossword[]> {
    const supabase = createServerSupabaseClient();
    const { data: puzzles, error: puzzleError } = await supabase
        .from("puzzles")
        .select("id, title, publication_date, status")
        .eq("game_type", "crossword")
        .order("publication_date", { ascending: false, nullsFirst: true });

    if (puzzleError) {
        if (puzzleError.message.includes("game_type does not exist")) {
            return [];
        }

        throw new Error(`Nie udało się pobrać krzyżówek: ${puzzleError.message}`);
    }
    if (!puzzles || puzzles.length === 0) return [];

    const puzzleRows = puzzles as PuzzleRow[];
    const ids = puzzleRows.map((puzzle) => puzzle.id);
    const { data: crosswordData, error: crosswordError } = await supabase
        .from("crossword_puzzles")
        .select("puzzle_id, size, grid")
        .in("puzzle_id", ids);
    if (crosswordError) throw new Error(`Nie udało się pobrać plansz krzyżówek: ${crosswordError.message}`);

    const { data: entryData, error: entryError } = await supabase
        .from("crossword_entries")
        .select("id, puzzle_id, number, direction, row_index, column_index, length, answer, clue, position")
        .in("puzzle_id", ids)
        .order("position");
    if (entryError) throw new Error(`Nie udało się pobrać haseł krzyżówek: ${entryError.message}`);

    const crosswordRows = crosswordData as CrosswordRow[];
    const entries = entryData as EntryRow[];
    return puzzleRows.flatMap((puzzle) => {
        const board = crosswordRows.find((row) => row.puzzle_id === puzzle.id);
        if (!board) return [];
        return [{
            id: puzzle.id,
            title: puzzle.title,
            publicationDate: puzzle.publication_date,
            status: puzzle.status,
            size: board.size,
            grid: board.grid,
            entries: entries.filter((entry) => entry.puzzle_id === puzzle.id).map((entry) => ({
                id: entry.id,
                number: entry.number,
                direction: entry.direction,
                row: entry.row_index,
                col: entry.column_index,
                length: entry.length,
                answer: entry.answer,
                clue: entry.clue,
            })),
        }];
    });
}

export async function getAdminCrossword(id: number): Promise<AdminCrossword | null> {
    return (await getAdminCrosswords()).find((crossword) => crossword.id === id) ?? null;
}