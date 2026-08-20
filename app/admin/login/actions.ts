"use server";

import { redirect } from "next/navigation";

import { createAuthServerClient } from "../../../lib/supabase/auth-server";

function redirectWithError(message: string): never {
    const encodedMessage = encodeURIComponent(message);

    redirect(`/admin/login?error=${encodedMessage}`);
}

export async function login(formData: FormData) {
    const email = formData.get("email");
    const password = formData.get("password");

    if (
        typeof email !== "string" ||
        typeof password !== "string" ||
        !email.trim() ||
        !password
    ) {
        redirectWithError("Podaj adres e-mail i hasło.");
    }

    const supabase = await createAuthServerClient();

    const { error } =
        await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
        });

    if (error) {
        redirectWithError(
            "Niepoprawny adres e-mail lub hasło.",
        );
    }

    redirect("/admin");
}