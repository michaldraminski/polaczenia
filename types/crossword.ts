export type CrosswordCell = {
    blocked: boolean;
    value: string | null;
};

export type CrosswordGrid = CrosswordCell[][];

export type CrosswordDirection = "across" | "down";

export type CrosswordEntry = {
    number: number;
    direction: CrosswordDirection;
    row: number;
    column: number;
    answer: string;
    clue: string;
};

export type CrosswordPuzzle = {
    id: number;
    title: string;
    author: string;
    grid: CrosswordGrid;
    entries: CrosswordEntry[];
};
