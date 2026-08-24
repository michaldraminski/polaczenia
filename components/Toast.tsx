"use client";

type ToastProps = {
    text: string;
    visible: boolean;
};

export function Toast({ text, visible }: ToastProps) {
    return (
        <div
            className={`pointer-events-none fixed left-1/2 top-4 z-50 -translate-x-1/2 rounded-full bg-stone-900 px-5 py-2.5 text-sm font-bold text-white shadow-lg transition-all duration-300 sm:text-base ${
                visible
                    ? "translate-y-0 opacity-100"
                    : "-translate-y-3 opacity-0"
            }`}
        >
            {text}
        </div>
    );
}