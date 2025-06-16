import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";


const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

export async function POST(req: Request) {
  const body = await req.json();
  const { emailToDelete } = body;


  const token = req.headers.get("Authorization")?.split(" ")[1];
  if (!token) {
    return NextResponse.json({ message: "You are not logged in!" }, { status: 401 });
  }

  const { data: user, error: userError } = await supabase.auth.getUser(token);
  if (userError || !user) {
    return NextResponse.json({ message: "Invalid token!" }, { status: 403 });
  }

  const { data: adminData, error: adminError } = await supabase
    .from("admins")
    .select("role")
    .eq("email", user.user.email)
    .single();

  if (adminError || adminData?.role !== "super_admin") {
    return NextResponse.json({ message: "You do not have permission to perform this action!" }, { status: 403 });
  }

  const { error: deleteError } = await supabase
    .from("admins")
    .delete()
    .eq("email", emailToDelete);

  if (deleteError) {
    return NextResponse.json({ message: "Error deleting user!", error: deleteError }, { status: 500 });
  }

  return NextResponse.json({ message: "User deleted successfully!" }, { status: 200 });
}