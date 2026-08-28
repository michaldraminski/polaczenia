import { useEffect, useRef, useState } from "react";
import type { PublicPuzzle } from "../types/game";

type WordBoardProps = {
    words: PublicPuzzle["words"];
    selectedWordIds: number[];
    disabled: boolean;
    fadingWordIds: number[];
    onToggleWord: (wordId: number) => void;
};

function WordText({
    value,
    isSelected,
}: {
    value: string;
    isSelected: boolean;
}) {
    const containerRef = useRef<HTMLSpanElement>(null);
    const textRef = useRef<HTMLSpanElement>(null);

    const [fontSize, setFontSize] = useState(16);

    useEffect(() => {
        const container = containerRef.current;
        const text = textRef.current;

        if (!container || !text) return;

        const resizeText = () => {
            // Zaczynamy od normalnego rozmiaru
            const maxFontSize = window.innerWidth >= 640 ? 16 : 15;
            const minFontSize = 8;

            let size = maxFontSize;

            text.style.fontSize = `${size}px`;

            while (
                text.scrollWidth > container.clientWidth &&
                size > minFontSize
            ) {
                size -= 0.5;
                text.style.fontSize = `${size}px`;
            }

            setFontSize(size);
        };

        resizeText();

        const observer = new ResizeObserver(resizeText);
        observer.observe(container);

        window.addEventListener("resize", resizeText);

        return () => {
            observer.disconnect();
            window.removeEventListener("resize", resizeText);
        };
    }, [value]);

    return (
        <span
            ref={containerRef}
            className="block min-w-0 max-w-full overflow-hidden whitespace-nowrap"
        >
            <span
                ref={textRef}
                className="block whitespace-nowrap font-bold leading-tight"
                style={{
                    fontSize: `${fontSize}px`,
                }}
            >
                {value}
            </span>
        </span>
    );
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
                const isSelected = selectedWordIds.includes(word.id);
                const isFading = fadingWordIds.includes(word.id);

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
                            w-full
                            items-center
                            justify-center
                            overflow-hidden
                            rounded-lg
                            border
                            px-2
                            py-2
                            text-center
                            transition-all
                            duration-150
                            sm:min-h-[80px]
                            sm:px-3
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
                        <WordText
                            value={word.value}
                            isSelected={isSelected}
                        />
                    </button>
                );
            })}
        </section>
    );
}
