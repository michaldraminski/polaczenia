import Game from "../components/Game";
import { getTodaysPuzzle } from "../lib/puzzles";

export default async function Home() {
    const puzzle = await getTodaysPuzzle();

    if (!puzzle) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-stone-800 px-4 text-white">
                <div className="text-center">
                    <h1 className="text-4xl font-bold">
                        Połączenia
                    </h1>

                    <p className="mt-4 text-lg">
                        Brak planszy na dzisiaj.
                    </p>
                </div>
            </main>
        );
    }

    return <Game puzzle={puzzle} />;
}