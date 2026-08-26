import Link from "next/link";
import { redirect } from "next/navigation";

import { createAuthServerClient } from "../../../../lib/supabase/auth-server";
import PuzzleForm from "./PuzzleForm";

export default async function NewPuzzlePage() {
    const supabase =
        await createAuthServerClient();

    const {
        data: { user },
        error,
    } = await supabase.auth.getUser();

    if (error || !user) {
        redirect("/admin/login");
    }

    return (
        <main className="relative min-h-screen overflow-hidden bg-[#0b1220] px-4 py-8 text-slate-100 sm:px-6 sm:py-12">
            <div className="game-background">
                <span className="game-corner game-corner-top-right" />
                <span className="game-corner game-corner-bottom-left" />
            </div>

            <div className="relative z-10 mx-auto w-full max-w-5xl">
                <header className="border-b border-slate-700 pb-6">
                    <Link
                        href="/admin"
                        className="inline-flex rounded-full border border-slate-600 px-4 py-2 text-sm font-bold text-slate-300 transition hover:border-white hover:text-white"
                    >
                        ← Wróć do panelu
                    </Link>

                    <div className="mt-7">
                        <h1 className="text-3xl font-bold sm:text-4xl">
                            Dodaj planszę
                        </h1>

                        <p className="mt-2 text-slate-400">
                            Przygotuj cztery grupy po cztery powiązane słowa.
                        </p>
                    </div>
                </header>

                <PuzzleForm />
            </div>
        </main>
    );
}