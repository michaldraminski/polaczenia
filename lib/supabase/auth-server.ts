import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createAuthServerClient() {
    const supabaseUrl =
        process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabasePublishableKey =
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabasePublishableKey) {
        throw new Error(
            "Brakuje konfiguracji Supabase Auth.",
        );
    }

    const cookieStore = await cookies();

    return createServerClient(
        supabaseUrl,
        supabasePublishableKey,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },

                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(
                            ({ name, value, options }) => {
                                cookieStore.set(
                                    name,
                                    value,
                                    options,
                                );
                            },
                        );
                    } catch {
                        // Komponenty serwerowe nie zawsze mogą ustawiać cookies.
                    }
                },
            },
        },
    );
}