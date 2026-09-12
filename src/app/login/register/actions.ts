"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export async function registerAccount(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const headerList = await headers();
  const origin = headerList.get("origin") ?? `https://${headerList.get("host")}`;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: origin },
  });

  if (error) {
    return { error: error.message, needsConfirmation: false };
  }

  // If email confirmation is required, Supabase returns a user but no
  // session yet — the account exists, but can't sign in until confirmed.
  const needsConfirmation = !data.session;
  return { error: null, needsConfirmation };
}
