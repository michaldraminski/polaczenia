export function getCurrentDateInPoland(): string {
    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Europe/Warsaw",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).formatToParts(new Date());

    const year = parts.find(
        (part) => part.type === "year",
    )?.value;

    const month = parts.find(
        (part) => part.type === "month",
    )?.value;

    const day = parts.find(
        (part) => part.type === "day",
    )?.value;

    if (!year || !month || !day) {
        throw new Error(
            "Nie udało się ustalić bieżącej daty.",
        );
    }

    return `${year}-${month}-${day}`;
}