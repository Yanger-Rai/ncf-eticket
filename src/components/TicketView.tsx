"use client";
import React from "react";
import Image from "next/image";
import { Ticket } from "@/types/types";

interface TicketViewProps {
  ticket: Ticket;
  sellerName: string;
}

export default function TicketView({ ticket, sellerName }: TicketViewProps) {
  // --- IMPORTANT ---
  // Replace this with the new public URL you got from Supabase Storage for "350.jpg"
  const ticketImageUrl =
    "https://dknmnivlsnzkwhhrrlyz.supabase.co/storage/v1/object/public/ticket-assets/350.png";

  const purchaseDate = new Date(ticket.purchase_date);
  const formattedDate = purchaseDate.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const handlePrint = () => window.print();

  return (
    <div className="bg-gray-100 p-4">
      <div
        className="ticket-container relative w-full max-w-4xl mx-auto font-sans text-black"
        style={{ aspectRatio: "1200 / 550" }}
      >
        <Image
          src={ticketImageUrl}
          alt="Naga Food Fest Ticket Background"
          className="w-full h-full object-cover"
          width={1200}
          height={550}
          priority
        />

        {/* --- Overlay Content --- */}
        <div className="absolute inset-0">
          {/* Sl. No. (Top Right) */}
          <div
            className="absolute text-left"
            style={{ top: "13%", left: "80%", width: "18%" }}
          >
            <p className="text-2xl md:text-3xl font-bold tracking-wider">
              {ticket.id}
            </p>
          </div>

          {/* Ticket Issuer's name */}
          <div
            className="absolute text-left"
            style={{ top: "48.5%", left: "77%", width: "21%" }}
          >
            <p className="text-sm md:text-base font-semibold break-words">
              {sellerName}
            </p>
          </div>

          {/* Purchaser name */}
          <div
            className="absolute text-left"
            style={{ top: "65.5%", left: "77%", width: "21%" }}
          >
            <p className="text-sm md:text-base font-semibold break-words">
              {ticket.purchaser_name}
            </p>
          </div>

          {/* Purchase date */}
          <div
            className="absolute text-left"
            style={{ top: "82.5%", left: "77%", width: "21%" }}
          >
            <p className="text-sm md:text-base font-semibold">
              {formattedDate}
            </p>
          </div>
        </div>
      </div>
      <div className="text-center mt-6 print-hidden">
        <button
          onClick={handlePrint}
          className="px-8 py-3 bg-blue-600 text-white font-bold rounded-lg shadow-md hover:bg-blue-700"
        >
          Print / Save as PDF
        </button>
      </div>
      <style>{`
                @media print {
                    body * { visibility: hidden; }
                    .print-hidden { display: none; }
                    .ticket-container, .ticket-container * { visibility: visible; }
                    .ticket-container { 
                        position: absolute; 
                        left: 0; 
                        top: 0; 
                        width: 100%;
                        -webkit-print-color-adjust: exact; 
                        color-adjust: exact;
                    }
                }
            `}</style>
    </div>
  );
}
