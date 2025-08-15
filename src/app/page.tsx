import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Dashboard from "@/components/Dashboard";
import { User } from "@/types/types";

export default async function HomePage() {
  const supabase = await createClient();

  const { data: authData, error } = await supabase.auth.getUser();

  if (error || !authData?.user) {
    redirect("/login");
  }

  // Fetch user profile and tickets on the server
  const { data: userData } = await supabase
    .from("users")
    .select("*")
    .eq("id", authData.user.id)
    .single<User>();

  const { data: ticketsData } = await supabase
    .from("tickets")
    .select("*")
    .order("purchase_date", { ascending: false });

  if (!userData) {
    // If user exists in auth but not in our public table, something is wrong.
    // Log them out and redirect to login.
    await supabase.auth.signOut();
    redirect("/login");
  }

  return <Dashboard user={userData} initialTickets={ticketsData || []} />;
}
