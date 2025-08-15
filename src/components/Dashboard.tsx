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
    <div className="bg-gray-50 min-h-screen">
      <header className="bg-white shadow-sm sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Naga Food Fest</h1>
            <p className="text-sm text-gray-600">
              Welcome, <span className="font-semibold">{user.name}</span> (
              {user.role})
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-red-600 font-semibold hover:text-red-800"
          >
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
