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
        <main className="flex min-h-screen items-center justify-center bg-stone-800 px-4 text-white">
            <div className="w-full max-w-md rounded-xl bg-stone-700 p-8 shadow-xl">
                <h1 className="text-center text-3xl font-bold">
                    Panel administratora
                </h1>

                <p className="mt-2 text-center text-stone-300">
                    Zaloguj się, aby zarządzać planszami.
                </p>

                <form action={login}>
                    <div>
                        <label
                            htmlFor="email"
                            className="mb-2 block font-medium"
                        >
                            Adres e-mail
                        </label>

                        <input
                            id="email"
                            name="email"
                            type="email"
                            required
                            autoComplete="email"
                            className="w-full rounded-md border border-stone-500 bg-stone-800 px-4 py-3 text-white outline-none focus:border-white"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="password"
                            className="mb-2 block font-medium"
                        >
                            Hasło
                        </label>

                        <input
                            id="password"
                            name="password"
                            type="password"
                            required
                            autoComplete="current-password"
                            className="w-full rounded-md border border-stone-500 bg-stone-800 px-4 py-3 text-white outline-none focus:border-white"
                        />
                    </div>

                    {error && (
                        <p className="rounded-md bg-red-950 p-3 text-center text-red-200">
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        className="w-full rounded-full bg-white px-6 py-3 font-bold text-stone-900 transition hover:bg-stone-200"
                    >
                        Zaloguj się
                    </button>
                </form>

                <a
                    href="/"
                    className="mt-6 block text-center text-stone-300 underline hover:text-white"
                >
                    Wróć do gry
                </a>
            </div>
        </main>
    );
}