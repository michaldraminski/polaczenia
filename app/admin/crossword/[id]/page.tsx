import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getAdminCrossword } from "../../../../lib/admin-crosswords";
import { createAuthServerClient } from "../../../../lib/supabase/auth-server";
import CrosswordEditor from "./CrosswordEditor";

export default async function CrosswordEditPage({ params }: { params: Promise<{ id: string }> }) {
    const authClient = await createAuthServerClient();
    const { data: { user }, error } = await authClient.auth.getUser();
    if (error || !user) redirect("/admin/login");
    const crossword = await getAdminCrossword(Number((await params).id));
    if (!crossword) notFound();
    return <main className="min-h-screen bg-[#0b1220] px-4 py-8 text-slate-100 sm:px-6 sm:py-12"><div className="mx-auto w-full max-w-5xl"><Link href="/admin/crossword" className="text-sm font-bold text-slate-400 hover:text-white">← Wróć do krzyżówek</Link><h1 className="mt-7 text-3xl font-bold sm:text-4xl">Edytuj krzyżówkę</h1><p className="mt-2 text-slate-400">Możesz poprawić tytuł, termin publikacji i każdą wskazówkę.</p><CrosswordEditor crossword={crossword} /></div></main>;
}