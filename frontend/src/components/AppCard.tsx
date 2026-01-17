import { Link } from "react-router-dom";
import { useState } from "react";
import { ThumbsUp, AppWindow, Clock, User as UserIcon } from "lucide-react";
import { Card } from "./ui/card";
import type { App } from "../lib/types";
import type { User } from "../lib/auth";

interface AppCardProps {
  app: App;
  user?: User | null;
}

export default function AppCard({ app, user }: AppCardProps) {
  const isMyApp = user && app.creator_id === user.id;
  const ownerLabel = isMyApp
    ? "ME"
    : app.creator?.full_name || app.creator?.username || "Unknown";
  const progressValue = app.progress ?? 0;
  const [imageError, setImageError] = useState(false);

  // Generate consistent color from app ID
  const getPlaceholderColor = (appId: string) => {
    const colors = [
      "bg-blue-500/20",
      "bg-purple-500/20",
      "bg-pink-500/20",
      "bg-orange-500/20",
      "bg-green-500/20",
      "bg-cyan-500/20",
      "bg-indigo-500/20",
      "bg-rose-500/20",
    ];
    // Use app ID to consistently pick a color
    const hash = appId
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  // Get first letter of app name
  const firstLetter = app.name?.charAt(0)?.toUpperCase() || "A";

  // Determine if we should show placeholder (no image or image error)
  const showPlaceholder = !app.images?.[0] || imageError;

  return (
    <Link to={`/apps/${app.id}`} className="block">
      <Card
        className={`hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all p-6 ${
          isMyApp ? "border-primary/30 bg-primary/5" : ""
        }`}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {showPlaceholder ? (
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${getPlaceholderColor(
                  app.id
                )}`}
              >
                <span className="text-lg font-bold text-foreground">
                  {firstLetter}
                </span>
              </div>
            ) : (
              <img
                src={
                  app.images[0].image_url.startsWith("data:") ||
                  app.images[0].image_url.startsWith("http")
                    ? app.images[0].image_url
                    : `http://localhost:8000${app.images[0].image_url}`
                }
                alt={app.name}
                className="w-10 h-10 rounded-lg object-cover"
                onError={() => setImageError(true)}
              />
            )}
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                {app.name}
              </h3>
              <p className="text-xs text-muted-foreground">
                by
                {isMyApp && (
                  <span className="ml-1.5 px-1.5 py-0.5 rounded bg-primary/20 text-primary text-[10px] font-medium">
                    YOU
                  </span>
                )}
              </p>
            </div>
          </div>
          <span className="text-xs text-muted-foreground capitalize">
            {app.status?.replace("_", " ") || "Unknown"}
          </span>
        </div>

        <p className="text-muted-foreground text-sm line-clamp-2 mb-4 min-h-[40px]">
          {app.short_description}
        </p>

        {/* Progress */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-muted-foreground mb-1">
            <span>Progress</span>
            <span>{progressValue}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                progressValue >= 80
                  ? "bg-green-500"
                  : progressValue >= 50
                  ? "bg-yellow-500"
                  : "bg-primary"
              }`}
              style={{ width: `${progressValue}%` }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <ThumbsUp className="w-4 h-4" />
            {app.total_votes !== undefined && app.total_votes !== null ? (
              <>
                <span className="font-semibold text-foreground">
                  {app.vote_count > 0 ? "+" : app.vote_count < 0 ? "" : ""}
                  {app.vote_count}
                </span>
                <span className="text-muted-foreground">
                  ({app.total_votes} {app.total_votes === 1 ? "vote" : "votes"})
                </span>
              </>
            ) : typeof app.vote_count === "number" ? (
              <span>
                {app.vote_count > 0 ? "+" : ""}
                {app.vote_count}{" "}
                {Math.abs(app.vote_count) === 1 ? "vote" : "votes"}
              </span>
            ) : (
              <span>0 votes</span>
            )}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {app.created_at
              ? new Date(app.created_at).toLocaleDateString()
              : "N/A"}
          </span>
        </div>
      </Card>
    </Link>
  );
}
