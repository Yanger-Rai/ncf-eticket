"use client";
import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import SellerDashboard from "@/components/SellerDashboard";
import ValidatorDashboard from "@/components/ValidatorDashboard";
import TicketView from "@/components/TicketView";
import Modal from "@/components/Modal";
import { User, Ticket, TicketStatus } from "@/types/types";

type ActiveTab = "generate" | "validate";

const TabNavigation = ({
  activeTab,
  setActiveTab,
}: {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
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
  </div>
);

interface DashboardProps {
  user: User;
  initialTickets: Ticket[];
}

export default function SellerValidatorDashboard({
  user,
  initialTickets,
}: DashboardProps) {
  const supabase = createClient();
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [currentTicket, setCurrentTicket] = useState<Ticket | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>(
    user.role === "seller" ? "generate" : "validate"
  );

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

  const DashboardComponent = () => {
    if (!user) return null;
    switch (user.role) {
      case "seller":
        return (
          <SellerDashboard
            user={user}
            tickets={tickets}
            onTicketGenerated={handleTicketGenerated}
            onUpdateTicketStatus={handleUpdateTicketStatus}
          />
        );
      case "validator":
        return (
          <div>
            <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
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
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <DashboardComponent />
      {showTicketModal && currentTicket && (
        <Modal onClose={handleCloseTicketView}>
          <TicketView ticket={currentTicket} sellerName={user.name} />
        </Modal>
      )}
    </>
  );
}
