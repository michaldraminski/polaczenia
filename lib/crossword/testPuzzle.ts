import type { CrosswordPuzzle } from "../../types/crossword";

export const testPuzzle: CrosswordPuzzle = {
    id: 1,
    title: "Mini krzyżówka",
    author: "Test",
    
    grid: [
        [
            { blocked: false, value: null },
            { blocked: false, value: null },
            { blocked: false, value: null },
            { blocked: true, value: null },
            { blocked: true, value: null },
        ],
        [
            { blocked: false, value: null },
            { blocked: false, value: null },
            { blocked: false, value: null },
            { blocked: true, value: null },
            { blocked: true, value: null },
        ],
        [
            { blocked: false, value: null },
            { blocked: false, value: null },
            { blocked: false, value: null },
            { blocked: true, value: null },
            { blocked: true, value: null },
        ],
        [
            { blocked: true, value: null },
            { blocked: true, value: null },
            { blocked: true, value: null },
            { blocked: false, value: null },
            { blocked: false, value: null },
        ],
        [
            { blocked: true, value: null },
            { blocked: true, value: null },
            { blocked: true, value: null },
            { blocked: false, value: null },
            { blocked: false, value: null },
        ],
    ],

    entries: [
        {
            number: 1,
            direction: "across",
            row: 0,
            column: 0,
            answer: "KOT",
            clue: "Zwierzę domowe",
        },
        {
            number: 2,
            direction: "across",
            row: 1,
            column: 0,
            answer: "OSA",
            clue: "Owad",
        },
        {
            number: 3,
            direction: "across",
            row: 2,
            column: 0,
            answer: "TOR",
            clue: "Droga pociągu",
        },

        {
            number: 1,
            direction: "down",
            row: 0,
            column: 0,
            answer: "KOT",
            clue: "Zwierzę domowe",
        },
        {
            number: 2,
            direction: "down",
            row: 0,
            column: 1,
            answer: "OTO",
            clue: "Wskazanie czegoś",
        },
        {
            number: 3,
            direction: "down",
            row: 0,
            column: 2,
            answer: "TAR",
            clue: "Dawna nazwa smoły",
        },
    ],
};
