"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_KEY!
);

interface Props {
  currentUserEmail: string;
}

export const AddAdminButton = ({ currentUserEmail }: Props) => {
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkSuperAdmin = async () => {
      const { data, error } = await supabase
        .from("admins")
        .select("role")
        .eq("email", currentUserEmail)
        .single();

      if (error) {
        console.error("Error checking admin role:", error);
        return;
      }

      if (data?.role === "super_admin") {
        setIsSuperAdmin(true);
      }
    };

    if (currentUserEmail) {
      checkSuperAdmin();
    }
  }, [currentUserEmail]);

  if (!isSuperAdmin) return null;

  return (
    <div className="flex gap-4">
      <button
        onClick={() => router.push("/add-admin")}
        className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
      >
        Add Admin
      </button>
      <button
        onClick={() => router.push("/manage/users")}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        ADMIN PANEL
      </button>
    </div>
  );
};