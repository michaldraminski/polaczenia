import type { PublicPuzzle } from "../types/game";

type WordBoardProps = {
    words: PublicPuzzle["words"];
    selectedWordIds: number[];
    disabled: boolean;
    fadingWordIds: number[];
    onToggleWord: (wordId: number) => void;
};

export function WordBoard({
    words,
    selectedWordIds,
    disabled,
    fadingWordIds,
    onToggleWord,
}: WordBoardProps) {
    return (
        <section className="grid min-w-0 grid-cols-4 gap-1.5 sm:gap-2">
            {words.map((word) => {
                const isSelected = selectedWordIds.includes(word.id);
                const isFading = fadingWordIds.includes(word.id);

                return (
                    <button
                        key={word.id}
                        type="button"
                        onClick={() => onToggleWord(word.id)}
                        disabled={disabled}
                        className={`flex min-h-20 min-w-0 items-center justify-center overflow-hidden rounded-md px-1 py-2 text-center text-[clamp(0.58rem,2.7vw,1rem)] font-bold leading-tight transition sm:min-h-24 sm:p-2 ${
                            isFading
                                ? "word-fade-out bg-emerald-400 text-stone-900"
                                : isSelected
                                  ? "bg-stone-500 text-white"
                                  : "bg-stone-200 text-stone-900 hover:bg-stone-300"
                        } disabled:cursor-not-allowed`}
                    >
                        {word.value}
                    </button>
                );
            })}
        </section>
    );
}