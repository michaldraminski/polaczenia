import {
    notFound,
    redirect,
} from "next/navigation";

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
    const supabase =
        await createAuthServerClient();

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

    const puzzle =
        await getAdminPuzzle(puzzleId);

    if (!puzzle) {
        notFound();
    }

    const initialCategories =
        puzzle.categories.map((category) => ({
            name: category.name,
            words: category.words.map(
                (word) => word.value,
            ),
        }));

    return (
        <main className="min-h-screen bg-stone-800 px-4 py-8 text-white">
            <div className="mx-auto max-w-5xl">
                <header className="border-b border-stone-600 pb-5">
                    < a
                        href="/admin"
                        className="font-medium text-stone-300 transition hover:text-white"
                    >
                        ← Wróć do listy plansz
                    </a>

                    <h1 className="mt-4 text-3xl font-bold">
                        Edytuj planszę
                    </h1>

                    <p className="mt-1 text-stone-300">
                        Zmień dane, kategorie lub słowa
                        planszy.
                    </p>
                </header>

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
        </main>
    );
}