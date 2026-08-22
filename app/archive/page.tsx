import Link from "next/link";

import { getArchivedPuzzles } from "../../lib/puzzles";

export const dynamic = "force-dynamic";

function formatPublicationDate(
    publicationDate: string | null,
): string {
    if (!publicationDate) {
        return "Brak daty";
    }

    const [year, month, day] = publicationDate.split("-");
    return `${day}.${month}.${year}`;
}

export default async function ArchivePage() {
    const puzzles = await getArchivedPuzzles();

    return (
        <main className="min-h-screen bg-stone-800 px-4 py-8 text-white">
            <div className="mx-auto max-w-3xl">
                <header className="border-b border-stone-600 pb-6">
                    <Link
                        href="/"
                        className="font-medium text-stone-300 transition hover:text-white"
                    >
                        ← Dzisiejsza gra
                    </Link>

                    <h1 className="mt-5 text-3xl font-bold">
                        Archiwum plansz
                    </h1>

                    <p className="mt-2 text-stone-300">
                        Wróć do gier z poprzednich dni.
                    </p>
                </header>

                {puzzles.length === 0 ? (
                    <p className="mt-8 rounded-xl bg-stone-700 p-8 text-center text-stone-300">
                        Archiwum jest jeszcze puste.
                    </p>
                ) : (
                    <div className="mt-8 space-y-4">
                        {puzzles.map((puzzle) => (
                            <Link
                                key={puzzle.id}
                                href={`/archive/${puzzle.id}`}
                                className="block rounded-xl bg-stone-700 p-5 transition hover:bg-stone-600"
                            >
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                    <h2 className="text-xl font-bold">
                                        {puzzle.title}
                                    </h2>

                                    <span className="text-stone-300">
                                        {formatPublicationDate(
                                            puzzle.publication_date,
                                        )}
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}