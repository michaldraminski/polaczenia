import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import wordDictionary from "../scripts/slownik_bez_rzadkich.json";

const SIZE = 5;
const MIN_WORD_LENGTH = 3;
const MAX_ATTEMPTS = 500;

type Direction = "horizontal" | "vertical";

type Slot = {
    row: number;
    col: number;
    length: number;
    direction: Direction;
};

type ClueCache = Record<string, string | null>;

export type GeneratedCrossword = {
    size: number;
    grid: string[][];
    words: Array<{
        word: string;
        row: number;
        col: number;
        length: number;
        direction: Direction;
        clue: string;
    }>;
};

class SeededRandom {
    private state: number;

    constructor(seed: number) {
        this.state = seed || 1;
    }

    next(): number {
        this.state = (this.state * 1664525 + 1013904223) >>> 0;
        return this.state / 4294967296;
    }

    integer(maxExclusive: number): number {
        return Math.floor(this.next() * maxExclusive);
    }

    shuffle<T>(values: T[]): void {
        for (let index = values.length - 1; index > 0; index -= 1) {
            const swapIndex = this.integer(index + 1);
            [values[index], values[swapIndex]] = [values[swapIndex], values[index]];
        }
    }
}

function getWords(): string[] {
    const words = Object.values(wordDictionary).flatMap((lengths) => [
        ...lengths["3"],
        ...lengths["4"],
        ...lengths["5"],
    ]);

    return [...new Set(words.map((word) => word.trim().toLowerCase()))].filter(
        (word) =>
            word.length >= MIN_WORD_LENGTH &&
            word.length <= SIZE &&
            /^[a-ząćęłńóśźż]+$/i.test(word),
    );
}

function getCells(slot: Slot): Array<[number, number]> {
    return Array.from({ length: slot.length }, (_, index) =>
        slot.direction === "horizontal"
            ? [slot.row, slot.col + index]
            : [slot.row + index, slot.col],
    );
}

function generateBlockPattern(random: SeededRandom): boolean[][] {
    const blocks = Array.from({ length: SIZE }, () =>
        Array.from({ length: SIZE }, () => false),
    );
    const candidates: Array<[number, number]> = [];

    for (let row = 0; row < SIZE; row += 1) {
        for (let col = 0; col < SIZE; col += 1) {
            const mirroredRow = SIZE - 1 - row;
            const mirroredCol = SIZE - 1 - col;
            if (row === 2 && col === 2) continue;
            if (row > mirroredRow || (row === mirroredRow && col > mirroredCol)) continue;
            candidates.push([row, col]);
        }
    }

    random.shuffle(candidates);
    const blockCount = random.integer(7);
    for (let index = 0; index < blockCount; index += 1) {
        const [row, col] = candidates[index];
        blocks[row][col] = true;
        blocks[SIZE - 1 - row][SIZE - 1 - col] = true;
    }
    return blocks;
}

function extractSlots(blocks: boolean[][]): Slot[] {
    const slots: Slot[] = [];

    for (let row = 0; row < SIZE; row += 1) {
        let col = 0;
        while (col < SIZE) {
            if (blocks[row][col]) {
                col += 1;
                continue;
            }
            const start = col;
            while (col < SIZE && !blocks[row][col]) col += 1;
            if (col - start >= MIN_WORD_LENGTH) {
                slots.push({ row, col: start, length: col - start, direction: "horizontal" });
            }
        }
    }

    for (let col = 0; col < SIZE; col += 1) {
        let row = 0;
        while (row < SIZE) {
            if (blocks[row][col]) {
                row += 1;
                continue;
            }
            const start = row;
            while (row < SIZE && !blocks[row][col]) row += 1;
            if (row - start >= MIN_WORD_LENGTH) {
                slots.push({ row: start, col, length: row - start, direction: "vertical" });
            }
        }
    }

    return slots;
}

