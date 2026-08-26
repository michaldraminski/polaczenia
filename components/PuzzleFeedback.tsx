"use client";

import { useEffect, useState } from "react";

import {
    getClientGameId,
    hasSubmittedFeedback,
    markFeedbackSubmitted,
} from "../lib/gameStorage";
import type { PublicPuzzle } from "../types/game";

type PuzzleFeedbackProps = {
    puzzle: PublicPuzzle;
    onSubmitted?: () => void;
};

export function PuzzleFeedback({
    puzzle,
    onSubmitted,
}: PuzzleFeedbackProps) {
    const [difficultyRating, setDifficultyRating] = useState(0);
    const [qualityRating, setQualityRating] = useState(0);
    const [submitted, setSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState("");

    useEffect(() => {
        setSubmitted(hasSubmittedFeedback(puzzle));
    }, [puzzle]);

    async function submitFeedback() {
        if (
            isSubmitting ||
            submitted ||
            !difficultyRating ||
            !qualityRating
        ) {
            if (!difficultyRating || !qualityRating) {
                setMessage("Wybierz obie oceny.");
            }
            return;
        }

        setIsSubmitting(true);
        setMessage("");

        try {
            const response = await fetch("/api/puzzles/feedback", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    puzzleId: puzzle.id,
                    clientGameId: getClientGameId(puzzle),
                    difficultyRating,
                    qualityRating,
                }),
            });

            if (!response.ok) {
                throw new Error("Nie udało się zapisać oceny.");
            }

            markFeedbackSubmitted(puzzle);
            setSubmitted(true);
            onSubmitted?.();
        } catch (error) {
            setMessage(
                error instanceof Error
                    ? error.message
                    : "Nie udało się zapisać oceny.",
            );
        } finally {
            setIsSubmitting(false);
        }
    }

    if (submitted) {
        return (
            <section className="mt-6 rounded-2xl bg-white p-5 text-center shadow-sm ring-1 ring-stone-200">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-lg font-bold text-green-700">
                    ✓
                </div>

                <p className="mt-3 font-semibold text-stone-700">
                    Dziękuję za ocenę!
                </p>
            </section>
        );
    }

    return (
        <section className="mt-6 rounded-2xl bg-white p-5 text-center shadow-sm ring-1 ring-stone-200">
            <h2 className="text-lg font-bold text-stone-900">
                Jak oceniasz tę planszę?
            </h2>

            <p className="mt-1 text-sm text-stone-500">
                Oceń trudność oraz jakość dzisiejszej planszy.
            </p>

            <div className="mt-5 space-y-3">
                <RatingRow
                    label="Trudność"
                    value={difficultyRating}
                    onChange={setDifficultyRating}
                />

                <RatingRow
                    label="Jakość"
                    value={qualityRating}
                    onChange={setQualityRating}
                />
            </div>

            <button
                type="button"
                onClick={submitFeedback}
                disabled={isSubmitting}
                className="mt-5 w-full rounded-xl bg-stone-900 px-5 py-3 font-bold text-white transition hover:bg-stone-700 disabled:cursor-wait disabled:opacity-60"
            >
                {isSubmitting ? "Wysyłanie..." : "Wyślij ocenę"}
            </button>

            {message && (
                <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                    {message}
                </p>
            )}
        </section>
    );
}

function RatingRow({
    label,
    value,
    onChange,
}: {
    label: string;
    value: number;
    onChange: (value: number) => void;
}) {
    return (
        <div className="flex items-center justify-center gap-3">
            <span className="w-20 text-right text-sm font-medium text-stone-600">
                {label}
            </span>

            <div
                className="flex gap-1.5"
                role="radiogroup"
                aria-label={label}
            >
                {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                        key={rating}
                        type="button"
                        aria-label={`${label}: ${rating} na 5`}
                        aria-pressed={value === rating}
                        onClick={() => onChange(rating)}
                        className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm font-bold transition ${
                            value >= rating
                                ? "border-amber-400 bg-amber-400 text-stone-900"
                                : "border-stone-300 bg-white text-stone-500 hover:border-amber-300 hover:bg-amber-50 hover:text-stone-700"
                        }`}
                    >
                        {rating}
                    </button>
                ))}
            </div>
        </div>
    );
}