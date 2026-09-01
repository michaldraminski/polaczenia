import { CrosswordBoard } from "../../components/CrosswordBoard";
import { testPuzzle } from "../../lib/crossword/testPuzzle";

export default function CrosswordPage() {
    return (
        <main className="relative min-h-screen overflow-hidden bg-[#0b1220] px-4 py-8 text-slate-100 sm:px-6 sm:py-12">
            <div className="game-background">
                <span className="game-corner game-corner-top-right" />
                <span className="game-corner game-corner-bottom-left" />
            </div>

            <div className="relative z-10 mx-auto w-full max-w-2xl">
                <header className="mb-9 text-center sm:mb-11">
                    <div className="game-logo-mark">
                        <span className="game-logo-dot" />
                    </div>

                    <h1 className="text-4xl font-extrabold tracking-[-0.045em] text-white sm:text-5xl">
                        MINI KRZYŻÓWKA
                    </h1>

                    <div className="mx-auto mt-5 h-px w-14 bg-[#d4af55]/70" />

                    <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-slate-400 sm:text-base">
                        {testPuzzle.title}
                        <br />
                        Autor: {testPuzzle.author}
                    </p>
                </header>

                <CrosswordBoard
                    grid={testPuzzle.grid}
                    entries={testPuzzle.entries}
                />
            </div>
        </main>
    );
}
