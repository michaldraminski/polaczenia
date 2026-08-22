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
        <>
            <div className="bg-stone-800 px-4 pt-6 text-center text-white">
                <Link
                    href="/archive"
                    className="font-medium text-stone-300 transition hover:text-white"
                >
                    ← Wróć do archiwum
                </Link>
            </div>
            <Game puzzle={puzzle} />
        </>
    );
}