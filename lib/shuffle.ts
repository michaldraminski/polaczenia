export function shuffle<T>(items: T[]): T[] {
    const shuffledItems = [...items];

    for (
        let index = shuffledItems.length - 1;
        index > 0;
        index--
    ) {
        const randomIndex = Math.floor(
            Math.random() * (index + 1),
        );

        [
            shuffledItems[index],
            shuffledItems[randomIndex],
        ] = [
            shuffledItems[randomIndex],
            shuffledItems[index],
        ];
    }

    return shuffledItems;
}

export function shuffleWithSeed<T>(
    items: T[],
    seed: number,
): T[] {
    const shuffledItems = [...items];
    let currentSeed = seed;

    for (
        let index = shuffledItems.length - 1;
        index > 0;
        index--
    ) {
        currentSeed =
            (currentSeed * 1664525 + 1013904223) %
            4294967296;

        const randomIndex = Math.floor(
            (currentSeed / 4294967296) * (index + 1),
        );

        [
            shuffledItems[index],
            shuffledItems[randomIndex],
        ] = [
            shuffledItems[randomIndex],
            shuffledItems[index],
        ];
    }

    return shuffledItems;
}