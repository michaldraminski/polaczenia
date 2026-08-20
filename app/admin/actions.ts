"use server";

import { redirect } from "next/navigation";

import { createAuthServerClient } from "../../lib/supabase/auth-server";

export async function logout() {
    const supabase = await createAuthServerClient();

    await supabase.auth.signOut();

    redirect("/admin/login");
}