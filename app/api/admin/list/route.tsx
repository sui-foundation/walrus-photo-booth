import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET() {
  try {
    console.log("➡️ Starting GET /api/admin/list");

    // Query the list of admins from the 'admins' table
    const { data: admins, error: fetchError } = await supabase
      .from("admins")
      .select("id, email, role");

    if (fetchError) {
      console.error("❌ Error fetching admin list:", fetchError.message);
      return NextResponse.json(
        {
          message: "Error fetching admin list!",
          error: fetchError.message,
        },
        { status: 500 }
      );
    }

    console.log("✅ Admin list:", admins);

    return NextResponse.json({ admins }, { status: 200 });
  } catch (error) {
    console.error("❗ Unexpected error:", error);
    return NextResponse.json(
      { message: "An unexpected error occurred!" },
      { status: 500 }
    );
  }
}