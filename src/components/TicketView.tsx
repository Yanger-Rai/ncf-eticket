// src/components/TicketView.tsx
"use client";
import React, { useState } from "react";
import Image from "next/image";
import { Ticket, TicketType } from "@/types/types";
import "./TicketView.style.css";

// --- SVG Icons ---
const LocationPinIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5 text-gray-500"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
    />
  </svg>
);
const CalendarIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5 text-gray-500"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  </svg>
);

// --- TICKET DETAILS MAPPING ---
const TICKET_DETAILS: Record<
  TicketType,
  { price: number; description: string }
> = {
  "Admit One": { price: 350, description: "Admits One Person" },
  "Admit Two": { price: 600, description: "Admits Two People" },
  Family: { price: 1500, description: "Family (Five People)" },
  Donor: { price: 2500, description: "Donor Ticket" },
};

interface TicketViewProps {
  ticket: Ticket;
  sellerName: string;
}

export default function TicketView({ ticket, sellerName }: TicketViewProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const purchaseDate = new Date(ticket.purchase_date);
  const formattedDate = purchaseDate.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const logoUrl =
    "https://dknmnivlsnzkwhhrrlyz.supabase.co/storage/v1/object/public/ticket-assets/NCF_Logo_BlackTag.png";
  const thaliUrl =
    "https://dknmnivlsnzkwhhrrlyz.supabase.co/storage/v1/object/public/ticket-assets/thali.png";
  const ticketDetails =
    TICKET_DETAILS[ticket.ticket_type] || TICKET_DETAILS["Admit One"];

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ticket, sellerName }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate PDF");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `NCF_Ticket_${ticket.id}.png`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading PNG:", error);
      alert("Could not download ticket. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="bg-gray-100 p-4 flex flex-col items-center">
      <div className="ticket-container bg-transparent w-full max-w-sm mx-auto rounded-2xl shadow-lg font-sans flex flex-col">
        <div className="p-6 flex-grow ticket-top bg-white rounded-t-2xl">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-gray-500">
                NAGA CHRISTIAN FELLOWSHIP, HYD
              </p>
              <h1 className="text-2xl font-extrabold tracking-tight text-gray-800">
                NAGA FOOD FEST
              </h1>
            </div>
            <div className="w-12 h-12">
              <Image src={logoUrl} alt="NCF Logo" width={50} height={50} />
            </div>
          </div>
          <div className="border-t border-b border-dashed border-gray-300 my-4 py-4 space-y-3">
            <div className="flex items-start">
              <CalendarIcon />
              <div className="ml-3">
                <p className="font-semibold text-gray-800">
                  Saturday, 30 August, 2025
                </p>
                <p className="text-sm text-gray-600">07:00pm - 09:00pm</p>
              </div>
            </div>
            <div className="flex items-start">
              <LocationPinIcon />
              <div className="ml-3">
                <p className="font-semibold text-gray-800">
                  St. Georges Preparatory School
                </p>
                <p className="text-sm text-gray-600">Gunfoundry, Abids</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-500 text-xs uppercase">Purchaser</p>
              <p className="font-bold text-base text-gray-900 break-words">
                {ticket.purchaser_name}
              </p>
            </div>
            <div>
              <p className="text-gray-500 text-xs uppercase">Issued By</p>
              <p className="font-semibold text-base text-gray-700 break-words">
                {sellerName}
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-gray-500 text-xs uppercase">Purchase Date</p>
              <p className="font-semibold text-base text-gray-700">
                {formattedDate}
              </p>
            </div>
          </div>
        </div>
        <div className="ticket-stub flex-shrink-0 relative bg-red-800 text-white p-5 rounded-b-2xl">
          <div
            className="absolute inset-0 bg-repeat bg-center opacity-10"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")`,
            }}
          ></div>
          <div className="flex justify-between items-center relative z-10">
            <div className="w-30 h-24">
              <Image src={thaliUrl} alt="Naga Thali" width={120} height={120} />
            </div>
            <div className="text-right">
              <p className="text-xs opacity-80">Ticket ID</p>
              <p className="text-2xl font-mono font-bold tracking-wider">
                {ticket.id}
              </p>
              <p className="font-bold text-xl mt-2">
                {ticketDetails.description}
              </p>
              <p className="font-bold text-lg">₹{ticket.price.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>
      <div className="text-center mt-6 w-full max-w-sm">
        <button
          onClick={handleDownload}
          disabled={isDownloading}
          className="w-full px-8 py-3 bg-blue-600 text-white font-bold rounded-lg shadow-md hover:bg-blue-700 disabled:bg-blue-300"
        >
          {isDownloading ? "Downloading Image..." : "Download Image"}
        </button>
      </div>
    </div>
  );
}
