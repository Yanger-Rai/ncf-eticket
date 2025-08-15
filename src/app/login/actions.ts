"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function login(formData: FormData) {
  const supabase = await createClient();

  // type-casting here for convenience
  // in a real app you should validate requests
  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    // Instead of a generic error page, redirect back to the login page
    // with a specific error message.
    return redirect(`/login?message=${encodeURIComponent(error.message)}`);
  }

  return redirect("/");
}
