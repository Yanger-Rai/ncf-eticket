"use client";
import { TicketStatus } from "@/types/types";
import React from "react";

interface StatusBadgeProps {
  status: TicketStatus;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const baseClasses =
    "px-3 py-1 text-sm font-bold rounded-full text-white w-fit";
  const statusMap: Record<TicketStatus, string> = {
    VALID: `bg-green-500 ${baseClasses}`,
    INVALIDATED: `bg-red-500 ${baseClasses}`,
    REDEEMED: `bg-yellow-500 ${baseClasses}`,
  };
  return (
    <span className={statusMap[status] || `bg-gray-500 ${baseClasses}`}>
      {status}
    </span>
  );
}
