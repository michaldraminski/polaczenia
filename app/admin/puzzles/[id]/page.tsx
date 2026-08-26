import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { getAdminPuzzle } from "../../../../lib/admin-puzzles";
import { createAuthServerClient } from "../../../../lib/supabase/auth-server";
import PuzzleForm from "../new/PuzzleForm";

type PuzzlePageProps = {
    params: Promise<{
        id: string;
    }>;
};

export default async function PuzzlePage({
    params,
}: PuzzlePageProps) {
    const supabase = await createAuthServerClient();

    const {
        data: { user },
        error,
    } = await supabase.auth.getUser();

    if (error || !user) {
        redirect("/admin/login");
    }

    const { id } = await params;
    const puzzleId = Number(id);

    if (!Number.isInteger(puzzleId)) {
        notFound();
    }

    const puzzle = await getAdminPuzzle(puzzleId);

    if (!puzzle) {
        notFound();
    }

    const initialCategories = puzzle.categories.map(
        (category) => ({
            name: category.name,
            words: category.words.map(
                (word) => word.value,
            ),
        }),
    );

    return (
        <main className="relative min-h-screen overflow-hidden bg-[#0b1220] px-4 py-8 text-slate-100 sm:px-6 sm:py-12">
            {/* Dekoracyjne tło */}
            <div className="game-background">
                <span className="game-corner game-corner-top-right" />
                <span className="game-corner game-corner-bottom-left" />
            </div>

            <div className="relative z-10 mx-auto w-full max-w-5xl">
                {/* Nagłówek */}
                <header className="border-b border-slate-700 pb-7">
                    <Link
                        href="/admin"
                        className="inline-flex items-center rounded-full border border-slate-600 px-4 py-2 text-sm font-bold text-slate-300 transition hover:border-slate-300 hover:text-white"
                    >
                        ← Wróć do panelu
                    </Link>

                    <div className="mt-8">
                        <p className="text-sm font-bold uppercase tracking-wider text-slate-500">
                            Panel administratora
                        </p>

                        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                            Edytuj planszę
                        </h1>

                        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
                            Zmień tytuł, datę publikacji, kategorie
                            lub słowa znajdujące się na planszy.
                        </p>
                    </div>
                </header>

                {/* Formularz */}
                <div className="mt-8">
                    <PuzzleForm
                        puzzleId={puzzle.id}
                        initialTitle={puzzle.title}
                        initialPublicationDate={
                            puzzle.publicationDate
                        }
                        initialStatus={puzzle.status}
                        initialCategories={
                            initialCategories
                        }
                    />
                </div>
            </div>
        </main>
    );
}