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
  <div className="segmented-control-wrapper">
    <div className="segmented-control">
      <button
        onClick={() => setActiveTab("generate")}
        className={`segmented-control-button ${
          activeTab === "generate" ? "active" : ""
        }`}
      >
        Generate
      </button>
      <button
        onClick={() => setActiveTab("validate")}
        className={`segmented-control-button ${
          activeTab === "validate" ? "active" : ""
        }`}
      >
        Validate
      </button>
    </div>
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

  const renderDashboard = () => {
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
          <>
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
              <ValidatorDashboard
                user={user}
                tickets={tickets}
                onUpdateTicketStatus={handleUpdateTicketStatus}
              />
            )}
          </>
        );
      default:
        return null;
    }
  };

  return (
    <>
      {renderDashboard()}
      {showTicketModal && currentTicket && (
        <Modal onClose={handleCloseTicketView}>
          <TicketView ticket={currentTicket} sellerName={user.name} />
        </Modal>
      )}
    </>
  );
}
