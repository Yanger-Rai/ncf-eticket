"use client";
import React from "react";
import Modal from "./Modal";

interface ConfirmationDialogProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmationDialog({
  message,
  onConfirm,
  onCancel,
}: ConfirmationDialogProps) {
  return (
    <Modal onClose={onCancel}>
      <div className="p-6 text-center">
        <p className="text-lg font-medium text-gray-800 mb-4">{message}</p>
        <div className="flex justify-center gap-4">
          <button
            onClick={onCancel}
            className="px-6 py-2 rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-6 py-2 rounded-md text-white bg-red-600 hover:bg-red-700 font-semibold"
          >
            Confirm
          </button>
        </div>
      </div>
    </Modal>
  );
}
