"use client";

import { useEffect, useState } from "react";

type GameModalProps = {
  title: string;
  message: string;
  type: "success" | "failure" | "feedback";
  onClose: () => void;
  children?: React.ReactNode;
};

export function GameModal({
  title,
  message,
  type,
  onClose,
  children,
}: GameModalProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Uruchamiamy animację po zamontowaniu komponentu
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 20);

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleEscape);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center px-4 transition-opacity duration-300 ease-out ${
        isVisible
          ? "bg-black/60 opacity-100"
          : "bg-black/0 opacity-0"
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="game-modal-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className={`w-full max-w-md rounded-2xl bg-stone-800 p-6 text-white shadow-2xl transition-all duration-300 ease-out ${
          isVisible
            ? "translate-y-0 scale-100 opacity-100"
            : "translate-y-2 scale-95 opacity-0"
        }`}
      >
        <div className="text-center">
          <div
            className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full text-3xl ${
              type === "success"
                ? "bg-green-500/20 text-green-400"
                : type === "failure"
                  ? "bg-red-500/20 text-red-400"
                  : "bg-amber-500/20 text-amber-400"
            }`}
          >
            {type === "success"
              ? "✓"
              : type === "failure"
                ? "✕"
                : "★"}
          </div>

          <h2
            id="game-modal-title"
            className="text-2xl font-bold"
          >
            {title}
          </h2>

          <p className="mt-3 text-stone-300">
            {message}
          </p>
        </div>

        {children && (
          <div className="mt-5">
            {children}
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-full bg-white px-5 py-3 font-bold text-stone-900 transition hover:bg-stone-200"
        >
          Zamknij
        </button>
      </div>
    </div>
  );
}
