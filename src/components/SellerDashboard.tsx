"use client";
import React, { useState, useMemo, FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import ConfirmationDialog from "./ConfirmationDialog";
import StatusBadge from "./StatusBadge";
import { Ticket, User } from "@/types/types";

interface SellerDashboardProps {
  user: User;
  tickets: Ticket[];
  onTicketGenerated: (ticket: Ticket) => void;
}

export default function SellerDashboard({
  user,
  tickets,
  onTicketGenerated,
}: SellerDashboardProps) {
  const supabase = createClient();
  const [purchaserName, setPurchaserName] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [showConfirm, setShowConfirm] = useState<Ticket | null>(null);

  const myTickets = useMemo(
    () => tickets.filter((t) => t.generated_by_id === user.id),
    [tickets, user.id]
  );

  const handleGenerateTicket = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!purchaserName.trim()) {
      setError("Purchaser name cannot be empty.");
      return;
    }
    setLoading(true);
    setError("");

    const sellerInitials = user.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
    const { count, error: countError } = await supabase
      .from("tickets")
      .select("*", { count: "exact", head: true })
      .eq("generated_by_id", user.id);

    if (countError) {
      setError("Could not generate ticket ID. Please try again.");
      setLoading(false);
      return;
    }

    const newTicketId = `${sellerInitials}-${(count ?? 0) + 101}`;

    const newTicketData = {
      id: newTicketId,
      purchaser_name: purchaserName.trim(),
      status: "VALID",
      generated_by_id: user.id,
      generated_by_name: user.name,
    };

    const { data: newTicket, error: insertError } = await supabase
      .from("tickets")
      .insert(newTicketData)
      .select()
      .single<Ticket>();

    if (insertError) {
      setError(insertError.message);
    } else if (newTicket) {
      onTicketGenerated(newTicket);
      setPurchaserName("");
    }
    setLoading(false);
  };

  const handleInvalidate = async (ticketId: string) => {
    await supabase
      .from("tickets")
      .update({ status: "INVALIDATED" })
      .eq("id", ticketId);
    setShowConfirm(null);
  };

  return (
    <div className="p-4 space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Generate New Ticket
        </h2>
        <form onSubmit={handleGenerateTicket} className="space-y-4">
          <div>
            <label
              htmlFor="purchaserName"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Purchaser&apos;s Full Name
            </label>
            <input
              id="purchaserName"
              type="text"
              value={purchaserName}
              onChange={(e) => setPurchaserName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Aniket Sharma"
            />
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-transform transform hover:scale-105 shadow-md disabled:bg-blue-300"
          >
            {loading ? "Generating..." : "Generate & View Ticket"}
          </button>
        </form>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          My Generated Tickets
        </h2>
        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
          {myTickets.map((ticket) => (
            <div
              key={ticket.id}
              className="bg-gray-50 p-4 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
            >
              <div className="flex-1">
                <p className="font-bold text-lg text-gray-900">{ticket.id}</p>
                <p className="text-gray-700">{ticket.purchaser_name}</p>
                <p className="text-xs text-gray-500">
                  {new Date(ticket.purchase_date).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <StatusBadge status={ticket.status} />
                {ticket.status === "VALID" && (
                  <button
                    onClick={() => setShowConfirm(ticket)}
                    className="bg-red-500 text-white text-xs font-bold py-2 px-3 rounded-md hover:bg-red-600"
                  >
                    INVALIDATE
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      {showConfirm && (
        <ConfirmationDialog
          message={`Are you sure you want to invalidate ticket ${showConfirm.id}? This cannot be undone.`}
          onConfirm={() => handleInvalidate(showConfirm.id)}
          onCancel={() => setShowConfirm(null)}
        />
      )}
    </div>
  );
}
