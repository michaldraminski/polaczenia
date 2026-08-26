import Link from "next/link";
import { redirect } from "next/navigation";

import { createAuthServerClient } from "../../../lib/supabase/auth-server";
import { login } from "./actions";

type LoginPageProps = {
    searchParams: Promise<{
        error?: string;
    }>;
};

export default async function LoginPage({
    searchParams,
}: LoginPageProps) {
    const supabase = await createAuthServerClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (user) {
        redirect("/admin");
    }

    const { error } = await searchParams;

    return (
        <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0b1220] px-4 text-slate-100">
            <div className="game-background">
                <span className="game-corner game-corner-top-right" />
                <span className="game-corner game-corner-bottom-left" />
            </div>

            <div className="relative z-10 w-full max-w-md">
                <div className="rounded-2xl border border-slate-700 bg-slate-800/90 p-6 shadow-2xl backdrop-blur sm:p-8">
                    <div className="text-center">
                        <h1 className="mt-5 text-3xl font-bold">
                            Panel administratora
                        </h1>

                        <p className="mt-2 text-slate-400">
                            Zaloguj się, aby zarządzać planszami.
                        </p>
                    </div>

                    <form action={login} className="mt-8 space-y-5">
                        <div>
                            <label
                                htmlFor="email"
                                className="mb-2 block text-sm font-bold text-slate-200"
                            >
                                Adres e-mail
                            </label>

                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                autoComplete="email"
                                className="w-full rounded-xl border border-slate-600 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:outline-none"                            />
                        </div>

                        <div>
                            <label
                                htmlFor="password"
                                className="mb-2 block text-sm font-bold text-slate-200"
                            >
                                Hasło
                            </label>

                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                autoComplete="current-password"
                                className="w-full rounded-xl border border-slate-600 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:outline-none"
                            />
                        </div>

                        {error && (
                            <div className="rounded-xl border border-red-500/30 bg-red-950/40 p-4 text-center text-sm font-medium text-red-300">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="w-full rounded-full bg-white px-6 py-3.5 font-bold text-slate-900 transition hover:bg-slate-200 active:scale-[0.99]"
                        >
                            Zaloguj się
                        </button>
                    </form>

                    <Link
                        href="/"
                        className="mt-6 block text-center text-sm font-medium text-slate-400 transition hover:text-white"
                    >
                        ← Wróć do gry
                    </Link>
                </div>
            </div>
        </main>
    );
}