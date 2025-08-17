"use client";
import React, { useState, useEffect, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import SellerDashboard from "@/components/SellerDashboard";
import ValidatorDashboard from "@/components/ValidatorDashboard";
import TicketView from "@/components/TicketView";
import Modal from "@/components/Modal";
import { User, Ticket, TicketStatus } from "@/types/types";
import { createUser } from "@/app/actions";

type AdminActiveTab = "generate" | "validate" | "createUser";

const AdminTabNavigation = ({
  activeTab,
  setActiveTab,
}: {
  activeTab: AdminActiveTab;
  setActiveTab: (tab: AdminActiveTab) => void;
}) => (
  <div className="flex border-b border-gray-200 bg-white sticky top-[65px] z-10">
    <button
      onClick={() => setActiveTab("generate")}
      className={`flex-1 py-3 text-center font-semibold ${
        activeTab === "generate"
          ? "border-b-2 border-blue-600 text-blue-600"
          : "text-gray-500"
      }`}
    >
      Generate
    </button>
    <button
      onClick={() => setActiveTab("validate")}
      className={`flex-1 py-3 text-center font-semibold ${
        activeTab === "validate"
          ? "border-b-2 border-blue-600 text-blue-600"
          : "text-gray-500"
      }`}
    >
      Validate
    </button>
    <button
      onClick={() => setActiveTab("createUser")}
      className={`flex-1 py-3 text-center font-semibold ${
        activeTab === "createUser"
          ? "border-b-2 border-blue-600 text-blue-600"
          : "text-gray-500"
      }`}
    >
      Create User
    </button>
  </div>
);

const CreateUserForm = () => {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (formData: FormData) => {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await createUser(formData);
      if (result.error) {
        setError(result.error);
      } else {
        setMessage(result.message || "Success!");
        // Reset form manually if needed
        const form = document.getElementById(
          "createUserForm"
        ) as HTMLFormElement;
        form?.reset();
      }
    });
  };

  return (
    <div className="p-4">
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Create New User
        </h2>
        <form id="createUserForm" action={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Full Name
            </label>
            <input
              name="name"
              type="text"
              required
              className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              name="email"
              type="email"
              required
              className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Temporary Password
            </label>
            <input
              name="password"
              type="password"
              required
              className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Role
            </label>
            <select
              name="role"
              required
              className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg bg-white"
            >
              <option value="seller">Seller</option>
              <option value="validator">Validator</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300"
          >
            {isPending ? "Creating..." : "Create User"}
          </button>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          {message && <p className="text-green-500 text-sm">{message}</p>}
        </form>
      </div>
    </div>
  );
};

interface DashboardProps {
  user: User;
  initialTickets: Ticket[];
}

export default function AdminDashboard({
  user,
  initialTickets,
}: DashboardProps) {
  const supabase = createClient();
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [currentTicket, setCurrentTicket] = useState<Ticket | null>(null);
  const [activeTab, setActiveTab] = useState<AdminActiveTab>("validate");

  useEffect(() => {
    const channel = supabase
      .channel("realtime tickets")
      .on<Ticket>(
        "postgres_changes",
        { event: "*", schema: "public", table: "tickets" },
        () => router.refresh()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, router]);

  useEffect(() => {
    setTickets(initialTickets);
  }, [initialTickets]);

  const handleTicketGenerated = (ticket: Ticket) => {
    setCurrentTicket(ticket);
    setShowTicketModal(true);
  };

  const handleCloseTicketView = () => {
    setShowTicketModal(false);
    setCurrentTicket(null);
  };

  const handleUpdateTicketStatus = (ticketId: string, status: TicketStatus) => {
    setTickets((currentTickets) =>
      currentTickets.map((t) => (t.id === ticketId ? { ...t, status } : t))
    );
  };

  return (
    <>
      <AdminTabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
      {activeTab === "generate" && (
        <SellerDashboard
          user={user}
          tickets={tickets}
          onTicketGenerated={handleTicketGenerated}
          onUpdateTicketStatus={handleUpdateTicketStatus}
        />
      )}
      {activeTab === "validate" && (
        <ValidatorDashboard user={user} tickets={tickets} />
      )}
      {activeTab === "createUser" && <CreateUserForm />}
      {showTicketModal && currentTicket && (
        <Modal onClose={handleCloseTicketView}>
          <TicketView ticket={currentTicket} sellerName={user.name} />
        </Modal>
      )}
    </>
  );
}
