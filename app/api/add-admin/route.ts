import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_KEY!
);

export async function POST(req: Request) {
  const body = await req.json();
  const { email, role } = body;

  const { data: existingAdmin } = await supabase
    .from('admins')
    .select('*')
    .eq('email', email)
    .single();

  if (existingAdmin) {
    return NextResponse.json({ message: 'Email này đã tồn tại!' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('admins')
    .insert([{ email, role: role || 'admin' }]);

  if (error) {
    return NextResponse.json({ message: 'Lỗi khi thêm Admin mới!', error }, { status: 500 });
  }

  return NextResponse.json({ message: 'Admin mới đã được thêm!', data }, { status: 201 });
}