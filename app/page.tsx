"use client";

import { useState } from "react";

type Category = {
  name: string;
  words: string[];
};

const categories: Category[] = [
  {
    name: "Rzeki w Polsce",
    words: ["WISŁA", "ODRA", "BUG", "WARTA"],
  },
  {
    name: "Planety",
    words: ["MARS", "WENUS", "ZIEMIA", "JOWISZ"],
  },
  {
    name: "Elementy komputera",
    words: ["PORT", "MYSZ", "EKRAN", "KLAWIATURA"],
  },
  {
    name: "Związane z zamkiem",
    words: ["ZAMEK", "KLUCZ", "KORONA", "WIEŻA"],
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

export default function Home() {
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [solvedCategories, setSolvedCategories] = useState<Category[]>([]);
  const [message, setMessage] = useState("");

  function toggleWord(word: string) {
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
      setMessage("Te słowa nie tworzą grupy.");
      return;
    }

    setSolvedCategories((previousCategories) => [
      ...previousCategories,
      matchingCategory,
    ]);

    setSelectedWords([]);
    setMessage("Dobrze!");
  }

  const solvedWords = solvedCategories.flatMap(
    (category) => category.words,
  );

  const remainingWords = initialWords.filter(
    (word) => !solvedWords.includes(word),
  );

  return (
    <main className="min-h-screen bg-stone-500 px-4 py-8 text-white">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold">Połączenia</h1>

          <p className="mt-3 text-lg">
            Znajdź cztery grupy po cztery powiązane słowa.
          </p>
        </header>

        <section className="mb-2 space-y-2">
          {solvedCategories.map((category) => (
            <div
              key={category.name}
              className="rounded-md bg-yellow-300 p-5 text-center"
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
                className={`flex min-h-24 items-center justify-center rounded-md p-2 text-center text-sm font-bold transition sm:text-base ${
                  isSelected
                    ? "bg-stone-700 text-white"
                    : "bg-stone-200 text-black hover:bg-stone-300"
                }`}
              >
                {word}
              </button>
            );
          })}
        </section>

        <div className="mt-5 flex flex-col items-center gap-3">
          <p>Zaznaczono: {selectedWords.length} / 4</p>

          <button
            type="button"
            onClick={checkSelection}
            disabled={selectedWords.length !== 4}
            className="rounded-full bg-black px-6 py-3 font-bold text-white disabled:cursor-not-allowed disabled:bg-stone-300"
          >
            Sprawdź
          </button>

          <p className="min-h-6 font-medium">{message}</p>
        </div>
      </div>
    </main>
  );
}