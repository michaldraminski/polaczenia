"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeleteCrosswordButton({ puzzleId }: { puzzleId: number }) {
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState(false);
    const [message, setMessage] = useState("");

    async function handleDelete() {
        if (isDeleting || !window.confirm("Czy na pewno chcesz usunąć tę krzyżówkę? Tej operacji nie można cofnąć.")) return;
        setIsDeleting(true);
        setMessage("");
        try {
            const response = await fetch(`/api/admin/crosswords/${puzzleId}`, { method: "DELETE" });
            const result = await response.json() as { error?: string };
            if (!response.ok) throw new Error(result.error || "Nie udało się usunąć krzyżówki.");
            router.refresh();
        } catch (error) {
            setMessage(error instanceof Error ? error.message : "Nie udało się usunąć krzyżówki.");
        } finally {
            setIsDeleting(false);
        }
    }

    return <div><button type="button" onClick={handleDelete} disabled={isDeleting} className="rounded-full border border-red-300 px-5 py-2.5 font-bold text-red-200 transition hover:bg-red-300 hover:text-slate-900 disabled:cursor-wait disabled:opacity-60">{isDeleting ? "Usuwanie..." : "Usuń"}</button>{message && <p className="mt-2 text-sm text-red-200">{message}</p>}</div>;
}