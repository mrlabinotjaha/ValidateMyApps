import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  LayoutGrid,
  Grid3X3,
  Grid2X2,
  LogIn,
  Plus,
  Users,
  FolderKanban,
  List,
  ThumbsUp,
  Clock,
  Pin,
  Lightbulb,
  Globe,
} from "lucide-react";
import { api, getImageUrl } from "../lib/api";
import type { User } from "../lib/auth";
import type { App } from "../lib/types";
import { usePinnedTeam } from "../lib/pinnedTeam";
import ThemeToggle from "../components/ThemeToggle";
import NavUser from "../components/NavUser";
import NotificationBell from "../components/NotificationBell";
import AppCard from "../components/AppCard";
import { Card } from "../components/ui/card";

type GridSize = 3 | 4 | 5;
type ViewMode = "grid" | "list";

interface DashboardProps {
  user: User | null;
}

export default function Dashboard({ user }: DashboardProps) {
  const [search, setSearch] = useState("");
  const [groupByCreator, setGroupByCreator] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("viewMode");
      return (saved as ViewMode) || "grid";
    }
    return "grid";
  });
  const [gridSize, setGridSize] = useState<GridSize>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("gridSize");
      return (saved ? parseInt(saved) : 3) as GridSize;
    }
    return 3;
  });

  useEffect(() => {
    localStorage.setItem("viewMode", viewMode);
  }, [viewMode]);

  useEffect(() => {
    localStorage.setItem("gridSize", gridSize.toString());
  }, [gridSize]);

  const gridClasses: Record<GridSize, string> = {
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
    5: "grid-cols-1 md:grid-cols-3 lg:grid-cols-5",
  };

  const { data: apps, isLoading } = useQuery({
    queryKey: ["apps", search],
    queryFn: async () => {
      const params = search ? { search } : {};
      const response = await api.get("/apps", { params });
      return response.data as App[];
    },
  });

  // Group apps by creator
  const groupedApps = useMemo(() => {
    if (!apps || !groupByCreator) return null;

    const groups: Record<string, App[]> = {};

    apps.forEach((app: App) => {
      const creatorName =
        app.creator?.full_name || app.creator?.username || "Unknown";
      if (!groups[creatorName]) {
        groups[creatorName] = [];
      }
      groups[creatorName].push(app);
    });

    return groups;
  }, [apps, groupByCreator]);

  // List item component for list view
  const AppListItem = ({ app, user: currentUser }: { app: App; user: User | null }) => {
    const isMyApp = currentUser && app.creator_id === currentUser.id;
    const ownerLabel = isMyApp
      ? "ME"
      : app.creator?.full_name || app.creator?.username || "Unknown";
    const progressValue = app.progress ?? 0;

    const getStatusColor = (status: string) => {
      switch (status) {
        case "completed":
          return "bg-green-500/20 text-green-400 border-green-500/30";
        case "beta":
          return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
        default:
          return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      }
    };

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
      const hash = appId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
      return colors[hash % colors.length];
    };

    const firstLetter = app.name?.charAt(0)?.toUpperCase() || "A";
    const showPlaceholder = !app.images?.[0];

    return (
      <Link to={`/apps/${app.id}`} className="block">
        <Card
          className={`hover:border-primary/50 hover:shadow-md transition-all p-4 ${
            isMyApp ? "border-primary/30 bg-primary/5" : ""
          }`}
        >
          <div className="flex items-center gap-4">
            {/* Image/Icon */}
            <div className="flex-shrink-0">
              {showPlaceholder ? (
                <div
                  className={`w-12 h-12 rounded-lg flex items-center justify-center ${getPlaceholderColor(app.id)}`}
                >
                  <span className="text-lg font-bold text-foreground">{firstLetter}</span>
                </div>
              ) : (
                <img
                  src={getImageUrl(app.images[0].image_url)}
                  alt={app.name}
                  className="w-12 h-12 rounded-lg object-cover"
                />
              )}
            </div>

            {/* Name & Creator */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-foreground truncate">{app.name}</h3>
                {isMyApp && (
                  <span className="px-1.5 py-0.5 rounded bg-primary/20 text-primary text-[10px] font-medium flex-shrink-0">
                    YOU
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground truncate">
                by {ownerLabel} • {app.full_description}
              </p>
            </div>

            {/* Progress */}
            <div className="hidden sm:flex items-center gap-2 w-32 flex-shrink-0">
              <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    progressValue >= 80
                      ? "bg-green-500"
                      : progressValue >= 50
                      ? "bg-yellow-500"
                      : "bg-primary"
                  }`}
                  style={{ width: `${progressValue}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground w-8">{progressValue}%</span>
            </div>

            {/* Status */}
            <div className="hidden md:block flex-shrink-0">
              <span
                className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(
                  app.status || "in_development"
                )}`}
              >
                {app.status?.replace("_", " ").toUpperCase() || "IN DEVELOPMENT"}
              </span>
            </div>

            {/* Votes */}
            <div className="hidden lg:flex items-center gap-1 text-sm text-muted-foreground flex-shrink-0 w-20">
              <ThumbsUp className="w-4 h-4" />
              <span className="font-medium text-foreground">
                {app.vote_count > 0 ? "+" : ""}
                {app.vote_count || 0}
              </span>
            </div>

            {/* Date */}
            <div className="hidden xl:flex items-center gap-1 text-sm text-muted-foreground flex-shrink-0">
              <Clock className="w-4 h-4" />
              {app.created_at ? new Date(app.created_at).toLocaleDateString() : "N/A"}
            </div>
          </div>
        </Card>
      </Link>
    );
  };

  const { pinnedTeam } = usePinnedTeam();

  return (
    <div className="min-h-screen bg-background">
      <nav className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-6">
              <Link to="/" className="text-xl font-bold text-foreground">
                App Showcase
              </Link>
              <div className="hidden sm:flex items-center gap-4">
                <Link
                  to="/teams"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
                >
                  <FolderKanban className="w-4 h-4" />
                  Teams
                </Link>
                <Link
                  to="/requests"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
                >
                  <Lightbulb className="w-4 h-4" />
                  App Requests
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {pinnedTeam && (
                <Link
                  to={`/team/${pinnedTeam.id}`}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1 px-2 py-1 bg-primary/10 rounded-md border border-primary/20"
                >
                  <Pin className="w-3 h-3 text-primary" />
                  <span className="text-primary font-medium">{pinnedTeam.name}</span>
                </Link>
              )}
              <ThemeToggle />
              {user && <NotificationBell />}
              {user ? (
                <NavUser user={user} />
              ) : (
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-[1600px] mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6">
              <FolderKanban className="w-12 h-12 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-4">Public Apps Coming Soon</h1>
            <p className="text-muted-foreground mb-8 max-w-md">
              We're working on something exciting. In the meantime, check out Team Projects or App Requests.
            </p>
            <div className="flex gap-4">
              <Link
                to="/teams"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                <FolderKanban className="w-5 h-5" />
                Team Projects
              </Link>
              <Link
                to="/requests"
                className="inline-flex items-center gap-2 px-6 py-3 border border-border rounded-lg hover:bg-muted transition-colors"
              >
                <Lightbulb className="w-5 h-5" />
                App Requests
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
