import Link from "next/link";
import { redirect } from "next/navigation";
import { archivePastPuzzles } from "../../../lib/admin-puzzles";
import { getAdminCrosswords } from "../../../lib/admin-crosswords";
import { createAuthServerClient } from "../../../lib/supabase/auth-server";
import { logout } from "../actions";
import CrosswordAdminClient from "./CrosswordAdminClient";

export default async function CrosswordAdminPage() {
    const authClient = await createAuthServerClient();
    const { data: { user }, error } = await authClient.auth.getUser();
    if (error || !user) redirect("/admin/login");
    await archivePastPuzzles();
    const crosswords = await getAdminCrosswords();
    return <main className="relative min-h-screen overflow-hidden bg-[#0b1220] px-4 py-8 text-slate-100 sm:px-6 sm:py-12"><div className="relative z-10 mx-auto w-full max-w-5xl"><header className="border-b border-slate-700 pb-6"><div className="flex flex-wrap items-center justify-between gap-4"><div><Link href="/admin" className="text-sm font-bold text-slate-400 hover:text-white">← Panel gier</Link><h1 className="mt-4 text-3xl font-bold sm:text-4xl">Krzyżówki</h1><p className="mt-2 text-sm text-slate-400">Generuj, planuj i poprawiaj wskazówki.</p></div><form action={logout}><button className="rounded-full bg-white px-5 py-2.5 text-sm font-bold text-slate-900">Wyloguj się</button></form></div></header><CrosswordAdminClient crosswords={crosswords} /></div></main>;
}