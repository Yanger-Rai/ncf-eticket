"use client";
import React, { useState, useMemo, useTransition } from "react";
import ConfirmationDialog from "./ConfirmationDialog";
import StatusBadge from "./StatusBadge";
import { User, Ticket, TicketType, TicketStatus } from "@/types/types";
import { createTicket } from "@/app/actions";
import { createClient } from "@/lib/supabase/client";

interface SellerDashboardProps {
  user: User;
  tickets: Ticket[];
  onTicketGenerated: (ticket: Ticket) => void;
  onUpdateTicketStatus: (ticketId: string, status: TicketStatus) => void;
}

const TICKET_DETAILS: Record<TicketType, { price: number }> = {
  "Admit One": { price: 350 },
  "Admit Two": { price: 600 },
  Family: { price: 1500 },
  Donor: { price: 2500 },
};

const TICKET_OPTIONS = Object.keys(TICKET_DETAILS) as TicketType[];

export default function SellerDashboard({
  user,
  tickets,
  onTicketGenerated,
  onUpdateTicketStatus,
}: SellerDashboardProps) {
  const supabase = createClient();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState<Ticket | null>(null);
  const [invalidatingTicketId, setInvalidatingTicketId] = useState<
    string | null
  >(null);

  const myTickets = useMemo(
    () => tickets.filter((t) => t.generated_by_id === user.id),
    [tickets, user.id]
  );

  const handleFormSubmit = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const result = await createTicket(formData);
      if (result.error) {
        setError(result.error);
      } else if (result.ticket) {
        onTicketGenerated(result.ticket);
        // Reset form
        const form = document.getElementById(
          "generateTicketForm"
        ) as HTMLFormElement;
        form?.reset();
      }
    });
  };

  const handleInvalidate = async (ticketId: string) => {
    setInvalidatingTicketId(ticketId);
    // This should also be a server action for consistency, but for now...
    const { error } = await supabase
      .from("tickets")
      .update({ status: "INVALIDATED" })
      .eq("id", ticketId);

    if (!error) {
      onUpdateTicketStatus(ticketId, "INVALIDATED");
    }
    setShowConfirm(null);
    setInvalidatingTicketId(null);
  };

  return (
    <div className="p-4 space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Generate New Ticket
        </h2>
        <form
          id="generateTicketForm"
          action={handleFormSubmit}
          className="space-y-4"
        >
          <div>
            <label
              htmlFor="purchaserName"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Purchaser&apos;s Full Name
            </label>
            <input
              id="purchaserName"
              name="purchaserName"
              type="text"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              placeholder="e.g., Aniket Sharma"
            />
          </div>
          <div>
            <label
              htmlFor="ticketType"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Ticket Type
            </label>
            <select
              id="ticketType"
              name="ticketType"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white"
            >
              {TICKET_OPTIONS.map((type) => (
                <option key={type} value={type}>
                  {type} - ₹{TICKET_DETAILS[type].price.toFixed(2)}
                </option>
              ))}
            </select>
          </div>

          {error && <p className="text-red-500 text-sm mt-1">{error}</p>}

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-blue-300 cursor-pointer"
          >
            {isPending ? "Generating..." : "Generate & View Ticket"}
          </button>
        </form>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          My Generated Tickets
        </h2>
        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
          {myTickets.length > 0 ? (
            myTickets.map((ticket) => (
              <div
                key={ticket.id}
                className="bg-gray-50 p-4 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
              >
                <div className="flex-1">
                  <p className="font-bold text-lg text-gray-900">{ticket.id}</p>
                  <p className="text-gray-700">{ticket.purchaser_name}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(ticket.purchase_date).toLocaleString()} -{" "}
                    <span className="font-semibold">{ticket.ticket_type}</span>
                  </p>
                </div>
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <StatusBadge status={ticket.status} />
                  {ticket.status === "VALID" && (
                    <button
                      onClick={() => setShowConfirm(ticket)}
                      disabled={invalidatingTicketId === ticket.id}
                      className="bg-red-500 text-white text-xs font-bold py-2 px-3 rounded-md hover:bg-red-600 disabled:bg-red-300 cursor-pointer"
                    >
                      {invalidatingTicketId === ticket.id
                        ? "Invalidating..."
                        : "INVALIDATE"}
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-4">
              You haven&apos;t generated any tickets yet.
            </p>
          )}
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
