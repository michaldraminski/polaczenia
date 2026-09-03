import Link from "next/link";
import { redirect } from "next/navigation";

import {
    archivePastPuzzles,
    getAdminPuzzles,
} from "../../lib/admin-puzzles";
import { createAuthServerClient } from "../../lib/supabase/auth-server";
import DeletePuzzleButton from "../../components/DeletePuzzleButton";
import { logout } from "./actions";
import { getCurrentDateInPoland } from "../../lib/date";

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

function formatDuration(seconds: number | null): string {
    if (seconds === null) {
        return "Brak danych";
    }

    const roundedSeconds = Math.round(seconds);
    const minutes = Math.floor(roundedSeconds / 60);
    const remainingSeconds = roundedSeconds % 60;
    return minutes > 0
        ? `${minutes} min ${remainingSeconds} s`
        : `${remainingSeconds} s`;
}

export async function ConnectionsAdminPage() {
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
    const today = getCurrentDateInPoland();

    const activePuzzles = puzzles.filter(
    (puzzle) => puzzle.status !== "archived",
    );

    // find today's scheduled puzzle (status scheduled + publicationDate === today)
    const todaysPuzzle = activePuzzles.find(
    (p) => p.status === "scheduled" && p.publicationDate === today,
    );

    // active list without the today's puzzle (so it won't appear twice)
    const activeWithoutToday = activePuzzles.filter(
    (p) => !todaysPuzzle || p.id !== todaysPuzzle.id,
    );

    const archivedPuzzles = puzzles.filter(
    (puzzle) => puzzle.status === "archived",
    );

    return (
        <main className="relative min-h-screen overflow-hidden bg-[#0b1220] px-4 py-8 text-slate-100 sm:px-6 sm:py-12">
            <div className="game-background">
                <span className="game-corner game-corner-top-right" />
                <span className="game-corner game-corner-bottom-left" />
            </div>

            <div className="relative z-10 mx-auto w-full max-w-5xl">

                <header className="border-b border-slate-700 pb-6">
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

                        <div>
                            <p className="text-sm font-bold uppercase tracking-wider text-slate-500">
                                Połączenia
                            </p>

                            <h1 className="mt-1 text-3xl font-bold sm:text-4xl">
                                Panel administratora
                            </h1>

                            <p className="mt-2 text-sm text-slate-400">
                                Zalogowano jako {user.email}
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <Link
                                href="/"
                                className="rounded-full border border-slate-600 px-5 py-2.5 text-sm font-bold transition hover:border-white hover:text-white"
                            >
                                Przejdź do gry
                            </Link>

                            <form action={logout}>
                                <button
                                    type="submit"
                                    className="rounded-full bg-white px-5 py-2.5 text-sm font-bold text-slate-900 transition hover:bg-slate-200"
                                >
                                    Wyloguj się
                                </button>
                            </form>
                        </div>
                    </div>
                </header>
                {todaysPuzzle && (
                <section className="mt-8">
                    <div>
                    <h2 className="text-2xl font-bold">Obecna plansza</h2>    
                    </div>

                    <div className="mt-6">
                    <article className="rounded-2xl border border-slate-700 bg-slate-800/80 p-5 shadow-lg">
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-3">
                            <h3 className="text-xl font-bold">{todaysPuzzle.title}</h3>
                            <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-300">
                                Dzisiejsza
                            </span>
                            </div>

                            <p className="mt-2 text-sm text-slate-400">
                            Data publikacji: {formatPublicationDate(todaysPuzzle.publicationDate)}
                            </p>

                            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                            {[
                                ["Gry", todaysPuzzle.gameStats.games],
                                [
                                "Sukcesy",
                                todaysPuzzle.gameStats.winRate === null
                                    ? "—"
                                    : `${todaysPuzzle.gameStats.winRate}%`,
                                ],
                                ["Śr. błędów", todaysPuzzle.gameStats.averageMistakes ?? "—"],
                                ["Śr. czas", formatDuration(todaysPuzzle.gameStats.averageDurationSeconds)],
                                ["Trudność", todaysPuzzle.gameStats.averageDifficulty ?? "—"],
                                ["Jakość", todaysPuzzle.gameStats.averageQuality ?? "—"],
                            ].map(([label, value]) => (
                                <div key={label} className="rounded-xl border border-slate-700 bg-slate-900/60 p-3">
                                <p className="text-xs text-slate-500">{label}</p>
                                <p className="mt-1 font-bold">{value}</p>
                                </div>
                            ))}
                            </div>
                        </div>

                        <div className="flex shrink-0 gap-2">
                            <Link
                            href={`/admin/puzzles/${todaysPuzzle.id}`}
                            className="rounded-full border border-slate-600 px-5 py-2.5 text-sm font-bold transition hover:border-white hover:bg-white hover:text-slate-900"
                            >
                            Edytuj
                            </Link>
                        </div>
                        </div>
                    </article>
                    </div>
                </section>
                )}
                <section className="mt-8">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <h2 className="text-2xl font-bold">
                                Plansze
                            </h2>

                            <p className="mt-1 text-slate-400">
                                Liczba aktywnych plansz: {activeWithoutToday.length}
                            </p>
                        </div>

                        <Link
                            href="/admin/puzzles/new"
                            className="rounded-full bg-white px-6 py-3 text-center font-bold text-slate-900 transition hover:bg-slate-200"
                        >
                            + Dodaj planszę
                        </Link>
                    </div>

                    {activePuzzles.length === 0 ? (
                        <div className="mt-6 rounded-2xl border border-slate-700 bg-slate-800/80 p-10 text-center shadow-xl">
                            <h3 className="text-xl font-bold">
                                Brak plansz
                            </h3>

                            <p className="mt-2 text-slate-400">
                                W bazie nie ma jeszcze żadnej planszy.
                            </p>
                        </div>
                    ) : (
                        <div className="mt-6 space-y-4">
                            {activeWithoutToday.map((puzzle) => (
                                <article
                                    key={puzzle.id}
                                    className="rounded-2xl border border-slate-700 bg-slate-800/80 p-5 shadow-lg transition hover:border-slate-600"
                                >
                                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">

                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-3">
                                                <h3 className="text-xl font-bold">
                                                    {puzzle.title}
                                                </h3>

                                                <span
                                                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                                                        puzzle.status === "draft"
                                                            ? "bg-slate-600 text-slate-100"
                                                            : puzzle.status === "scheduled"
                                                            ? "bg-emerald-500/20 text-emerald-300"
                                                            : "bg-amber-500/20 text-amber-300"
                                                    }`}
                                                >
                                                    {getStatusLabel(
                                                        puzzle.status,
                                                    )}
                                                </span>
                                            </div>

                                            <p className="mt-2 text-sm text-slate-400">
                                                Data publikacji:{" "}
                                                {formatPublicationDate(
                                                    puzzle.publicationDate,
                                                )}
                                            </p>
                                        </div>

                                        <div className="flex shrink-0 gap-2">
                                            <Link
                                                href={`/admin/puzzles/${puzzle.id}`}
                                                className="rounded-full border border-slate-600 px-5 py-2.5 text-sm font-bold transition hover:border-white hover:bg-white hover:text-slate-900"
                                            >
                                                Edytuj
                                            </Link>

                                            {puzzle.status !== "scheduled" && (
                                                <DeletePuzzleButton
                                                    puzzleId={puzzle.id}
                                                />
                                            )}
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </section>

                {archivedPuzzles.length > 0 && (
                    <section className="mt-12 border-t border-slate-700 pt-8">
                        <div>
                        <h2 className="text-2xl font-bold">
                            Archiwum
                        </h2>

                        <p className="mt-1 text-slate-400">
                            Archiwalne plansze i ich statystyki
                        </p>
                        </div>

                        <div className="mt-6 space-y-4">
                        {archivedPuzzles.map((puzzle) => (
                            <article
                            key={puzzle.id}
                            className="rounded-2xl border border-slate-700 bg-slate-800/60 p-5 shadow-lg"
                            >
                            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                                <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-3">
                                    <h3 className="text-xl font-bold">
                                    {puzzle.title}
                                    </h3>

                                    <span className="rounded-full bg-amber-500/20 px-3 py-1 text-xs font-bold text-amber-300">
                                    Archiwalna
                                    </span>
                                </div>

                                <p className="mt-2 text-sm text-slate-400">
                                    Data publikacji:{" "}
                                    {formatPublicationDate(puzzle.publicationDate)}
                                </p>

                                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                                    {[
                                    ["Gry", puzzle.gameStats.games],
                                    [
                                        "Sukcesy",
                                        puzzle.gameStats.winRate === null
                                        ? "—"
                                        : `${puzzle.gameStats.winRate}%`,
                                    ],
                                    [
                                        "Śr. błędów",
                                        puzzle.gameStats.averageMistakes ?? "—",
                                    ],
                                    [
                                        "Śr. czas",
                                        formatDuration(
                                        puzzle.gameStats.averageDurationSeconds,
                                        ),
                                    ],
                                    [
                                        "Trudność",
                                        puzzle.gameStats.averageDifficulty ?? "—",
                                    ],
                                    [
                                        "Jakość",
                                        puzzle.gameStats.averageQuality ?? "—",
                                    ],
                                    ].map(([label, value]) => (
                                    <div
                                        key={label}
                                        className="rounded-xl border border-slate-700 bg-slate-900/60 p-3"
                                    >
                                        <p className="text-xs text-slate-500">
                                        {label}
                                        </p>

                                        <p className="mt-1 font-bold">
                                        {value}
                                        </p>
                                    </div>
                                    ))}
                                </div>
                                </div>

                                <div className="flex shrink-0 gap-2">
                                <Link
                                    href={`/admin/puzzles/${puzzle.id}`}
                                    className="rounded-full border border-slate-600 px-5 py-2.5 text-sm font-bold transition hover:border-white hover:bg-white hover:text-slate-900"
                                >
                                    Edytuj
                                </Link>
                                </div>
                            </div>
                            </article>
                        ))}
                        </div>
                    </section>
                    )}
            </div>
        </main>
    );
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

    return (
        <main className="relative min-h-screen overflow-hidden bg-[#0b1220] px-4 py-8 text-slate-100 sm:px-6 sm:py-12">
            <div className="game-background">
                <span className="game-corner game-corner-top-right" />
                <span className="game-corner game-corner-bottom-left" />
            </div>

            <div className="relative z-10 mx-auto w-full max-w-5xl">
                <header className="flex flex-col gap-5 border-b border-slate-700 pb-6 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-sm font-bold uppercase tracking-wider text-slate-500">
                            Panel administratora
                        </p>
                        <h1 className="mt-1 text-3xl font-bold sm:text-4xl">
                            Wybierz grę
                        </h1>
                        <p className="mt-2 text-sm text-slate-400">
                            Zalogowano jako {user.email}
                        </p>
                    </div>
                    <form action={logout}>
                        <button
                            type="submit"
                            className="rounded-full bg-white px-5 py-2.5 text-sm font-bold text-slate-900 transition hover:bg-slate-200"
                        >
                            Wyloguj się
                        </button>
                    </form>
                </header>

                <section className="mt-8 grid gap-4 sm:grid-cols-2">
                    <Link
                        href="/admin/connections"
                        className="rounded-2xl border border-emerald-400/50 bg-emerald-950/30 p-6 transition hover:border-emerald-300"
                    >
                        <p className="text-sm font-bold uppercase tracking-wider text-emerald-300">
                            Gra 1
                        </p>
                        <h2 className="mt-2 text-2xl font-bold">Połączenia</h2>
                        <p className="mt-1 text-sm text-slate-400">
                            Zarządzaj kategoriami i słowami.
                        </p>
                    </Link>
                    <Link
                        href="/admin/crossword"
                        className="rounded-2xl border border-[#d4af55]/50 bg-[#3a2d12]/40 p-6 transition hover:border-[#d4af55]"
                    >
                        <p className="text-sm font-bold uppercase tracking-wider text-[#d4af55]">
                            Gra 2
                        </p>
                        <h2 className="mt-2 text-2xl font-bold">Krzyżówka</h2>
                        <p className="mt-1 text-sm text-slate-400">
                            Generuj plansze i edytuj wskazówki.
                        </p>
                    </Link>
                </section>
            </div>
        </main>
    );
}