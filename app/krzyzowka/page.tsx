import { CrosswordGame, type CrosswordData } from "../../components/CrosswordGame";
import crosswordData from "../../scripts/crossword.json";

const typedCrosswordData: CrosswordData = {
    ...crosswordData,
    words: crosswordData.words.map((word) => {
        if (word.direction !== "horizontal" && word.direction !== "vertical") {
            throw new Error(`Nieprawidłowy kierunek słowa: ${word.direction}`);
        }

        return {
            ...word,
            direction: word.direction,
        };
    }),
};

export default function CrosswordPage() {
    return (
        <main className="relative min-h-screen overflow-x-hidden bg-[#0b1220] px-4 py-8 text-slate-100 sm:px-6 sm:py-12">
            <div className="game-background">
                <span className="game-corner game-corner-top-right" />
                <span className="game-corner game-corner-bottom-left" />
            </div>

            <div className="relative z-10 mx-auto w-full max-w-7xl">
                <header className="mb-9 text-center sm:mb-11">
                    <div className="game-logo-mark">
                        <span className="game-logo-dot" />
                    </div>

                    <h1 className="text-4xl font-extrabold tracking-[-0.045em] text-white sm:text-5xl">
                        MINI KRZYŻÓWKA
                    </h1>

                    <div className="mx-auto mt-5 h-px w-14 bg-[#d4af55]/70" />

                    <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-slate-400 sm:text-base">
                        Rozwiąż krzyżówkę, klikając na wskazówki
                    </p>
                </header>

                <CrosswordGame crosswordData={typedCrosswordData} />
            </div>
        </main>
    );
}
