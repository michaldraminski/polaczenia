import { redirect } from "next/navigation";

import { createAuthServerClient } from "../../lib/supabase/auth-server";
import { logout } from "./actions";

export default async function AdminPage() {
    const supabase = await createAuthServerClient();

    const {
        data: { user },
        error,
    } = await supabase.auth.getUser();

    if (error || !user) {
        redirect("/admin/login");
    }

    return (
        <main className="min-h-screen bg-stone-800 px-4 py-8 text-white">
            <div className="mx-auto max-w-5xl">
                <header className="flex items-center justify-between border-b border-stone-600 pb-5">
                    <div>
                        <h1 className="text-3xl font-bold">
                            Panel administratora
                        </h1>

                        <p className="mt-1 text-stone-300">
                            Zalogowano jako {user.email}
                        </p>
                    </div>

                    <form action= {logout}>
                        <button
                            type="submit"
                            className="rounded-full border border-white px-5 py-2 font-bold transition hover:bg-white hover:text-stone-900"
                        >
                            Wyloguj się
                        </button>
                    </form>
                </header>

                <section className="mt-8 rounded-xl bg-stone-700 p-8">
                    <h2 className="text-2xl font-bold">
                        Plansze
                    </h2>

                    <p className="mt-3 text-stone-300">
                        Tutaj pojawi się lista zapisanych
                        plansz oraz formularz dodawania
                        nowych zestawów.
                    </p>
                </section>
            </div>
        </main>
    );
}