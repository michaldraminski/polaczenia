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
        <section className="grid min-w-0 grid-cols-4 gap-2 sm:gap-2.5">
            {words.map((word) => {
                const isSelected = selectedWordIds.includes(word.id);
                const isFading = fadingWordIds.includes(word.id);

                // dynamic font size: krótkie słowa większe, dłuższe mniejsze
                const fontSizeClass =
                    word.value.length <= 3
                        ? "text-lg sm:text-xl"
                        : word.value.length <= 14
                        ? "text-sm sm:text-base"
                        : "text-sm sm:text-[0.92rem]";

                // jeśli fraza zawiera spację — pozwól łamać tylko przy spacjach
                // jeśli to pojedynczy bardzo długi token — pozwól łamać wewnątrz słowa
                const breakClass = word.value.includes(" ")
                    ? "break-normal" // łam tylko przy spacjach
                    : "break-words"; // łam w razie potrzeby wewnątrz długiego słowa

                return (
                    <button
                        key={word.id}
                        type="button"
                        onClick={() => onToggleWord(word.id)}
                        disabled={disabled}
                        className={`
                            flex
                            min-h-[72px]
                            min-w-0
                            items-center
                            justify-center
                            rounded-lg
                            border
                            px-3
                            py-2
                            text-center
                            ${fontSizeClass}
                            font-bold
                            leading-normal
                            whitespace-normal
                            ${breakClass}
                            transition-all
                            duration-150
                            sm:min-h-[80px]
                            sm:px-4
                            sm:py-3

                            ${
                                isFading
                                    ? `
                                        word-fade-out
                                        border-[#d4af55]
                                        bg-[#d4af55]
                                        text-[#0b1220]
                                    `
                                    : isSelected
                                    ? `
                                        border-[#d4af55]
                                        bg-[#d4af55]
                                        text-[#0b1220]
                                        shadow-[0_0_20px_rgba(212,175,85,0.12)]
                                        -translate-y-0.5
                                    `
                                    : `
                                        border-slate-600/70
                                        bg-[#182236]
                                        text-slate-100
                                        shadow-[0_4px_14px_rgba(0,0,0,0.16)]
                                        hover:border-slate-500
                                        hover:bg-[#1d293f]
                                        hover:-translate-y-0.5
                                    `
                            }

                            disabled:cursor-not-allowed
                        `}
                    >
                        {word.value}
                    </button>
                );
            })}
        </section>
    );
}