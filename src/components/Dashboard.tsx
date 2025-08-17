"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import AdminDashboard from "./AdminDashboard";
import SellerValidatorDashboard from "./SellerValidatorDashboard";
import { User, Ticket } from "@/types/types";

interface DashboardProps {
  user: User;
  initialTickets: Ticket[];
}

export default function Dashboard({ user, initialTickets }: DashboardProps) {
  const supabase = createClient();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      <header className="ios-header sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 py-2 flex justify-between items-center">
          <div>
            <h1 className="ios-header-title">NCF E-Ticket</h1>
            <p className="ios-header-subtitle">
              Welcome, <span className="font-semibold">{user.name}</span> (
              {user.role})
            </p>
          </div>
          <button onClick={handleLogout} className="ios-button-link">
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto">
        {user.role === "admin" ? (
          <AdminDashboard user={user} initialTickets={initialTickets} />
        ) : (
          <SellerValidatorDashboard
            user={user}
            initialTickets={initialTickets}
          />
        )}
      </main>
    </div>
  );
}
