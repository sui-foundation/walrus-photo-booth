import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Create Supabase client with Service Role Key (only used on the server)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_KEY! // SERVICE ROLE KEY - never expose on the client!
);

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