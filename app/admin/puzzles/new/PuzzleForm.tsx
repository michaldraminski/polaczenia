"use client";

import { useState } from "react";

type PuzzleStatus = "draft" | "scheduled";

type CategoryForm = {
    name: string;
    words: string[];
};

const categoryColors = [
    "border-yellow-400",
    "border-green-500",
    "border-blue-500",
    "border-purple-500",
];

const difficultyLabels = [
    "Żółta — najłatwiejsza",
    "Zielona",
    "Niebieska",
    "Fioletowa — najtrudniejsza",
];

function createEmptyCategories(): CategoryForm[] {
    return Array.from({ length: 4 }, () => ({
        name: "",
        words: ["", "", "", ""],
    }));
}

export default function PuzzleForm() {
    const [title, setTitle] = useState("");
    const [publicationDate, setPublicationDate] =
        useState("");
    const [status, setStatus] =
        useState<PuzzleStatus>("draft");
    const [categories, setCategories] = useState(
        createEmptyCategories,
    );
    const [message, setMessage] = useState("");

    function updateCategoryName(
        categoryIndex: number,
        name: string,
    ) {
        setCategories((previousCategories) =>
            previousCategories.map(
                (category, index) =>
                    index === categoryIndex
                        ? {
                              ...category,
                              name,
                          }
                        : category,
            ),
        );

        setMessage("");
    }

    function updateWord(
        categoryIndex: number,
        wordIndex: number,
        value: string,
    ) {
        setCategories((previousCategories) =>
            previousCategories.map(
                (category, currentCategoryIndex) => {
                    if (
                        currentCategoryIndex !==
                        categoryIndex
                    ) {
                        return category;
                    }

                    const newWords = category.words.map(
                        (word, currentWordIndex) =>
                            currentWordIndex === wordIndex
                                ? value
                                : word,
                    );

                    return {
                        ...category,
                        words: newWords,
                    };
                },
            ),
        );

        setMessage("");
    }

    function validateForm(): string | null {
        if (!title.trim()) {
            return "Podaj tytuł planszy.";
        }

        if (
            status === "scheduled" &&
            !publicationDate
        ) {
            return "Zaplanowana plansza musi mieć datę publikacji.";
        }

        const hasEmptyCategory = categories.some(
            (category) => !category.name.trim(),
        );

        if (hasEmptyCategory) {
            return "Każda kategoria musi mieć nazwę.";
        }

        const allWords = categories.flatMap(
            (category) =>
                category.words.map((word) =>
                    word.trim(),
                ),
        );

        if (allWords.some((word) => !word)) {
            return "Każda kategoria musi mieć cztery słowa.";
        }

        const normalizedWords = allWords.map(
            (word) =>
                word.toLocaleLowerCase("pl-PL"),
        );

        if (
            new Set(normalizedWords).size !==
            normalizedWords.length
        ) {
            return "Słowa na planszy nie mogą się powtarzać.";
        }

        return null;
    }

    function handleSubmit(
        event: React.FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        const validationError = validateForm();

        if (validationError) {
            setMessage(validationError);
            return;
        }

        setMessage(
            "Formularz jest poprawny. Zapis do bazy dodamy w następnym kroku.",
        );
    }

    const completedWordCount = categories
        .flatMap((category) => category.words)
        .filter((word) => word.trim()).length;

    return (
        <form
            onSubmit={handleSubmit}
            className="mt-8 space-y-8"
        >
            <section className="rounded-xl bg-stone-700 p-6">
                <h2 className="text-xl font-bold">
                    Informacje o planszy
                </h2>

                <div className="mt-5 grid gap-5 md:grid-cols-2">
                    <div className="md:col-span-2">
                        <label
                            htmlFor="title"
                            className="mb-2 block font-medium"
                        >
                            Tytuł roboczy
                        </label>

                        <input
                            id="title"
                            value={title}
                            onChange={(event) => {
                                setTitle(
                                    event.target.value,
                                );
                                setMessage("");
                            }}
                            className="w-full rounded-md border border-stone-500 bg-stone-800 px-4 py-3 outline-none focus:border-white"
                            placeholder="Na przykład: Zestaw na poniedziałek"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="status"
                            className="mb-2 block font-medium"
                        >
                            Status
                        </label>

                        <select
                            id="status"
                            value={status}
                            onChange={(event) => {
                                setStatus(
                                    event.target
                                        .value as PuzzleStatus,
                                );
                                setMessage("");
                            }}
                            className="w-full rounded-md border border-stone-500 bg-stone-800 px-4 py-3 outline-none focus:border-white"
                        >
                            <option value="draft">
                                Szkic
                            </option>
                            <option value="scheduled">
                                Zaplanowana
                            </option>
                        </select>
                    </div>

                    <div>
                        <label
                            htmlFor="publicationDate"
                            className="mb-2 block font-medium"
                        >
                            Data publikacji
                        </label>

                        <input
                            id="publicationDate"
                            type="date"
                            value={publicationDate}
                            onChange={(event) => {
                                setPublicationDate(
                                    event.target.value,
                                );
                                setMessage("");
                            }}
                            className="w-full rounded-md border border-stone-500 bg-stone-800 px-4 py-3 outline-none focus:border-white"
                        />
                    </div>
                </div>
            </section>

            <section>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h2 className="text-2xl font-bold">
                            Kategorie
                        </h2>

                        <p className="mt-1 text-stone-300">
                            Wypełnij cztery kategorie po
                            cztery słowa.
                        </p>
                    </div>

                    <p className="font-medium">
                        Uzupełnione słowa:{" "}
                        {completedWordCount} / 16
                    </p>
                </div>

                <div className="mt-5 space-y-5">
                    {categories.map(
                        (category, categoryIndex) => (
                            <article
                                key={categoryIndex}
                                className={`rounded-xl border-l-8 bg-stone-700 p-6 ${categoryColors[categoryIndex]}`}
                            >
                                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                    <h3 className="text-xl font-bold">
                                        Kategoria{" "}
                                        {categoryIndex + 1}
                                    </h3>

                                    <p className="text-sm text-stone-300">
                                        {
                                            difficultyLabels[
                                                categoryIndex
                                            ]
                                        }
                                    </p>
                                </div>

                                <div className="mt-5">
                                    <label
                                        htmlFor={`category-${categoryIndex}`}
                                        className="mb-2 block font-medium"
                                    >
                                        Nazwa kategorii
                                    </label>

                                    <input
                                        id={`category-${categoryIndex}`}
                                        value={category.name}
                                        onChange={(event) =>
                                            updateCategoryName(
                                                categoryIndex,
                                                event.target
                                                    .value,
                                            )
                                        }
                                        className="w-full rounded-md border border-stone-500 bg-stone-800 px-4 py-3 outline-none focus:border-white"
                                        placeholder="Na przykład: Rzeki w Polsce"
                                    />
                                </div>

                                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                    {category.words.map(
                                        (
                                            word,
                                            wordIndex,
                                        ) => (
                                            <div
                                                key={
                                                    wordIndex
                                                }
                                            >
                                                <label
                                                    htmlFor={`category-${categoryIndex}-word-${wordIndex}`}
                                                    className="mb-2 block text-sm font-medium"
                                                >
                                                    Słowo{" "}
                                                    {wordIndex +
                                                        1}
                                                </label>

                                                <input
                                                    id={`category-${categoryIndex}-word-${wordIndex}`}
                                                    value={word}
                                                    onChange={(
                                                        event,
                                                    ) =>
                                                        updateWord(
                                                            categoryIndex,
                                                            wordIndex,
                                                            event
                                                                .target
                                                                .value,
                                                        )
                                                    }
                                                    className="w-full rounded-md border border-stone-500 bg-stone-800 px-3 py-3 text-center font-bold uppercase outline-none focus:border-white"
                                                />
                                            </div>
                                        ),
                                    )}
                                </div>
                            </article>
                        ),
                    )}
                </div>
            </section>

            {message && (
                <p
                    className={`rounded-md p-4 text-center font-medium ${
                        message.startsWith(
                            "Formularz jest poprawny",
                        )
                            ? "bg-green-950 text-green-200"
                            : "bg-red-950 text-red-200"
                    }`}
                >
                    {message}
                </p>
            )}

            <div className="flex flex-col-reverse gap-3 border-t border-stone-600 pt-6 sm:flex-row sm:justify-end">
                <a
                    href="/admin"
                    className="rounded-full border border-stone-500 px-6 py-3 text-center font-bold transition hover:border-white"
                >
                    Anuluj
                </a>

                <button
                    type="submit"
                    className="rounded-full bg-white px-6 py-3 font-bold text-stone-900 transition hover:bg-stone-200"
                >
                    Sprawdź formularz
                </button>
            </div>
        </form>
    );
}