import Link from "next/link";
import { redirect } from "next/navigation";

import {
    archivePastPuzzles,
    getAdminPuzzles,
} from "../../lib/admin-puzzles";
import { createAuthServerClient } from "../../lib/supabase/auth-server";
import DeletePuzzleButton from "../../components/DeletePuzzleButton";
import { logout } from "./actions";

type PuzzleStatus =
    | "draft"
    | "scheduled"
    | "archived";

function getStatusLabel(
    status: PuzzleStatus,
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

function getStatusColor(
    status: PuzzleStatus,
): string {
    switch (status) {
        case "draft":
            return "bg-stone-500 text-white";
        case "scheduled":
            return "bg-green-700 text-green-100";
        case "archived":
            return "bg-amber-800 text-amber-100";
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

export default async function AdminPage() {
    const supabase = await createAuthServerClient();

    const {
        data: { user },
        error,
    } = await supabase.auth.getUser();

    if (error || !user) {
        redirect("/admin/login");
    }

    await archivePastPuzzles();
    const puzzles = await getAdminPuzzles();
    const activePuzzles = puzzles.filter(
        (puzzle) => puzzle.status !== "archived",
    );
    const archivedPuzzles = puzzles.filter(
        (puzzle) => puzzle.status === "archived",
    );

    return (
        <main className="min-h-screen bg-stone-800 px-4 py-8 text-white">
            <div className="mx-auto max-w-5xl">
                <header className="flex flex-col gap-5 border-b border-stone-600 pb-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">
                            Panel administratora
                        </h1>

                        <p className="mt-1 text-stone-300">
                            Zalogowano jako {user.email}
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <Link
                            href="/"
                            className="rounded-full border border-stone-500 px-5 py-2 font-bold transition hover:border-white"
                        >
                            Przejdź do gry
                        </Link>

                        <form action={logout}>
                            <button
                                type="submit"
                                className="rounded-full border border-white px-5 py-2 font-bold transition hover:bg-white hover:text-stone-900"
                            >
                                Wyloguj się
                            </button>
                        </form>
                    </div>
                </header>

                <section className="mt-8">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-2xl font-bold">
                                Plansze
                            </h2>

                            <p className="mt-1 text-stone-300">
                                Liczba plansz:{" "}
                                {activePuzzles.length}
                            </p>
                        </div>

                        <Link
                            href="/admin/puzzles/new"
                            className="rounded-full bg-white px-6 py-3 font-bold text-stone-900 transition hover:bg-stone-200"
                        >
                            Dodaj planszę
                        </Link>
                    </div>

                    {activePuzzles.length === 0 ? (
                        <div className="mt-6 rounded-xl bg-stone-700 p-8 text-center">
                            <h3 className="text-xl font-bold">
                                Brak plansz
                            </h3>

                            <p className="mt-2 text-stone-300">
                                W bazie nie ma jeszcze żadnej
                                planszy.
                            </p>
                        </div>
                    ) : (
                        <div className="mt-6 space-y-4">
                            {activePuzzles.map((puzzle) => (
                                <article
                                    key={puzzle.id}
                                    className="rounded-xl bg-stone-700 p-5 shadow-lg"
                                >
                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                        <div>
                                            <div className="flex flex-wrap items-center gap-3">
                                                <h3 className="text-xl font-bold">
                                                    {
                                                        puzzle.title
                                                    }
                                                </h3>

                                                <span
                                                    className={`rounded-full px-3 py-1 text-sm font-bold ${getStatusColor(
                                                        puzzle.status,
                                                    )}`}
                                                >
                                                    {getStatusLabel(
                                                        puzzle.status,
                                                    )}
                                                </span>
                                            </div>

                                            <p className="mt-2 text-stone-300">
                                                Data publikacji:{" "}
                                                {formatPublicationDate(
                                                    puzzle.publicationDate,
                                                )}
                                            </p>
                                        </div>

                                        <div className="flex gap-6 text-sm">
                                            <div className="text-center">
                                                <p className="text-2xl font-bold">
                                                    {
                                                        puzzle.categoryCount
                                                    }
                                                </p>

                                                <p className="text-stone-300">
                                                    kategorie
                                                </p>
                                            </div>

                                            <div className="text-center">
                                                <p className="text-2xl font-bold">
                                                    {
                                                        puzzle.wordCount
                                                    }
                                                </p>

                                                <p className="text-stone-300">
                                                    słowa
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-5 border-t border-stone-600 pt-4">
                                        <div className="flex flex-wrap gap-3">
                                            <Link
                                                href={`/admin/puzzles/${puzzle.id}`}
                                                className="rounded-full border border-white px-5 py-2 font-bold transition hover:bg-white hover:text-stone-900"
                                            >
                                                Edytuj
                                            </Link>

                                            {puzzle.status !== "scheduled" && (
                                                <DeletePuzzleButton puzzleId={puzzle.id} />
                                            )}
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </section>

                <section className="mt-12 border-t border-stone-600 pt-8">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-2xl font-bold">
                                Archiwum
                            </h2>

                            <p className="mt-1 text-stone-300">
                                Plansze z minionych dni: {archivedPuzzles.length}
                            </p>
                        </div>
                    </div>

                    {archivedPuzzles.length === 0 ? (
                        <div className="mt-6 rounded-xl bg-stone-700 p-8 text-center">
                            <h3 className="text-xl font-bold">
                                Archiwum jest puste
                            </h3>

                            <p className="mt-2 text-stone-300">
                                Plansze pojawią się tutaj po upływie ich daty publikacji.
                            </p>
                        </div>
                    ) : (
                        <div className="mt-6 space-y-4">
                            {archivedPuzzles.map((puzzle) => (
                                <article
                                    key={puzzle.id}
                                    className="rounded-xl bg-stone-700 p-5 shadow-lg"
                                >
                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <h3 className="text-xl font-bold">
                                                {puzzle.title}
                                            </h3>

                                            <p className="mt-2 text-stone-300">
                                                Data publikacji: {formatPublicationDate(
                                                    puzzle.publicationDate,
                                                )}
                                            </p>
                                        </div>

                                        <div className="flex flex-wrap gap-3">
                                            <Link
                                                href={`/admin/puzzles/${puzzle.id}`}
                                                className="rounded-full border border-white px-5 py-2 text-center font-bold transition hover:bg-white hover:text-stone-900"
                                            >
                                                Edytuj
                                            </Link>

                                            <Link
                                                href={`/archive/${puzzle.id}`}
                                                className="rounded-full border border-amber-200 px-5 py-2 font-bold text-amber-100 transition hover:bg-amber-200 hover:text-stone-900"
                                            >
                                                Zagraj
                                            </Link>

                                            <DeletePuzzleButton puzzleId={puzzle.id} />
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}