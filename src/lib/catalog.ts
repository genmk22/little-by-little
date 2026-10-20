export type MoodTag =
  | "anxious"
  | "stressed"
  | "low"
  | "depressed"
  | "unmotivated"
  | "lonely"
  | "left out"
  | "rejected"
  | "worthless"
  | "overwhelmed"
  | "angry"
  | "numb"
  | "grieving"
  | "suicidal thoughts"
  | "might hurt myself";

export type ActivityCategory = "grounding" | "movement" | "rest" | "food" | "connection" | "play" | "music" | "film";
export type Energy = "low" | "some" | "high";
export type Setting = "indoors" | "outdoors" | "either";
export type Social = "alone" | "someone" | "either";

export type CheckInAnswers = {
  energy: Energy;
  minutes: 5 | 15 | 30 | 60;
  setting: Setting;
  budget: "free" | "any";
  social: Social;
};

export type Activity = {
  id: string;
  title: string;
  description: string;
  category: ActivityCategory;
  duration: number;
  energy: Energy;
  cost: "free" | "optional";
  setting: Exclude<Setting, "either"> | "both";
  social: Social | "both";
  moods: MoodTag[];
  link?: { label: string; href: string };
};

export const moodOptions: { tag: MoodTag; label: string; icon: string }[] = [
  { tag: "anxious", label: "Anxious", icon: "〰" },
  { tag: "stressed", label: "Stressed", icon: "☁" },
  { tag: "low", label: "Low", icon: "☂" },
  { tag: "depressed", label: "Depressed", icon: "☾" },
  { tag: "unmotivated", label: "Unmotivated", icon: "◌" },
  { tag: "lonely", label: "Lonely", icon: "♡" },
  { tag: "left out", label: "Left out", icon: "◉" },
  { tag: "rejected", label: "Rejected or unwanted", icon: "♡" },
  { tag: "worthless", label: "Worthless", icon: "✳" },
  { tag: "overwhelmed", label: "Overwhelmed", icon: "≋" },
  { tag: "angry", label: "Angry", icon: "⚡" },
  { tag: "numb", label: "Numb", icon: "○" },
  { tag: "grieving", label: "Grieving", icon: "✿" },
  { tag: "suicidal thoughts", label: "Thinking about suicide", icon: "!" },
  { tag: "might hurt myself", label: "I might hurt myself", icon: "!" },
];

