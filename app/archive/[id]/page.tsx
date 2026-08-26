import Link from "next/link";
import { notFound } from "next/navigation";

import Game from "../../../components/Game";
import { getArchivedPuzzle } from "../../../lib/puzzles";

export const dynamic = "force-dynamic";

type ArchivePuzzlePageProps = {
    params: Promise<{
        id: string;
    }>;
};

export default async function ArchivePuzzlePage({
    params,
}: ArchivePuzzlePageProps) {
    const { id } = await params;

    const puzzleId = Number(id);

    if (!Number.isInteger(puzzleId)) {
        notFound();
    }

    const puzzle = await getArchivedPuzzle(puzzleId);

    if (!puzzle) {
        notFound();
    }

    return (
        <main className="relative min-h-screen overflow-hidden bg-[#0b1220] text-slate-100">
            <div className="game-background">
                <span className="game-corner game-corner-top-right" />
                <span className="game-corner game-corner-bottom-left" />
            </div>

            <div className="relative z-10">
                <div className="mx-auto w-full max-w-2xl px-4 pt-6">
                    <Link
                        href="/archive"
                        className="inline-flex rounded-full border border-slate-600 px-4 py-2 text-sm font-bold text-slate-300 transition hover:border-white hover:text-white"
                    >
                        ← Wróć do archiwum
                    </Link>
                </div>

                <Game puzzle={puzzle} />
            </div>
        </main>
    );
}