function validBlockPattern(blocks: boolean[][]): boolean {
    return extractSlots(blocks).length > 0 && [
        ...Array.from({ length: SIZE }, (_, row) => {
            const lengths: number[] = [];
            let length = 0;
            for (let col = 0; col < SIZE; col += 1) {
                if (blocks[row][col]) {
                    if (length > 0) lengths.push(length);
                    length = 0;
                } else length += 1;
            }
            if (length > 0) lengths.push(length);
            return lengths;
        }),
        ...Array.from({ length: SIZE }, (_, col) => {
            const lengths: number[] = [];
            let length = 0;
            for (let row = 0; row < SIZE; row += 1) {
                if (blocks[row][col]) {
                    if (length > 0) lengths.push(length);
                    length = 0;
                } else length += 1;
            }
            if (length > 0) lengths.push(length);
            return lengths;
        }),
    ].flat().every((length) => length === 0 || length >= MIN_WORD_LENGTH);
}

function getCandidates(slot: Slot, grid: (string | null)[][], words: string[]): string[] {
    return words.filter((word) => {
        if (word.length !== slot.length) return false;
        return getCells(slot).every(([row, col], index) => {
            const existing = grid[row][col];
            return existing === null || existing === word[index];
        });
    });
}

function solve(
    slots: Slot[],
    grid: (string | null)[][],
    words: string[],
    usedWords: Set<string>,
    random: SeededRandom,
): boolean {
    if (slots.length === 0) return true;

    let bestSlots: Slot[] = [];
    let bestCandidates: string[] = [];

    for (const slot of slots) {
        const candidates = getCandidates(slot, grid, words).filter(
            (word) => !usedWords.has(word),
        );
        if (bestSlots.length === 0 || candidates.length < bestCandidates.length) {
            bestSlots = [slot];
            bestCandidates = candidates;
        } else if (candidates.length === bestCandidates.length) {
            bestSlots.push(slot);
        }
        if (candidates.length === 0) return false;
    }

    const slot = bestSlots[random.integer(bestSlots.length)];
    bestCandidates = getCandidates(slot, grid, words).filter(
        (word) => !usedWords.has(word),
    );
    random.shuffle(bestCandidates);

    for (const word of bestCandidates) {
        const changed: Array<[number, number]> = [];
        for (const [index, [row, col]] of getCells(slot).entries()) {
            if (grid[row][col] === null) {
                grid[row][col] = word[index];
                changed.push([row, col]);
            }
        }
        usedWords.add(word);
        if (solve(slots.filter((candidate) => candidate !== slot), grid, words, usedWords, random)) {
            return true;
        }
        usedWords.delete(word);
        for (const [row, col] of changed) grid[row][col] = null;
    }
    return false;
}

const clueCachePath = path.join(process.cwd(), "scripts", "clue_cache.json");

function decodeHtml(value: string): string {
    return value
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/gi, " ")
        .replace(/&amp;/gi, "&")
        .replace(/&quot;/gi, '"')
        .replace(/&#39;|&apos;/gi, "'")
        .replace(/&lt;/gi, "<")
        .replace(/&gt;/gi, ">")
        .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
        .replace(/\s+/g, " ")
        .trim();
}

function cleanClue(value: string, word: string): string | null {
    const clue = decodeHtml(value).replace(/^\s*(?:znaczenie|definicja)\s*:\s*/i, "");
    if (clue.length < 5 || clue.toLowerCase() === word || clue.toLowerCase().startsWith(`${word} `)) return null;
    return clue.length > 120 ? `${clue.slice(0, 117).trimEnd()}...` : clue;
}

async function fetchText(url: string): Promise<string | null> {
    try {
        const response = await fetch(url, {
            headers: { "User-Agent": "Polaczenia crossword generator/1.0" },
            signal: AbortSignal.timeout(5000),
        });
        return response.ok ? response.text() : null;
    } catch {
        return null;
    }
}

