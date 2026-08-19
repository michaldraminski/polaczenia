"use client";

import { useEffect, useState } from "react";

type GameStatus = "playing" | "won" | "lost";

type Difficulty = 1 | 2 | 3 | 4;

type Category = {
    name: string;
    words: string[];
    difficulty: Difficulty;
};

const categories: Category[] = [
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
];

const initialWords = [
    "ZAMEK",
    "WISŁA",
    "MARS",
    "PORT",
    "KLUCZ",
    "ODRA",
    "WENUS",
    "MYSZ",
    "KORONA",
    "BUG",
    "ZIEMIA",
    "EKRAN",
    "WIEŻA",
    "WARTA",
    "JOWISZ",
    "KLAWIATURA",
];

function shuffle<T>(items: T[]): T[] {
    const shuffledItems = [...items];

    for (
        let index = shuffledItems.length - 1;
        index > 0;
        index--
    ) {
        const randomIndex = Math.floor(
            Math.random() * (index + 1),
        );

        [shuffledItems[index], shuffledItems[randomIndex]] = [
            shuffledItems[randomIndex],
            shuffledItems[index],
        ];
    }

    return shuffledItems;
}

function getCategoryColor(difficulty: Difficulty): string {
    switch (difficulty) {
        case 1:
            return "bg-yellow-300";
        case 2:
            return "bg-green-400";
        case 3:
            return "bg-blue-400";
        case 4:
            return "bg-purple-400";
    }
}

export default function Home() {
    const [boardWords, setBoardWords] = useState<string[]>(initialWords);
    const [selectedWords, setSelectedWords] = useState<string[]>([]);
    const [solvedCategories, setSolvedCategories] = useState<Category[]>([]);
    const [message, setMessage] = useState("");
    const [mistakes, setMistakes] = useState(0);
    const [gameStatus, setGameStatus] = useState<GameStatus>("playing");

    useEffect(() => {
        setBoardWords(shuffle(initialWords));
    }, []);

    function toggleWord(word: string) {
        if (gameStatus !== "playing") {
            return;
        }
        const isSelected = selectedWords.includes(word);

        setMessage("");

        if (isSelected) {
            setSelectedWords((previousWords) =>
                previousWords.filter(
                    (selectedWord) => selectedWord !== word,
                ),
            );
            return;
        }

        if (selectedWords.length < 4) {
            setSelectedWords((previousWords) => [
                ...previousWords,
                word,
            ]);
        }
    }

    function checkSelection() {
        if (selectedWords.length !== 4) {
            setMessage("Zaznacz dokładnie cztery słowa.");
            return;
        }

        const matchingCategory = categories.find((category) =>
            category.words.every((word) =>
                selectedWords.includes(word),
            ),
        );

        if (!matchingCategory) {
            const isOneAway = categories.some((category) => {
                const matchingWordsCount = category.words.filter((word) =>
                    selectedWords.includes(word),
                ).length;

                return matchingWordsCount === 3;
            });

            const newMistakes = mistakes + 1;

            setMistakes(newMistakes);
            // setSelectedWords([]);

            if (newMistakes >= maximumMistakes) {
                setGameStatus("lost");
                setMessage("Koniec gry. Oto pozostałe rozwiązania.");
                return;
            }

            if (isOneAway) {
                setMessage("Brakuje jednego!");
                return;
            }

            setMessage("Te słowa nie tworzą grupy.");
            return;
        }

        const newSolvedCategories = [
            ...solvedCategories,
            matchingCategory,
        ];

        setSolvedCategories(newSolvedCategories);
        setSelectedWords([]);

        if (newSolvedCategories.length === categories.length) {
            setGameStatus("won");
            setMessage("Brawo! Wszystkie grupy zostały rozwiązane.");
            return;
        }

        setMessage("Dobrze!");
    }

    function shuffleWords() {
        setBoardWords((previousWords) => shuffle(previousWords));
    }

    const solvedWords = solvedCategories.flatMap(
        (category) => category.words,
    );

    const maximumMistakes = 4;
    const remainingLives = Math.max(maximumMistakes - mistakes, 0);
    const displayedCategories = [
        ...(gameStatus === "lost"
            ? categories
            : solvedCategories),
    ].sort(
        (firstCategory, secondCategory) =>
            firstCategory.difficulty - secondCategory.difficulty,
    );

    const remainingWords =
        gameStatus === "lost"
            ? []
            : boardWords.filter(
                (word) => !solvedWords.includes(word),
            );

    return (
        <main className="min-h-screen bg-stone-800 px-4 py-8 text-white">
            <div className="mx-auto max-w-3xl">
                <header className="mb-8 text-center">
                    <h1 className="text-4xl font-bold">Połączenia</h1>

                    <p className="mt-3 text-lg">
                        Znajdź cztery grupy po cztery powiązane słowa.
                    </p>
                </header>

                <section className="mb-2 space-y-2">
                    {displayedCategories.map((category) => (
                        <div
                            key={category.name}
                            className={`rounded-md p-5 text-center text-black ${getCategoryColor(
                                category.difficulty,
                            )}`}
                        >
                            <h2 className="font-bold">
                                {category.name}
                            </h2>

                            <p className="mt-1">
                                {category.words.join(", ")}
                            </p>
                        </div>
                    ))}
                </section>

                <section className="grid grid-cols-4 gap-2">
                    {remainingWords.map((word) => {
                        const isSelected = selectedWords.includes(word);

                        return (
                            <button
                                key={word}
                                type="button"
                                onClick={() => toggleWord(word)}
                                className={`flex min-h-24 items-center justify-center rounded-md p-2 text-center text-sm font-bold transition sm:text-base ${isSelected
                                    ? "bg-stone-500 text-white"
                                    : "bg-stone-200 text-black hover:bg-stone-300"
                                    }`}
                            >
                                {word}
                            </button>
                        );
                    })}
                </section>


                <div className="mt-5 flex flex-col items-center gap-3">
                    <div className="flex items-center gap-2">
                        <span className="mr-1">Pozostałe próby:</span>

                        {Array.from({ length: remainingLives }).map((_, index) => (
                            <span
                                key={index}
                                className="h-4 w-4 rounded-full bg-white"
                            />
                        ))}
                    </div>
                    <p>Zaznaczono: {selectedWords.length} / 4</p>

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={shuffleWords}
                            disabled={gameStatus !== "playing"}
                            className="rounded-full border border-white px-6 py-3 font-bold transition hover:bg-white hover:text-stone-900 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            Pomieszaj
                        </button>

                        <button
                            type="button"
                            onClick={checkSelection}
                            disabled={
                                selectedWords.length !== 4 ||
                                gameStatus !== "playing"
                            }
                            className="rounded-full bg-white px-6 py-3 font-bold text-stone-900 transition disabled:cursor-not-allowed disabled:bg-stone-600 disabled:text-stone-400"
                        >
                            Sprawdź
                        </button>
                    </div>

                    <p
                        className={`min-h-6 text-center font-medium ${gameStatus === "won"
                            ? "text-green-400"
                            : gameStatus === "lost"
                                ? "text-red-400"
                                : "text-white"
                            }`}
                    >
                        {message}
                    </p>
                </div>
            </div>
        </main>
    );
}