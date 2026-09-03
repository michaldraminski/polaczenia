"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type PuzzleStatus =
    | "draft"
    | "scheduled"
    | "archived";

type CategoryForm = {
    name: string;
    words: string[];
};

type PuzzleFormProps = {
    puzzleId?: number;
    initialTitle?: string;
    initialPublicationDate?: string | null;
    initialStatus?: PuzzleStatus;
    initialCategories?: CategoryForm[];
};

type ErrorResponse = {
    error?: string;
};

const categoryColors = [
    "border-emerald-400",
    "border-yellow-400",
    "border-orange-400",
    "border-red-400",
] as const;

const difficultyLabels = [
    "Zielona — najłatwiejsza",
    "Żółta",
    "Pomarańczowa",
    "Czerwona — najtrudniejsza",
];

function createEmptyCategories(): CategoryForm[] {
    return Array.from({ length: 4 }, () => ({
        name: "",
        words: ["", "", "", ""],
    }));
}

export default function PuzzleForm({
    puzzleId,
    initialTitle = "",
    initialPublicationDate = "",
    initialStatus = "draft",
    initialCategories,
}: PuzzleFormProps) {
    const router = useRouter();

    const [title, setTitle] = useState(initialTitle);

    const [publicationDate, setPublicationDate] =
        useState(initialPublicationDate ?? "");

    const [status, setStatus] =
        useState<PuzzleStatus>(initialStatus);

    const [categories, setCategories] = useState(
        () =>
            initialCategories ??
            createEmptyCategories(),
    );

    const [message, setMessage] = useState("");
    const [isSaving, setIsSaving] = useState(false);

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
                (
                    category,
                    currentCategoryIndex,
                ) => {
                    if (
                        currentCategoryIndex !==
                        categoryIndex
                    ) {
                        return category;
                    }

                    const newWords =
                        category.words.map(
                            (
                                word,
                                currentWordIndex,
                            ) =>
                                currentWordIndex ===
                                wordIndex
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

        const hasEmptyCategory =
            categories.some(
                (category) =>
                    !category.name.trim(),
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

    async function handleSubmit(
        event: React.FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        if (isSaving) {
            return;
        }

        const validationError = validateForm();

        if (validationError) {
            setMessage(validationError);
            return;
        }

        setIsSaving(true);
        setMessage("");

        try {
            const endpoint = puzzleId
                ? `/api/admin/puzzles/${puzzleId}`
                : "/api/admin/puzzles";

            const response = await fetch(endpoint, {
                method: puzzleId ? "PATCH" : "POST",
                headers: {
                    "Content-Type":
                        "application/json",
                },
                body: JSON.stringify({
                    title,
                    publicationDate:
                        publicationDate || null,
                    status,
                    categories,
                }),
            });

            const responseBody: unknown =
                await response.json();

            if (!response.ok) {
                const errorResponse =
                    responseBody as ErrorResponse;

                throw new Error(
                    errorResponse.error ??
                        "Nie udało się zapisać planszy.",
                );
            }

            router.push("/admin/connections");
            router.refresh();
        } catch (error) {
            setMessage(
                error instanceof Error
                    ? error.message
                    : "Wystąpił nieoczekiwany błąd.",
            );
        } finally {
            setIsSaving(false);
        }
    }

    const completedWordCount = categories
        .flatMap((category) => category.words)
        .filter((word) => word.trim()).length;

    return (
        <form
            onSubmit={handleSubmit}
            className="mt-8 space-y-8"
        >
            {/* INFORMACJE O PLANSZY */}

            <section className="rounded-2xl bg-slate-800/80 p-6 shadow-xl">
                <div>
                    <h2 className="text-xl font-bold">
                        Informacje o planszy
                    </h2>

                    <p className="mt-1 text-sm text-slate-400">
                        Podstawowe informacje dotyczące
                        publikowanej planszy.
                    </p>
                </div>

                <div className="mt-6 grid gap-5 md:grid-cols-2">
                    {/* TYTUŁ */}

                    <div className="md:col-span-2">
                        <label
                            htmlFor="title"
                            className="mb-2 block text-sm font-bold text-slate-200"
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
                            className="w-full rounded-xl border border-slate-600 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-slate-600 focus:outline-none focus:ring-0"
                            placeholder="Na przykład: Zestaw na poniedziałek"
                        />
                    </div>

                    {/* STATUS */}

                    <div>
                        <label
                            htmlFor="status"
                            className="mb-2 block text-sm font-bold text-slate-200"
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
                            className="w-full rounded-xl border border-slate-600 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-slate-600 focus:outline-none focus:ring-0"
                        >
                            <option value="draft">
                                Szkic
                            </option>

                            <option value="scheduled">
                                Zaplanowana
                            </option>

                            {puzzleId && (
                                <option value="archived">
                                    Archiwalna
                                </option>
                            )}
                        </select>
                    </div>

                    {/* DATA */}

                    <div>
                        <label
                            htmlFor="publicationDate"
                            className="mb-2 block text-sm font-bold text-slate-200"
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
                            className="w-full rounded-xl border border-slate-600 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-slate-600 focus:outline-none focus:ring-0"
                        />
                    </div>
                </div>
            </section>

            {/* KATEGORIE */}

            <section>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-sm font-bold uppercase tracking-wider text-slate-500">
                            Zawartość planszy
                        </p>

                        <h2 className="mt-1 text-2xl font-bold">
                            Kategorie
                        </h2>

                        <p className="mt-1 text-sm text-slate-400">
                            Wypełnij cztery kategorie po
                            cztery słowa.
                        </p>
                    </div>

                    <div className="rounded-full border border-slate-700 bg-slate-800/80 px-4 py-2 text-sm font-bold text-slate-300">
                        Uzupełnione:{" "}
                        <span className="text-white">
                            {completedWordCount}
                        </span>
                        {" / 16"}
                    </div>
                </div>

                <div className="mt-5 space-y-5">
                    {categories.map(
                        (
                            category,
                            categoryIndex,
                        ) => (
                            <article
                                key={categoryIndex}
                                className={`rounded-2xl border-2 bg-slate-800/80 p-6 shadow-lg ${categoryColors[categoryIndex]}`}
                            >
                                {/* NAGŁÓWEK KATEGORII */}

                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <h3 className="text-xl font-bold">
                                            Kategoria{" "}
                                            {categoryIndex +
                                                1}
                                        </h3>

                                        <p className="mt-1 text-sm text-slate-400">
                                            {
                                                difficultyLabels[
                                                    categoryIndex
                                                ]
                                            }
                                        </p>
                                    </div>
                                </div>

                                {/* NAZWA KATEGORII */}

                                <div className="mt-6">
                                    <label
                                        htmlFor={`category-${categoryIndex}`}
                                        className="mb-2 block text-sm font-bold text-slate-200"
                                    >
                                        Nazwa kategorii
                                    </label>

                                    <input
                                        id={`category-${categoryIndex}`}
                                        value={
                                            category.name
                                        }
                                        onChange={(
                                            event,
                                        ) =>
                                            updateCategoryName(
                                                categoryIndex,
                                                event
                                                    .target
                                                    .value,
                                            )
                                        }
                                        className="w-full rounded-xl border border-slate-600 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-slate-600 focus:outline-none focus:ring-0"
                                        placeholder="Na przykład: Rzeki w Polsce"
                                    />
                                </div>

                                {/* SŁOWA */}

                                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                                                    className="mb-2 block text-sm font-medium text-slate-400"
                                                >
                                                    Słowo{" "}
                                                    {wordIndex +
                                                        1}
                                                </label>

                                                <input
                                                    id={`category-${categoryIndex}-word-${wordIndex}`}
                                                    value={
                                                        word
                                                    }
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
                                                    className="w-full rounded-xl border border-slate-600 bg-slate-950 px-3 py-3 text-center font-bold text-white outline-none transition placeholder:text-slate-700 focus:border-slate-600 focus:outline-none focus:ring-0"
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

            {/* BŁĄD */}

            {message && (
                <div className="rounded-xl border border-red-500/30 bg-red-950/40 p-4 text-center font-medium text-red-300">
                    {message}
                </div>
            )}

            {/* PRZYCISKI */}

            <div className="flex flex-col-reverse gap-3 border-t border-slate-700 pt-6 sm:flex-row sm:justify-end">
                <a
                    href="/admin/connections"
                    className="rounded-full border border-slate-600 px-6 py-3 text-center font-bold text-slate-300 transition hover:border-slate-300 hover:text-white"
                >
                    Anuluj
                </a>

                <button
                    type="submit"
                    disabled={isSaving}
                    className="rounded-full bg-white px-6 py-3 font-bold text-slate-900 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-400"
                >
                    {isSaving
                        ? "Zapisuję..."
                        : puzzleId
                        ? "Zapisz zmiany"
                        : "Zapisz planszę"}
                </button>
            </div>
        </form>
    );
}