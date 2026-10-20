import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "History needs Supabase setup." }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to delete a saved check-in." }, { status: 401 });
  const { id } = await context.params;
  const { data, error } = await supabase.from("mood_sessions").delete().eq("id", id).select("id").maybeSingle();
  if (error) return NextResponse.json({ error: "Could not delete this check-in." }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Check-in not found." }, { status: 404 });
  return NextResponse.json({ deleted: true });
}