export const activities: Activity[] = [
  {
    id: "five-senses",
    title: "Come back to this moment",
    description: "Name five things you can see, four you can feel, three you can hear, two you can smell, and one you can taste. Go slowly; you can stop at any point.",
    category: "grounding", duration: 5, energy: "low", cost: "free", setting: "both", social: "alone",
    moods: ["anxious", "stressed", "overwhelmed", "angry", "numb", "suicidal thoughts", "might hurt myself"],
  },
  {
    id: "long-exhale",
    title: "Try a slower exhale",
    description: "If it feels comfortable, breathe in gently and let the breath out a little longer. Repeat a few times. Return to normal breathing whenever you want.",
    category: "grounding", duration: 5, energy: "low", cost: "free", setting: "both", social: "alone",
    moods: ["anxious", "stressed", "overwhelmed", "angry"],
  },
  {
    id: "water-break",
    title: "Get a glass of water",
    description: "Take a few sips and notice the temperature. A small, caring thing counts, even if it is the only thing you do right now.",
    category: "rest", duration: 5, energy: "low", cost: "free", setting: "indoors", social: "alone",
    moods: ["low", "depressed", "unmotivated", "overwhelmed", "numb", "grieving", "worthless"],
  },
  {
    id: "window-reset",
    title: "Change your view for a minute",
    description: "Open a window or sit somewhere with a different view. Let your eyes rest on something far away and notice the light around you.",
    category: "rest", duration: 5, energy: "low", cost: "free", setting: "indoors", social: "alone",
    moods: ["low", "stressed", "unmotivated", "overwhelmed", "numb"],
  },
  {
    id: "soft-song",
    title: "Put on one gentle song",
    description: "Choose a song that meets you where you are. You do not need to feel better by the end; just let it keep you company.",
    category: "music", duration: 5, energy: "low", cost: "free", setting: "both", social: "alone",
    moods: ["low", "depressed", "lonely", "left out", "rejected", "grieving", "numb", "worthless"],
    link: { label: "Find a gentle playlist", href: "https://open.spotify.com/search/gentle%20acoustic" },
  },
  {
    id: "walk-around",
    title: "Take a tiny walk",
    description: "Walk to the end of your street, around the room, or just stand outside for a moment. Any distance is enough; coming back early is okay.",
    category: "movement", duration: 15, energy: "some", cost: "free", setting: "outdoors", social: "either",
    moods: ["stressed", "low", "unmotivated", "overwhelmed", "angry"],
  },
  {
    id: "stretch-gently",
    title: "Stretch where you are",
    description: "Roll your shoulders, uncurl your hands, or stretch in a way that feels kind to your body. Skip anything uncomfortable.",
    category: "movement", duration: 5, energy: "some", cost: "free", setting: "indoors", social: "alone",
    moods: ["stressed", "anxious", "overwhelmed", "angry", "numb"],
  },
  {
    id: "comfort-food",
    title: "Make something easy to eat",
    description: "If you can, choose a familiar snack or simple meal. It does not need to be impressive. Ask someone nearby if getting food feels hard.",
    category: "food", duration: 15, energy: "some", cost: "optional", setting: "indoors", social: "either",
    moods: ["low", "unmotivated", "overwhelmed", "grieving", "worthless"],
  },
  {
    id: "text-someone",
    title: "Send a low-pressure message",
    description: "Try: “I’ve had a rough day. Could you keep me company for a bit?” You can choose someone you trust, and you do not have to explain everything.",
    category: "connection", duration: 5, energy: "low", cost: "free", setting: "both", social: "someone",
    moods: ["lonely", "left out", "rejected", "low", "depressed", "grieving", "worthless", "suicidal thoughts", "might hurt myself"],
  },
  {
    id: "sit-together",
    title: "Be near another person",
    description: "If someone feels safe to be around, sit together, call them, or share a quiet activity. You do not need to talk about how you feel.",
    category: "connection", duration: 30, energy: "low", cost: "free", setting: "both", social: "someone",
    moods: ["lonely", "left out", "rejected", "grieving", "low", "depressed", "numb"],
  },
  {
    id: "tiny-game",
    title: "Play something with no stakes",
    description: "Try a familiar puzzle, a cozy game, or a short round of something you already enjoy. It is okay to stop whenever it stops feeling fun.",
    category: "play", duration: 15, energy: "some", cost: "free", setting: "indoors", social: "alone",
    moods: ["unmotivated", "low", "depressed", "lonely", "left out", "rejected", "stressed"],
    link: { label: "Browse free browser puzzles", href: "https://www.chess.com/puzzles" },
  },
  {
    id: "comfort-film",
    title: "Watch a familiar comfort film",
    description: "Pick something you already know and like. Familiar stories can ask less of you than finding something new.",
    category: "film", duration: 60, energy: "low", cost: "optional", setting: "indoors", social: "either",
    moods: ["low", "depressed", "lonely", "left out", "rejected", "grieving", "unmotivated", "numb"],
    link: { label: "Browse feel-good film picks", href: "https://letterboxd.com/films/genre/comedy/by/rating/" },
  },
  {
    id: "body-double",
    title: "Do one small thing alongside someone",
    description: "Ask a friend to sit on a call while you tidy one corner, shower, or start a task. Company can be quiet; you set the pace.",
    category: "connection", duration: 15, energy: "some", cost: "free", setting: "both", social: "someone",
    moods: ["unmotivated", "overwhelmed", "lonely", "left out", "rejected", "low", "depressed", "worthless"],
  },
  {
    id: "outside-sit",
    title: "Sit outside for a little while",
    description: "If it is safe and accessible, sit on a step, balcony, bench, or by an open door. Notice one ordinary thing around you.",
    category: "rest", duration: 15, energy: "low", cost: "free", setting: "outdoors", social: "alone",
    moods: ["low", "stressed", "grieving", "overwhelmed", "numb"],
  },
  {
    id: "small-clean",
    title: "Reset one tiny corner",
    description: "Choose one surface or one item. Set a five-minute limit and stop when it ends. You do not need to finish the whole room.",
    category: "movement", duration: 15, energy: "some", cost: "free", setting: "indoors", social: "alone",
    moods: ["overwhelmed", "unmotivated", "stressed", "worthless"],
  },
  {
    id: "calm-music",
    title: "Find music for the mood you are in",
    description: "Choose music that feels supportive rather than demanding. Search for a calm instrumental mix or an artist you trust.",
    category: "music", duration: 15, energy: "low", cost: "free", setting: "both", social: "either",
    moods: ["anxious", "stressed", "low", "overwhelmed", "angry"],
    link: { label: "Browse calm instrumental music", href: "https://music.youtube.com/search?q=calm+instrumental+music" },
  },
  {
    id: "trusted-person-now",
    title: "Reach a person who can stay with you",
    description: "If you may hurt yourself, tell someone nearby plainly: “I might not be safe alone right now. Can you stay with me and help me get support?”",
    category: "connection", duration: 5, energy: "low", cost: "free", setting: "both", social: "someone",
    moods: ["suicidal thoughts", "might hurt myself"],
  },
];

const crisisTags: MoodTag[] = ["suicidal thoughts", "might hurt myself"];
export const hasCrisisTag = (tags: MoodTag[]) => tags.some((tag) => crisisTags.includes(tag));

export function getRecommendations(tags: MoodTag[], answers: CheckInAnswers, limit = 3): Activity[] {
  const crisis = hasCrisisTag(tags);
  const scored = activities.map((activity) => {
    const moodScore = activity.moods.reduce((sum, mood) => sum + (tags.includes(mood) ? 2 : 0), 0);
    const matchesSetting = answers.setting === "either" || activity.setting === "both" || activity.setting === answers.setting;
    const matchesSocial = answers.social === "either" || activity.social === "both" || activity.social === answers.social;
    const matchesEnergy = answers.energy === activity.energy || answers.energy === "some" || activity.energy === "low";
    const fitsTime = activity.duration <= answers.minutes;
    const fitsCost = answers.budget === "any" || activity.cost === "free";
    const safeForCrisis = !crisis || activity.category === "grounding" || activity.id === "text-someone" || activity.id === "trusted-person-now";
    const score = moodScore + (matchesSetting ? 1 : 0) + (matchesSocial ? 1 : 0) + (matchesEnergy ? 1 : 0) + (fitsTime ? 1 : 0) + (fitsCost ? 1 : 0);
    return { activity, score, matchesSetting, matchesSocial, fitsTime, fitsCost, safeForCrisis };
  });
  const filtered = scored
    .filter((item) => item.safeForCrisis && item.matchesSetting && item.matchesSocial && item.fitsTime && item.fitsCost)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.activity);
  const fallback = scored
    .filter((item) => item.safeForCrisis && item.fitsCost && item.matchesSetting)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.activity);
  const result = filtered.length ? filtered : fallback;
  return result.slice(0, limit);
}

export const validMoodTags = new Set<MoodTag>(moodOptions.map(({ tag }) => tag));
export const validActivityIds = new Set(activities.map(({ id }) => id));
