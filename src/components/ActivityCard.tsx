import { ArrowUpRight, Clock3, Leaf } from "lucide-react";
import type { Activity } from "@/lib/catalog";

const categoryNames: Record<Activity["category"], string> = {
  grounding: "A moment to ground",
  movement: "Gentle movement",
  rest: "A little rest",
  food: "Nourishment",
  connection: "Connection",
  play: "A small distraction",
  music: "Music",
  film: "Something to watch",
};

export function ActivityCard({ activity, index }: { activity: Activity; index: number }) {
  return (
    <article className={`activity-card activity-card-${index + 1}`}>
      <div className="activity-card-topline">
        <span className="activity-category"><Leaf size={14} aria-hidden="true" /> {categoryNames[activity.category]}</span>
        <span className="activity-time"><Clock3 size={14} aria-hidden="true" /> {activity.duration} min</span>
      </div>
      <h3>{activity.title}</h3>
      <p>{activity.description}</p>
      {activity.link ? (
        <a className="activity-link" href={activity.link.href} target="_blank" rel="noopener noreferrer">
          {activity.link.label} <ArrowUpRight size={15} aria-hidden="true" />
        </a>
      ) : (
        <span className="activity-offline">No special setup needed</span>
      )}
    </article>
  );
}
