import type { SolvedCategory } from "../types/game";
import { getCategoryColor } from "../lib/gameUtils";

type SolvedCategoriesProps = {
    categories: SolvedCategory[];
};

export function SolvedCategories({
    categories,
}: SolvedCategoriesProps) {
    const displayedCategories = [...categories].sort(
        (firstCategory, secondCategory) =>
            firstCategory.difficulty - secondCategory.difficulty,
    );

    return (
        <section className="mb-2 space-y-2">
            {displayedCategories.map((category) => (
                <div
                    key={category.name}
                    className={`category-enter min-w-0 rounded-lg px-3 py-4 text-center text-stone-900 sm:p-5 ${getCategoryColor(
                        category.difficulty,
                    )}`}
                >
                    <h2 className="break-words text-sm font-bold leading-tight sm:text-base">
                        {category.name}
                    </h2>

                    <div className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-4 sm:gap-2">
                        {category.words.map((word) => (
                            <span
                                key={word.id}
                                className="min-w-0 break-words rounded-md bg-white/25 px-2 py-2 text-center text-xs font-bold leading-tight sm:text-sm"
                            >
                                {word.value}
                            </span>
                        ))}
                    </div>
                </div>
            ))}
        </section>
    );
}
