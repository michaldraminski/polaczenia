export function GameHeader() {
    return (
        <header className="mb-9 text-center sm:mb-11">

            <div className="game-logo-mark">
                <span className="game-logo-dot" />
            </div>

            <h1 className="text-4xl font-extrabold tracking-[-0.045em] text-white sm:text-5xl">
                POŁĄCZENIA
            </h1>

            <div className="mx-auto mt-5 h-px w-14 bg-[#d4af55]/70" />

            <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-slate-400 sm:text-base">
                Znajdź cztery grupy
                <br />
                po cztery powiązane słowa.
            </p>

        </header>
    );
}