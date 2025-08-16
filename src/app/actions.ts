"use server";

import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { TicketType } from "@/types/types";

// --- TICKET PRICES AND DETAILS ---
const TICKET_DETAILS: Record<
  TicketType,
  { price: number; description: string }
> = {
  "Admit One": { price: 350, description: "Admits One Person" },
  "Admit Two": { price: 600, description: "Admits Two People" },
  Family: { price: 1500, description: "Family Ticket (Five People)" },
  Donor: { price: 2500, description: "Donor Ticket (One Person)" },
};

export async function createTicket(formData: FormData) {
  const purchaserName = formData.get("purchaserName") as string;
  const ticketType = formData.get("ticketType") as TicketType;

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return { error: "Not authenticated" };

  const { data: user } = await supabase
    .from("users")
    .select("id, name")
    .eq("id", session.user.id)
    .single();
  if (!user) return { error: "User not found" };

  // Generate Ticket ID
  const sellerInitials = user.name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase();
  const { count, error: countError } = await supabase
    .from("tickets")
    .select("*", { count: "exact", head: true })
    .eq("generated_by_id", user.id);
  if (countError) return { error: "Could not generate ticket ID." };
  const newTicketId = `${sellerInitials}-${(count ?? 0) + 101}`;

  const ticketDetails = TICKET_DETAILS[ticketType];

  const { data: newTicket, error: insertError } = await supabase
    .from("tickets")
    .insert({
      id: newTicketId,
      purchaser_name: purchaserName,
      status: "VALID",
      generated_by_id: user.id,
      generated_by_name: user.name,
      ticket_type: ticketType,
      price: ticketDetails.price,
    })
    .select()
    .single();

  if (insertError) {
    return { error: `Database error: ${insertError.message}` };
  }

  revalidatePath("/");
  return { error: null, ticket: newTicket };
}

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
        getAll: () => cookieStore.getAll(),
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

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
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
