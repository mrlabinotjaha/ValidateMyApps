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
} from "lucide-react";
import { api } from "../lib/api";
import type { User } from "../lib/auth";
import type { App } from "../lib/types";
import ThemeToggle from "../components/ThemeToggle";
import NavUser from "../components/NavUser";
import AppCard from "../components/AppCard";

type GridSize = 3 | 4 | 5;

interface DashboardProps {
  user: User | null;
}

export default function Dashboard({ user }: DashboardProps) {
  const [search, setSearch] = useState("");
  const [groupByCreator, setGroupByCreator] = useState(false);
  const [gridSize, setGridSize] = useState<GridSize>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("gridSize");
      return (saved ? parseInt(saved) : 3) as GridSize;
    }
    return 3;
  });

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
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
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
            {/* Search + Controls */}
            <div className="flex items-center gap-3 flex-1">
              {/* Search */}
              <div className="relative w-48 sm:w-56">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search apps..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-card text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-ring"
                />
              </div>

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

              {/* Grid Size Selector */}
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
            </div>

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
                      <div className={`grid ${gridClasses[gridSize]} gap-6`}>
                        {creatorApps.map((app: App) => (
                          <AppCard key={app.id} app={app} user={user} />
                        ))}
                      </div>
                    </div>
                  )
                )}
              </div>
            ) : (
              // Ungrouped view
              <div className={`grid ${gridClasses[gridSize]} gap-6`}>
                {apps.map((app: App) => (
                  <AppCard key={app.id} app={app} user={user} />
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
