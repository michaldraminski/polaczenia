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
        <main className="min-h-screen bg-stone-800 px-4 py-8 text-white">
            <div className="mx-auto max-w-5xl">
                <header className="border-b border-stone-600 pb-5">
                    <Link
                        href="/admin"
                        className="font-medium text-stone-300 transition hover:text-white"
                    >
                        ← Wróć do listy plansz
                    </Link>

                    <h1 className="mt-4 text-3xl font-bold">
                        Dodaj planszę
                    </h1>

                    <p className="mt-1 text-stone-300">
                        Przygotuj cztery grupy po cztery
                        powiązane słowa.
                    </p>
                </header>

                <PuzzleForm />
            </div>
        </main>
    );
}