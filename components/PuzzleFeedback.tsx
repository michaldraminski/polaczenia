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
};

export function PuzzleFeedback({ puzzle }: PuzzleFeedbackProps) {
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
        return <p className="mt-5 text-center text-stone-300">Dziękuję za ocenę.</p>;
    }

    return (
        <section className="mt-6 rounded-xl bg-stone-700 p-5 text-center">
            <h2 className="text-lg font-bold">Jak oceniasz tę planszę?</h2>
            <RatingRow label="Trudność" value={difficultyRating} onChange={setDifficultyRating} />
            <RatingRow label="Jakość" value={qualityRating} onChange={setQualityRating} />
            <button
                type="button"
                onClick={submitFeedback}
                disabled={isSubmitting}
                className="mt-3 rounded-full bg-white px-5 py-2 font-bold text-stone-900 transition hover:bg-stone-200 disabled:cursor-wait disabled:opacity-60"
            >
                {isSubmitting ? "Wysyłanie..." : "Wyślij ocenę"}
            </button>
            {message && <p className="mt-2 text-sm text-red-200">{message}</p>}
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
        <div className="mt-4 flex items-center justify-center gap-3">
            <span className="w-20 text-right text-sm text-stone-300">{label}</span>
            <div className="flex gap-1" role="radiogroup" aria-label={label}>
                {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                        key={rating}
                        type="button"
                        aria-label={`${label}: ${rating} na 5`}
                        aria-pressed={value === rating}
                        onClick={() => onChange(rating)}
                        className={`h-8 w-8 rounded-full border text-sm font-bold ${value >= rating ? "border-amber-200 bg-amber-200 text-stone-900" : "border-stone-400 text-stone-300"}`}
                    >
                        {rating}
                    </button>
                ))}
            </div>
        </div>
    );
}