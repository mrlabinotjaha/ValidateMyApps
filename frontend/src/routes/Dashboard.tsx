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
} from "lucide-react";
import { api } from "../lib/api";
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
                  src={
                    app.images[0].image_url.startsWith("data:") ||
                    app.images[0].image_url.startsWith("http")
                      ? app.images[0].image_url
                      : `http://localhost:8000${app.images[0].image_url}`
                  }
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
                by {ownerLabel} • {app.short_description}
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
                <Link to="/" className="text-sm font-medium text-foreground">
                  Public Apps
                </Link>
                <Link
                  to="/projects"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
                >
                  <FolderKanban className="w-4 h-4" />
                  Team Projects
                </Link>
                <Link
                  to="/requests"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
                >
                  <Lightbulb className="w-4 h-4" />
                  App Requests
                </Link>
                {pinnedTeam && (
                  <Link
                    to={`/teams/${pinnedTeam.id}`}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1 px-2 py-1 bg-primary/10 rounded-md border border-primary/20"
                  >
                    <Pin className="w-3 h-3 text-primary" />
                    <span className="text-primary font-medium">{pinnedTeam.name}</span>
                  </Link>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
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
          <div className="mb-6 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
            {/* Search */}
            <div className="relative w-48 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search apps..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-card text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-ring"
              />
            </div>

            {/* View Controls + New App Button */}
            <div className="flex items-center gap-3">
              {/* Group by Creator Toggle */}
              <button
                onClick={() => setGroupByCreator(!groupByCreator)}
                className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  groupByCreator
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
                title="Group by creator"
              >
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">Group by Creator</span>
              </button>

              {/* View Mode Toggle */}
              <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === "grid"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  title="Grid view"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === "list"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  title="List view"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              {/* Grid Size Selector (only show in grid mode) */}
              {viewMode === "grid" && (
                <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
                  <button
                    onClick={() => setGridSize(3)}
                    className={`p-2 rounded-md transition-colors ${
                      gridSize === 3
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    title="3 per row"
                  >
                    <Grid2X2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setGridSize(4)}
                    className={`p-2 rounded-md transition-colors ${
                      gridSize === 4
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    title="4 per row"
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setGridSize(5)}
                    className={`p-2 rounded-md transition-colors ${
                      gridSize === 5
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    title="5 per row"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* New App Button */}
              {user && (
                <Link
                  to="/apps/new"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  New App
                </Link>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              Loading...
            </div>
          ) : apps && apps.length > 0 ? (
            groupByCreator && groupedApps ? (
              // Grouped view
              <div className="space-y-8">
                {Object.entries(groupedApps).map(
                  ([creatorName, creatorApps]) => (
                    <div key={creatorName}>
                      <h2 className="text-2xl font-bold text-foreground mb-4">
                        {creatorName}: all apps ({creatorApps.length})
                      </h2>
                      {viewMode === "grid" ? (
                        <div className={`grid ${gridClasses[gridSize]} gap-6`}>
                          {creatorApps.map((app: App) => (
                            <AppCard key={app.id} app={app} user={user} />
                          ))}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {creatorApps.map((app: App) => (
                            <AppListItem key={app.id} app={app} user={user} />
                          ))}
                        </div>
                      )}
                    </div>
                  )
                )}
              </div>
            ) : viewMode === "grid" ? (
              // Ungrouped grid view
              <div className={`grid ${gridClasses[gridSize]} gap-6`}>
                {apps.map((app: App) => (
                  <AppCard key={app.id} app={app} user={user} />
                ))}
              </div>
            ) : (
              // Ungrouped list view
              <div className="space-y-2">
                {apps.map((app: App) => (
                  <AppListItem key={app.id} app={app} user={user} />
                ))}
              </div>
            )
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              No apps found.{" "}
              {user && (
                <Link to="/apps/new" className="text-primary hover:underline">
                  Create one!
                </Link>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
