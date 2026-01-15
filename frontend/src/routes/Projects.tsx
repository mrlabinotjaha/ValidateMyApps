import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  FolderKanban,
  Users,
  Mail,
  Search,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import type { User } from "../lib/auth";
import type { Team } from "../lib/types";
import ThemeToggle from "../components/ThemeToggle";
import NavUser from "../components/NavUser";
import { Card } from "../components/ui/card";
import { api } from "../lib/api";

interface ProjectsProps {
  user: User | null;
}

export default function Projects({ user }: ProjectsProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();

  // Fetch teams (user's teams and pending invitations)
  const { data: teams = [], isLoading } = useQuery({
    queryKey: ["teams", "my"],
    queryFn: async () => {
      const response = await api.get("/teams", { params: { my_teams: true } });
      return response.data as Team[];
    },
    enabled: !!user,
  });

  // Accept invitation mutation
  const acceptInvitationMutation = useMutation({
    mutationFn: async ({
      teamId,
      invitationId,
    }: {
      teamId: string;
      invitationId: string;
    }) => {
      await api.post(`/teams/${teamId}/invitations/${invitationId}/accept`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams", "my"] });
    },
  });

  // Filter teams by search
  const filteredTeams = teams.filter((team: Team) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      team.name.toLowerCase().includes(query) ||
      team.description?.toLowerCase().includes(query) ||
      team.owner.full_name?.toLowerCase().includes(query) ||
      team.owner.username.toLowerCase().includes(query)
    );
  });

  // Separate teams by status
  const myTeams = filteredTeams.filter((t: Team) => !t.invitation_status);
  const pendingInvitations = filteredTeams.filter(
    (t: Team) => t.invitation_status === "pending"
  );

  const handleAcceptInvitation = async (team: Team) => {
    // Find the invitation ID - we'll need to fetch it or get it from the team data
    // For now, let's get invitations for this team
    try {
      const invitationsResponse = await api.get(
        `/teams/${team.id}/invitations`
      );
      const invitations = invitationsResponse.data;
      const pendingInv = invitations.find(
        (inv: any) => inv.status === "pending" && inv.email === user?.email
      );

      if (pendingInv) {
        acceptInvitationMutation.mutate({
          teamId: team.id,
          invitationId: pendingInv.id,
        });
      }
    } catch (error) {
      console.error("Error accepting invitation:", error);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">
            Please log in
          </h1>
          <Link to="/login" className="text-primary hover:underline">
            Go to login
          </Link>
        </div>
      </div>
    );
  }

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
                  to="/"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Public Apps
                </Link>
                <Link
                  to="/projects"
                  className="text-sm font-medium text-foreground"
                >
                  Team Projects
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <NavUser user={user} />
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">My Teams</h1>
          <p className="text-muted-foreground">
            Manage your teams and collaborate on projects
          </p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search teams..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-card text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-ring"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">
            Loading teams...
          </div>
        ) : (
          <>
            {/* Pending Invitations */}
            {pendingInvitations.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Mail className="w-5 h-5 text-yellow-500" />
                  Pending Invitations ({pendingInvitations.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {pendingInvitations.map((team: Team) => (
                    <Card
                      key={team.id}
                      className="p-6 border-yellow-500/30 bg-yellow-500/5"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                            <FolderKanban className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground">
                              {team.name}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                              by {team.owner.full_name || team.owner.username}
                            </p>
                          </div>
                        </div>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-600 text-xs">
                          <Mail className="w-3 h-3" />
                          Invited
                        </span>
                      </div>

                      {team.description && (
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                          {team.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                        <span className="inline-flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {team.member_count || 0} members
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <FolderKanban className="w-4 h-4" />
                          {team.app_count || team.project_count || 0} apps
                        </span>
                      </div>

                      <button
                        onClick={() => handleAcceptInvitation(team)}
                        disabled={acceptInvitationMutation.isPending}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        {acceptInvitationMutation.isPending
                          ? "Joining..."
                          : "Join Team"}
                      </button>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* My Teams */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                  <FolderKanban className="w-5 h-5 text-primary" />
                  My Teams ({myTeams.length})
                </h2>
                <Link
                  to="/teams/new"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  New Team
                </Link>
              </div>

              {myTeams.length === 0 ? (
                <div className="text-center py-12">
                  <FolderKanban className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">
                    {pendingInvitations.length > 0
                      ? "You don't have any teams yet. Accept an invitation above or create a new team."
                      : "You don't have any teams yet. Create your first team to get started."}
                  </p>
                  <Link
                    to="/teams/new"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Create Team
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {myTeams.map((team: Team) => (
                    <Link
                      key={team.id}
                      to={`/teams/${team.id}`}
                      className="block"
                    >
                      <Card
                        className={`p-6 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all ${
                          user && team.owner_id === user.id
                            ? "border-primary/30 bg-primary/5"
                            : ""
                        }`}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                                user && team.owner_id === user.id
                                  ? "bg-primary/20"
                                  : "bg-primary/10"
                              }`}
                            >
                              {user && team.owner_id === user.id ? (
                                <Users className="w-6 h-6 text-primary" />
                              ) : (
                                <FolderKanban className="w-6 h-6 text-primary" />
                              )}
                            </div>
                            <div>
                              <h3 className="font-semibold text-foreground">
                                {team.name}
                              </h3>
                              <p className="text-xs text-muted-foreground">
                                by{" "}
                                {user && team.owner_id === user.id
                                  ? "ME"
                                  : team.owner.full_name || team.owner.username}
                                {user && team.owner_id === user.id && (
                                  <span className="ml-1.5 px-1.5 py-0.5 rounded bg-primary/20 text-primary text-[10px] font-medium">
                                    YOU
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                        </div>

                        {team.description && (
                          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                            {team.description}
                          </p>
                        )}

                        <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                          <span className="inline-flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {team.member_count || 0} members
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <FolderKanban className="w-4 h-4" />
                            {team.app_count || 0} apps
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-border">
                          <span className="text-xs text-muted-foreground">
                            Updated{" "}
                            {new Date(team.updated_at).toLocaleDateString()}
                          </span>
                          <ArrowRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
