"use client";

import { login } from "@/app/login/actions";
import { useFormStatus } from "react-dom";
import Image from "next/image";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="w-full bg-gray-800 text-white font-bold py-3 px-4 rounded-lg hover:bg-gray-900 transition-colors disabled:bg-gray-400"
      disabled={pending}
    >
      {pending ? "Signing in..." : "sign in"}
    </button>
  );
}

const logoUrl =
  "https://dknmnivlsnzkwhhrrlyz.supabase.co/storage/v1/object/public/ticket-assets/NCF_Logo_BlackTag.png";

export default function LoginScreen({ message }: { message?: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center justify-center py-6">
          <div className="w-20 h-12">
            <Image src={logoUrl} alt="Naga Thali" width={80} height={40} />
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-800">Naga Food Fest</h1>
            <p className="text-gray-600">Ticket Management Portal</p>
          </div>
        </div>
        <div className="bg-white p-8 rounded-2xl shadow-xl">
          <form className="space-y-6" action={login}>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                name="email"
                className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
                placeholder="e.g., seller@example.com"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                name="password"
                className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <SubmitButton />
            {message && (
              <p className="mt-4 p-4 bg-foreground/10 text-red-500 text-center rounded-md">
                {message}
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
