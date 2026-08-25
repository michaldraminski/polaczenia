import "server-only";

import { createClient } from "@supabase/supabase-js";

// Use a lightweight JSON-backed mock client when running with USE_DUMMY_DB=true
// This allows local development without connecting to a real Supabase instance.

export function createServerSupabaseClient() {
    if (process.env.USE_DUMMY_DB === "true") {
        // lazy require to keep prod bundle small
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { createMockClient } = require("./mock");
        return createMockClient();
    }
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseSecretKey =
        process.env.SUPABASE_SECRET_KEY;

    if (!supabaseUrl || !supabaseSecretKey) {
        throw new Error(
            "Brakuje konfiguracji połączenia z Supabase.",
        );
    }

    return createClient(
        supabaseUrl,
        supabaseSecretKey,
        {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
            },
        },
    );
}