"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { AdminCrossword } from "../../../lib/admin-crosswords";
import DeleteCrosswordButton from "./DeleteCrosswordButton";

export default function CrosswordAdminClient({ crosswords }: { crosswords: AdminCrossword[] }) {
    const router = useRouter();
    const [tab, setTab] = useState<"scheduled" | "draft" | "archived">("scheduled");
    const [isGenerating, setIsGenerating] = useState(false);
    const [message, setMessage] = useState("");
    const filtered = crosswords.filter((crossword) => crossword.status === tab);

    async function generate() {
        setIsGenerating(true); setMessage("");
        try {
            const response = await fetch("/api/admin/crosswords", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
            const result = await response.json() as { error?: string };
            if (!response.ok) throw new Error(result.error || "Nie udało się wygenerować krzyżówki.");
            router.refresh();
            setTab("scheduled");
        } catch (error) { setMessage(error instanceof Error ? error.message : "Nie udało się wygenerować krzyżówki."); }
        finally { setIsGenerating(false); }
    }

    return <>
        <div className="mt-8 flex flex-col gap-4 border-b border-slate-700 pb-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-2" role="tablist">
                {(["scheduled", "draft", "archived"] as const).map((value) => <button key={value} type="button" onClick={() => setTab(value)} className={`rounded-full px-4 py-2 text-sm font-bold ${tab === value ? "bg-white text-slate-900" : "border border-slate-600 text-slate-300"}`}>{value === "scheduled" ? "Zaplanowane" : value === "draft" ? "Szkice" : "Archiwum"}</button>)}
            </div>
            <button type="button" onClick={generate} disabled={isGenerating} className="rounded-full bg-[#d4af55] px-5 py-3 font-bold text-slate-950 disabled:cursor-wait disabled:opacity-60">{isGenerating ? "Generowanie..." : "Generuj krzyżówkę"}</button>
        </div>
        {message && <p className="mt-5 rounded-xl border border-red-400/40 bg-red-950/40 p-4 text-sm text-red-200">{message}</p>}
        {filtered.length === 0 ? <div className="mt-8 rounded-2xl border border-slate-700 bg-slate-800/70 p-10 text-center text-slate-400">Brak krzyżówek w tej sekcji.</div> : <div className="mt-8 space-y-4">{filtered.map((crossword) => <article key={crossword.id} className="rounded-2xl border border-slate-700 bg-slate-800/80 p-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-xl font-bold">{crossword.title}</h2><p className="mt-1 text-sm text-slate-400">Data publikacji: {crossword.publicationDate || "Brak daty"} · {crossword.entries.length} haseł</p></div><div className="flex flex-wrap gap-2"><Link href={`/admin/crossword/${crossword.id}`} className="rounded-full border border-slate-500 px-5 py-2.5 text-center text-sm font-bold hover:bg-white hover:text-slate-900">Edytuj</Link><DeleteCrosswordButton puzzleId={crossword.id} /></div></div></article>)}</div>}
    </>;
}