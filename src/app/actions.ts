"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function createUser(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const name = formData.get("name") as string;
  const role = formData.get("role") as "seller" | "validator" | "admin";

  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return { error: "Not authenticated" };

  const { data: adminUser } = await supabase
    .from("users")
    .select("role")
    .eq("id", session.user.id)
    .single();
  if (adminUser?.role !== "admin") return { error: "Not authorized" };

  const supabaseAdmin = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            try {
              cookieStore.set(name, value, options);
            } catch {
              // This can be ignored
            }
          });
        },
      },
    }
  );

  const { data: authData, error: authError } =
    await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
    });

  if (authError) {
    return { error: `Auth error: ${authError.message}` };
  }

  const user = authData.user;
  if (!user) {
    return { error: "Failed to create user." };
  }

  const { error: profileError } = await supabaseAdmin.from("users").insert({
    id: user.id,
    name: name,
    role: role,
    username: email,
  });

  if (profileError) {
    await supabaseAdmin.auth.admin.deleteUser(user.id);
    return { error: `Profile error: ${profileError.message}` };
  }

  revalidatePath("/");
  return { error: null, message: `User ${name} created successfully.` };
}
