export type Difficulty = 1 | 2 | 3 | 4;

export type Word = {
    id: number;
    value: string;
};

export type Category = {
    id: number;
    name: string;
    words: Word[];
    difficulty: Difficulty;
};

export type Puzzle = {
    id: number;
    categories: Category[];
};

export type PublicPuzzle = {
    id: number;
    words: PublicWord[];
    categories: PublicCategory[];
    categoryCount: number;
};

export type PublicWord = Word & {
    categoryId: number;
};

export type PublicCategory = {
    id: number;
    name: string;
    difficulty: Difficulty;
    wordIds: number[];
};

export type SolvedCategory = {
    name: string;
    words: Word[];
    difficulty: Difficulty;
};

export type CheckResult =
    | {
          result: "correct";
          category: SolvedCategory;
      }
    | {
          result: "one-away";
      }
    | {
          result: "incorrect";
      };

export type GameStatus = "playing" | "won" | "lost";