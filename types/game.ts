export type Difficulty = 1 | 2 | 3 | 4;

export type Category = {
    name: string;
    words: string[];
    difficulty: Difficulty;
};

export type Puzzle = {
    categories: Category[];
};

export type GameStatus = "playing" | "won" | "lost";