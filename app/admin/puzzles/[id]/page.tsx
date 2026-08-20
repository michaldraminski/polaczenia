import Link from "next/link";
import {
    notFound,
    redirect,
} from "next/navigation";

import { getAdminPuzzle } from "../../../../lib/admin-puzzles";
import { createAuthServerClient } from "../../../../lib/supabase/auth-server";

type PuzzlePageProps = {
    params: Promise<{
        id: string;
    }>;
};

const categoryColors = [
    "bg-yellow-300",
    "bg-green-400",
    "bg-blue-400",
    "bg-purple-400",
];

function getStatusLabel(
    status: "draft" | "scheduled" | "archived",
): string {
    switch (status) {
        case "draft":
            return "Szkic";
        case "scheduled":
            return "Zaplanowana";
        case "archived":
            return "Archiwalna";
    }
}

function formatPublicationDate(
    publicationDate: string | null,
): string {
    if (!publicationDate) {
        return "Brak daty";
    }

    const [year, month, day] =
        publicationDate.split("-");

    return `${day}.${month}.${year}`;
}

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

    return (
        <main className="min-h-screen bg-stone-800 px-4 py-8 text-white">
            <div className="mx-auto max-w-5xl">
                <header className="border-b border-stone-600 pb-5">
                    < Link
                        href="/admin"
                        className="font-medium text-stone-300 transition hover:text-white"
                    >
                        ← Wróć do listy plansz
                    </Link>

                    <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <h1 className="text-3xl font-bold">
                                {puzzle.title}
                            </h1>

                            <p className="mt-2 text-stone-300">
                                Data publikacji:{" "}
                                {formatPublicationDate(
                                    puzzle.publicationDate,
                                )}
                            </p>
                        </div>

                        <span className="w-fit rounded-full bg-stone-600 px-4 py-2 font-bold">
                            {getStatusLabel(
                                puzzle.status,
                            )}
                        </span>
                    </div>
                </header>

                <section className="mt-8">
                    <div className="flex items-end justify-between">
                        <div>
                            <h2 className="text-2xl font-bold">
                                Kategorie
                            </h2>

                            <p className="mt-1 text-stone-300">
                                Liczba kategorii:{" "}
                                {puzzle.categories.length}
                            </p>
                        </div>
                    </div>

                    <div className="mt-5 space-y-4">
                        {puzzle.categories.map(
                            (category) => (
                                <article
                                    key={category.id}
                                    className={`rounded-xl p-6 text-stone-950 ${
                                        categoryColors[
                                            category.difficulty -
                                                1
                                        ]
                                    }`}
                                >
                                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                        <h3 className="text-xl font-bold">
                                            {category.name}
                                        </h3>

                                        <p className="text-sm font-medium">
                                            Trudność:{" "}
                                            {
                                                category.difficulty
                                            }
                                        </p>
                                    </div>

                                    <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                                        {category.words.map(
                                            (word) => (
                                                <div
                                                    key={
                                                        word.id
                                                    }
                                                    className="rounded-md bg-black/10 p-3 text-center font-bold"
                                                >
                                                    {
                                                        word.value
                                                    }
                                                </div>
                                            ),
                                        )}
                                    </div>
                                </article>
                            ),
                        )}
                    </div>
                </section>
            </div>
        </main>
    );
}