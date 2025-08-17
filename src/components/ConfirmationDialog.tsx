"use client";
import React from "react";
import Modal from "./Modal";

interface ConfirmationDialogProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  isConfirming?: boolean; // New optional prop
}

export default function ConfirmationDialog({
  message,
  onConfirm,
  onCancel,
  isConfirming,
}: ConfirmationDialogProps) {
  return (
    <Modal onClose={onCancel}>
      <div className="p-6 text-center">
        <p className="text-lg font-medium text-gray-800 mb-4">{message}</p>
        <div className="flex justify-center gap-4">
          <button
            onClick={onCancel}
            className="px-6 py-2 rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 font-semibold cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isConfirming} // Use the prop here
            className="px-6 py-2 rounded-md text-white bg-red-600 hover:bg-red-700 font-semibold cursor-pointer"
          >
            {isConfirming ? "Confirming..." : "Confirm"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