async function fetchSjpClue(word: string): Promise<string | null> {
    const html = await fetchText(`https://sjp.pl/${encodeURIComponent(word)}`);
    if (!html) return null;
    const markerIndex = html.search(/znaczenie\s*:/i);
    if (markerIndex < 0) return null;
    const section = html.slice(markerIndex, markerIndex + 12000);
    const candidates = section.match(/<(?:p|dd|li|div)[^>]*>([\s\S]*?)<\/(?:p|dd|li|div)>/gi) ?? [];
    for (const candidate of candidates) {
        const clue = cleanClue(candidate, word);
        if (clue) return clue;
    }
    return null;
}

async function fetchWiktionaryClue(word: string): Promise<string | null> {
    const url = new URL("https://pl.wiktionary.org/w/api.php");
    url.searchParams.set("action", "parse");
    url.searchParams.set("page", word);
    url.searchParams.set("prop", "text");
    url.searchParams.set("format", "json");
    url.searchParams.set("origin", "*");
    const response = await fetchText(url.toString());
    if (!response) return null;
    try {
        const html = (JSON.parse(response) as { parse?: { text?: { "*"?: string } } }).parse?.text?.["*"];
        if (!html) return null;
        const meanings = html.match(/<h[23][^>]*>[\s\S]*?znaczenia[\s\S]*?<\/h[23]>([\s\S]*?)(?=<h[23]|$)/i)?.[1];
        const candidates = (meanings ?? html).match(/<li[^>]*>([\s\S]*?)<\/li>/gi) ?? [];
        for (const candidate of candidates) {
            const clue = cleanClue(candidate, word);
            if (clue) return clue;
        }
    } catch {
        return null;
    }
    return null;
}

async function loadClueCache(): Promise<ClueCache> {
    try {
        return JSON.parse(await readFile(clueCachePath, "utf8")) as ClueCache;
    } catch {
        return {};
    }
}

async function getClue(word: string, cache: ClueCache): Promise<string> {
    if (typeof cache[word] === "string" && cache[word].trim()) return cache[word];

    const clue = await fetchSjpClue(word) ?? await fetchWiktionaryClue(word);
    cache[word] = clue;
    return clue ?? "Brak definicji";
}

async function saveClueCache(cache: ClueCache): Promise<void> {
    try {
        await writeFile(clueCachePath, `${JSON.stringify(cache, null, 2)}\n`, "utf8");
    } catch {
        // Cache jest optymalizacją; brak możliwości zapisu nie powinien blokować generowania.
    }
}

async function createOutput(blocks: boolean[][], slots: Slot[], grid: (string | null)[][]): Promise<GeneratedCrossword> {
    const cache = await loadClueCache();
    const words = slots.map((slot) => getCells(slot).map(([row, col]) => grid[row][col]).join(""));
    const clues = await Promise.all(words.map((word) => getClue(word.toLowerCase(), cache)));
    await saveClueCache(cache);

    return {
        size: SIZE,
        grid: blocks.map((row, rowIndex) =>
            row.map((isBlock, colIndex) => (isBlock ? "#" : grid[rowIndex][colIndex] ?? "#")),
        ),
        words: slots.map((slot, index) => {
            const word = words[index];
            return {
                word,
                row: slot.row,
                col: slot.col,
                length: slot.length,
                direction: slot.direction,
                clue: clues[index],
            };
        }),
    };
}

export async function generateCrossword(seed: number): Promise<GeneratedCrossword> {
    const random = new SeededRandom(seed);
    const words = getWords();

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
        const blocks = generateBlockPattern(random);
        if (!validBlockPattern(blocks)) continue;
        const slots = extractSlots(blocks);
        if (!slots.some((slot) => slot.direction === "horizontal") || !slots.some((slot) => slot.direction === "vertical")) continue;

        const grid = blocks.map((row) => row.map((isBlock) => (isBlock ? "#" : null)));
        const usedWords = new Set<string>();
        if (solve(slots, grid, words, usedWords, random)) {
            return createOutput(blocks, slots, grid);
        }
    }

    throw new Error("Nie udało się wygenerować krzyżówki.");
}
