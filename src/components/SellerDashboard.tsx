"use client";
import React, { useState, useMemo, useTransition } from "react";
import ConfirmationDialog from "./ConfirmationDialog";
import StatusBadge from "./StatusBadge";
import { User, Ticket, TicketType, TicketStatus } from "@/types/types";
import { createTicket, updateTicketStatus } from "@/app/actions";

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

    // Optimistically update the UI
    onUpdateTicketStatus(ticketId, "INVALIDATED");

    const result = await updateTicketStatus(ticketId, "INVALIDATED");

    if (result.error) {
      // Revert the UI on error
      onUpdateTicketStatus(ticketId, "VALID");
      alert(`Error: ${result.error}`);
    }

    setShowConfirm(null);
    setInvalidatingTicketId(null);
  };

  return (
    <div className="py-4 space-y-8">
      <div className="table-view-container">
        <h3 className="table-view-header">Generate New Ticket</h3>
        <form
          id="generateTicketForm"
          action={handleFormSubmit}
          className="form-group"
        >
          <div className="form-row">
            <label htmlFor="purchaserName">Name</label>
            <input
              id="purchaserName"
              name="purchaserName"
              type="text"
              required
              placeholder="Purchaser's Full Name"
            />
          </div>
          <div className="form-row">
            <label htmlFor="ticketType">Type</label>
            <select id="ticketType" name="ticketType" required>
              {TICKET_OPTIONS.map((type) => (
                <option key={type} value={type}>
                  {type} - ₹{TICKET_DETAILS[type].price.toFixed(2)}
                </option>
              ))}
            </select>
          </div>
        </form>
        {error && <p className="text-red-500 text-sm mt-2 px-4">{error}</p>}
        <button
          type="submit"
          form="generateTicketForm"
          disabled={isPending}
          className="w-full mt-4 bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-blue-300"
        >
          {isPending ? "Generating..." : "Generate & View Ticket"}
        </button>
      </div>

      <div className="table-view-container">
        <h3 className="table-view-header">
          My Generated Tickets ({myTickets.length})
        </h3>
        <div className="table-view max-h-96 overflow-y-auto">
          {myTickets.length > 0 ? (
            myTickets.map((ticket) => (
              <div key={ticket.id} className="table-view-item">
                <div className="flex-1">
                  <p className="font-bold text-lg text-gray-900">{ticket.id}</p>
                  <p className="text-gray-700">{ticket.purchaser_name}</p>
                </div>
                <div className="flex items-center gap-4">
                  <StatusBadge status={ticket.status} />
                  {ticket.status === "VALID" && (
                    <button
                      onClick={() => setShowConfirm(ticket)}
                      disabled={invalidatingTicketId === ticket.id}
                      className="text-red-600 font-semibold text-sm"
                    >
                      {invalidatingTicketId === ticket.id
                        ? "..."
                        : "Invalidate"}
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
