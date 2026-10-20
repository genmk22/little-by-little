import { NextResponse } from "next/server";
import { getRecommendations, hasCrisisTag, validMoodTags, type CheckInAnswers, type MoodTag } from "@/lib/catalog";

const energies = new Set(["low", "some", "high"]);
const minutes = new Set([5, 15, 30, 60]);
const settings = new Set(["indoors", "outdoors", "either"]);
const budgets = new Set(["free", "any"]);
const socials = new Set(["alone", "someone", "either"]);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Please send your check-in choices." }, { status: 400 });
    }
    if (Object.keys(body).some((key) => !["moodTags", "answers"].includes(key))) {
      return NextResponse.json({ error: "Only mood tags and practical activity preferences are accepted." }, { status: 400 });
    }
    const { moodTags, answers } = body as { moodTags?: unknown; answers?: Partial<CheckInAnswers> };
    if (!Array.isArray(moodTags) || moodTags.length < 1 || moodTags.length > 8 || !moodTags.every((tag) => typeof tag === "string" && validMoodTags.has(tag as MoodTag))) {
      return NextResponse.json({ error: "Choose one to eight moods from the list." }, { status: 400 });
    }
    if (!answers || Object.keys(answers).some((key) => !["energy", "minutes", "setting", "budget", "social"].includes(key)) || !energies.has(String(answers.energy)) || !minutes.has(Number(answers.minutes)) || !settings.has(String(answers.setting)) || !budgets.has(String(answers.budget)) || !socials.has(String(answers.social))) {
      return NextResponse.json({ error: "Please complete the activity preferences." }, { status: 400 });
    }
    if (hasCrisisTag(moodTags as MoodTag[])) {
      return NextResponse.json({ recommendations: [], humanSupportFirst: true, source: "curated" }, { headers: { "Cache-Control": "no-store" } });
    }
    const recommendations = getRecommendations(moodTags as MoodTag[], answers as CheckInAnswers);
    return NextResponse.json({ recommendations, source: "curated" }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "We could not read those choices. Please try again." }, { status: 400 });
  }
}
