"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type DeletePuzzleButtonProps = {
    puzzleId: number;
};

export default function DeletePuzzleButton({
    puzzleId,
}: DeletePuzzleButtonProps) {
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState(false);
    const [message, setMessage] = useState("");

    async function handleDelete() {
        if (
            isDeleting ||
            !window.confirm(
                "Czy na pewno chcesz usunąć tę planszę? Tej operacji nie można cofnąć.",
            )
        ) {
            return;
        }

        setIsDeleting(true);
        setMessage("");

        try {
            const response = await fetch(
                `/api/admin/puzzles/${puzzleId}`,
                { method: "DELETE" },
            );
            const responseBody: unknown =
                await response.json();

            if (!response.ok) {
                const errorResponse = responseBody as {
                    error?: string;
                };

                throw new Error(
                    errorResponse.error ??
                        "Nie udało się usunąć planszy.",
                );
            }

            router.refresh();
        } catch (error) {
            setMessage(
                error instanceof Error
                    ? error.message
                    : "Wystąpił nieoczekiwany błąd.",
            );
        } finally {
            setIsDeleting(false);
        }
    }

    return (
        <div>
            <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="rounded-full border border-red-300 px-5 py-2 font-bold text-red-200 transition hover:bg-red-300 hover:text-stone-900 disabled:cursor-wait disabled:opacity-60"
            >
                {isDeleting ? "Usuwanie..." : "Usuń"}
            </button>

            {message && (
                <p className="mt-2 text-sm text-red-200">
                    {message}
                </p>
            )}
        </div>
    );
}