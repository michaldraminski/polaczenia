"use client";

import { useState } from "react";

const words = [
  "ZAMEK",
  "KLUCZ",
  "KORONA",
  "WIEŻA",
  "PORT",
  "MYSZ",
  "EKRAN",
  "KLAWIATURA",
  "WISŁA",
  "ODRA",
  "BUG",
  "WARTA",
  "MARS",
  "WENUS",
  "ZIEMIA",
  "JOWISZ",
];

export default function Home() {
  const [selectedWords, setSelectedWords] = useState<string[]>([]);

  function toggleWord(word: string) {
    const isSelected = selectedWords.includes(word);

    if (isSelected) {
      setSelectedWords(
        selectedWords.filter((selectedWord) => selectedWord !== word),
      );
      return;
    }

    if (selectedWords.length < 4) {
      setSelectedWords([...selectedWords, word]);
    }
  }

  return (
    <main className="min-h-screen bg-white px-4 py-8 text-black">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold">Połączenia</h1>

          <p className="mt-3 text-lg">
            Znajdź cztery grupy po cztery powiązane słowa.
          </p>
        </header>

        <section className="grid grid-cols-4 gap-2">
          {words.map((word) => {
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

        <p className="mt-5 text-center">
          Zaznaczono: {selectedWords.length} / 4
        </p>
      </div>
    </main>
  );
}
