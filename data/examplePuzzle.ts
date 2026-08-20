import type { Puzzle } from "../types/game";

export const examplePuzzle: Puzzle = {
    categories: [
        {
            name: "Rzeki w Polsce",
            words: ["WISŁA", "ODRA", "BUG", "WARTA"],
            difficulty: 1,
        },
        {
            name: "Planety",
            words: ["MARS", "WENUS", "ZIEMIA", "JOWISZ"],
            difficulty: 2,
        },
        {
            name: "Elementy komputera",
            words: ["PORT", "MYSZ", "EKRAN", "KLAWIATURA"],
            difficulty: 3,
        },
        {
            name: "Związane z zamkiem",
            words: ["ZAMEK", "KLUCZ", "KORONA", "WIEŻA"],
            difficulty: 4,
        },
    ],
};