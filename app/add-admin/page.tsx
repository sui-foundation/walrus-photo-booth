"use client";

import { useState } from "react";
import UnifiedHeader from "@/components/UnifiedHeader";

export default function AddAdminPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    try {
      const res = await fetch("/api/add-admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setMessage("Admin added successfully.");
        setEmail("");
      } else {
        const errorData = await res.json();
        setMessage(errorData.message || "An error occurred.");
      }
    } catch (error) {
      console.error(error);
      setMessage("An error occurred.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-r from-blue-500 to-purple-600">
      <UnifiedHeader variant="page" title="ADD ADMIN" showBack={true} />
      <div className="flex flex-1 items-center justify-center">
        <div className="p-8 bg-white rounded-xl shadow-lg w-full max-w-md">
          <h1 className="text-3xl font-neuebit text-center text-gray-800 mb-6">
            Add Admin
          </h1>
          <form onSubmit={handleSubmit}>
            <label className="block text-sm font-neuemontreal text-gray-700 mb-2">
              Admin Email
            </label>
            <input
              type="email"
              placeholder="Enter admin email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              required
            />
            <button className="bg-blue-600 text-white font-neuemontreal w-full py-2 rounded-lg hover:bg-blue-700 transition duration-300">
              Add Admin
            </button>
          </form>
          {message && (
            <p
              className={`mt-4 text-center text-sm font-neuemontreal ${
                message.includes("successfully")
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {message}
            </p>
          )}
          <button className="mt-6 bg-gray-200 text-gray-800 font-neuemontreal w-full py-2 rounded-lg hover:bg-gray-300 transition duration-300">
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}