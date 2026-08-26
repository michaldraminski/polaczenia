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
        <main className="relative min-h-screen overflow-hidden bg-[#0b1220] px-4 py-8 text-slate-100 sm:px-6 sm:py-12">
            <div className="game-background">
                <span className="game-corner game-corner-top-right" />
                <span className="game-corner game-corner-bottom-left" />
            </div>

            <div className="relative z-10 mx-auto w-full max-w-3xl">
                <header className="border-b border-slate-700 pb-6">
                    <Link
                        href="/"
                        className="inline-flex items-center rounded-full border border-slate-600 px-4 py-2 text-sm font-bold text-slate-300 transition hover:border-white hover:text-white"
                    >
                        ← Dzisiejsza gra
                    </Link>

                    <div className="mt-7 text-center">
                        <h1 className="text-3xl font-bold sm:text-4xl">
                            Archiwum plansz
                        </h1>

                        <p className="mt-3 text-sm text-slate-400 sm:text-base">
                            Wróć do gier z poprzednich dni.
                        </p>
                    </div>
                </header>

                {puzzles.length === 0 ? (
                    <div className="mt-8 rounded-2xl border border-slate-700 bg-slate-800/80 p-10 text-center shadow-xl">
                        <h2 className="text-xl font-bold">
                            Archiwum jest jeszcze puste
                        </h2>

                        <p className="mt-2 text-slate-400">
                            Plansze pojawią się tutaj po zakończeniu ich publikacji.
                        </p>
                    </div>
                ) : (
                    <section className="mt-8 space-y-3">
                        {puzzles.map((puzzle) => (
                            <Link
                                key={puzzle.id}
                                href={`/archive/${puzzle.id}`}
                                className="group block rounded-2xl border border-slate-700 bg-slate-800/80 p-5 shadow-lg transition hover:-translate-y-0.5 hover:border-slate-500 hover:bg-slate-800"
                            >
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <h2 className="text-lg font-bold transition group-hover:text-white sm:text-xl">
                                            {puzzle.title}
                                        </h2>

                                        <p className="mt-1 text-sm text-slate-400">
                                            Archiwalna plansza
                                        </p>
                                    </div>

                                    <span className="shrink-0 rounded-full border border-slate-600 px-3 py-1 text-sm font-medium text-slate-300">
                                        {formatPublicationDate(
                                            puzzle.publication_date,
                                        )}
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </section>
                )}

                <footer className="mt-10 border-t border-slate-700 pt-5 text-center">
                    <Link
                        href="/"
                        className="text-sm font-medium text-slate-400 transition hover:text-white"
                    >
                        ← Wróć do gry
                    </Link>
                </footer>
            </div>
        </main>
    );
}