import type { PublicPuzzle } from "../types/game";

type WordBoardProps = {
    words: PublicPuzzle["words"];
    selectedWordIds: number[];
    disabled: boolean;
    fadingWordIds: number[];
    onToggleWord: (wordId: number) => void;
};

function getFontSizeClass(value: string) {
  const length = value.length;

  if (length >= 15) return "text-[0.55rem]";
  if (length >= 12) return "text-[0.65rem]";
  if (length >= 10) return "text-[0.72rem]";
  if (length >= 8) return "text-[0.82rem]";

  return "text-[clamp(0.75rem,2.7vw,1rem)]";
}

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
                const isSelected =
                    selectedWordIds.includes(word.id);

                const isFading =
                    fadingWordIds.includes(word.id);

                return (
                    <button
                        key={word.id}
                        type="button"
                        onClick={() =>
                            onToggleWord(word.id)
                        }
                        disabled={disabled}
                        className={`
                            flex
                            min-h-[68px]
                            min-w-0
                            items-center
                            justify-center
                            rounded-lg
                            border
                            px-1
                            py-2
                            text-center
                            ${getFontSizeClass(word.value)}
                            font-bold
                            leading-tight
                            transition-all
                            duration-150
                            sm:min-h-[76px]
                            sm:p-2

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
                        <span
                            className={
                            word.value.includes(" ")
                                ? "min-w-0 max-w-full whitespace-normal break-words"
                                : "min-w-0 max-w-full whitespace-nowrap"
                            }
                        >
                            {word.value}
                        </span>
                        </button>
                );
            })}
        </section>
    );
}