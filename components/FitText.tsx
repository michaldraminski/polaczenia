"use client";

import { useLayoutEffect, useRef, useState } from "react";

type FitTextProps = {
    children: string;
    className?: string;
};

export function FitText({ children, className = "" }: FitTextProps) {
    const textRef = useRef<HTMLSpanElement>(null);
    const [fontSize, setFontSize] = useState<number | null>(null);

    useLayoutEffect(() => {
        const element = textRef.current;
        if (!element) return;

        const fitText = () => {
            element.style.fontSize = "";
            const computedSize = Number.parseFloat(
                window.getComputedStyle(element).fontSize,
            );
            let nextSize = computedSize;

            while (
                nextSize > 8 &&
                element.scrollWidth > element.clientWidth + 1
            ) {
                nextSize -= 1;
                element.style.fontSize = `${nextSize}px`;
            }

            setFontSize(nextSize === computedSize ? null : nextSize);
        };

        fitText();
        const observer = new ResizeObserver(fitText);
        observer.observe(element.parentElement ?? element);

        return () => observer.disconnect();
    }, [children]);

    return (
        <span
            ref={textRef}
            style={fontSize ? { fontSize: `${fontSize}px` } : undefined}
            className={`block min-w-0 max-w-full ${className}`}
        >
            {children}
        </span>
    );
}