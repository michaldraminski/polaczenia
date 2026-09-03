"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { AdminCrossword } from "../../../../lib/admin-crosswords";

export default function CrosswordEditor({ crossword }: { crossword: AdminCrossword }) {
    const router = useRouter();
    const [title, setTitle] = useState(crossword.title);
    const [date, setDate] = useState(crossword.publicationDate || "");
    const [status, setStatus] = useState(crossword.status);
    const [entries, setEntries] = useState(crossword.entries);
    const [message, setMessage] = useState("");
    const [saving, setSaving] = useState(false);

    async function save(event: React.FormEvent) {
        event.preventDefault(); setSaving(true); setMessage("");
        try {
            const response = await fetch(`/api/admin/crosswords/${crossword.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, publicationDate: date || null, status, entries }) });
            const result = await response.json() as { error?: string };
            if (!response.ok) throw new Error(result.error || "Nie udało się zapisać planszy.");
            router.push("/admin/crossword"); router.refresh();
        } catch (error) { setMessage(error instanceof Error ? error.message : "Nie udało się zapisać planszy."); }
        finally { setSaving(false); }
    }

    return <form onSubmit={save} className="mt-8 space-y-8"><section className="rounded-2xl bg-slate-800/80 p-6"><div className="grid gap-5 md:grid-cols-3"><label className="md:col-span-3"><span className="mb-2 block text-sm font-bold">Tytuł</span><input value={title} onChange={(event) => setTitle(event.target.value)} className="w-full rounded-xl border border-slate-600 bg-slate-950 px-4 py-3 text-white" /></label><label><span className="mb-2 block text-sm font-bold">Status</span><select value={status} onChange={(event) => setStatus(event.target.value as typeof status)} className="w-full rounded-xl border border-slate-600 bg-slate-950 px-4 py-3 text-white"><option value="draft">Szkic</option><option value="scheduled">Zaplanowana</option><option value="archived">Archiwalna</option></select></label><label><span className="mb-2 block text-sm font-bold">Data publikacji</span><input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="w-full rounded-xl border border-slate-600 bg-slate-950 px-4 py-3 text-white" /></label></div></section><section><h2 className="text-2xl font-bold">Wskazówki</h2><div className="mt-5 space-y-3">{entries.map((entry, index) => <label key={entry.id} className="block rounded-xl border border-slate-700 bg-slate-800/70 p-4"><span className="mb-2 block text-sm font-bold text-[#d4af55]">{entry.number}. {entry.direction === "horizontal" ? "Poziomo" : "Pionowo"} · {entry.answer}</span><input value={entry.clue} onChange={(event) => setEntries((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, clue: event.target.value } : item))} className="w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-white" /></label>)}</div></section>{message && <p className="rounded-xl border border-red-400/40 bg-red-950/40 p-4 text-red-200">{message}</p>}<button disabled={saving} className="rounded-full bg-white px-6 py-3 font-bold text-slate-900 disabled:opacity-60">{saving ? "Zapisywanie..." : "Zapisz zmiany"}</button></form>;
}