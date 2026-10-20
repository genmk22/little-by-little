import { NextResponse } from "next/server";
import { validActivityIds, validMoodTags, type MoodTag } from "@/lib/catalog";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "History needs Supabase setup." }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to view saved check-ins." }, { status: 401 });
  const { data, error } = await supabase
    .from("mood_sessions")
    .select("id, created_at, mood_tags, activity_ids")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) return NextResponse.json({ error: "Could not load saved check-ins." }, { status: 500 });
  return NextResponse.json({ sessions: data ?? [] }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "History needs Supabase setup." }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in before saving a check-in." }, { status: 401 });

  try {
    const body = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body) || Object.keys(body).some((key) => !["moodTags", "activityIds"].includes(key))) {
      return NextResponse.json({ error: "Only mood tags and selected activity IDs can be saved." }, { status: 400 });
    }
    const { moodTags, activityIds } = body as { moodTags?: unknown; activityIds?: unknown };
    if (!Array.isArray(moodTags) || moodTags.length < 1 || moodTags.length > 8 || !moodTags.every((tag) => typeof tag === "string" && validMoodTags.has(tag as MoodTag))) {
      return NextResponse.json({ error: "Choose one to eight valid mood tags." }, { status: 400 });
    }
    if (!Array.isArray(activityIds) || activityIds.length < 1 || activityIds.length > 5 || !activityIds.every((id) => typeof id === "string" && validActivityIds.has(id))) {
      return NextResponse.json({ error: "Choose valid activities to save." }, { status: 400 });
    }
    const { data, error } = await supabase
      .from("mood_sessions")
      .insert({ user_id: user.id, mood_tags: moodTags, activity_ids: activityIds })
      .select("id, created_at, mood_tags, activity_ids")
      .single();
    if (error) return NextResponse.json({ error: "Could not save this check-in." }, { status: 500 });
    return NextResponse.json({ session: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Please try saving again." }, { status: 400 });
  }
}
