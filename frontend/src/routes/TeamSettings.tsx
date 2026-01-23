import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Users, Trash2, Mail, UserPlus, X, Crown, Shield, User as UserIcon, AlertTriangle, FolderKanban, LogIn, Pin, Settings, Lightbulb } from 'lucide-react'
import type { User } from '../lib/auth'
import type { Team, TeamMember, TeamInvitation } from '../lib/types'
import { usePinnedTeam } from '../lib/pinnedTeam'
import ThemeToggle from '../components/ThemeToggle'
import NavUser from '../components/NavUser'
import Logo from '../components/Logo'
import { Card } from '../components/ui/card'
import { api } from '../lib/api'

interface TeamSettingsProps {
  user: User | null
}

export default function TeamSettings({ user }: TeamSettingsProps) {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { pinnedTeam } = usePinnedTeam()

  // Members section state
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteError, setInviteError] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  // Fetch team
  const { data: team, isLoading: teamLoading } = useQuery({
    queryKey: ['team', id],
    queryFn: async () => {
      const response = await api.get(`/teams/${id}`)
      return response.data as Team
    },
    enabled: !!id,
  })

  // Fetch team members
  const { data: members = [] } = useQuery({
    queryKey: ['team', id, 'members'],
    queryFn: async () => {
      const response = await api.get(`/teams/${id}/members`)
      return response.data as TeamMember[]
    },
    enabled: !!id && !!user,
  })

  // Fetch team invitations
  const { data: invitations = [] } = useQuery({
    queryKey: ['team', id, 'invitations'],
    queryFn: async () => {
      const response = await api.get(`/teams/${id}/invitations`)
      return response.data as TeamInvitation[]
    },
    enabled: !!id && !!user,
  })

  // Invite member mutation
  const inviteMutation = useMutation({
    mutationFn: async (email: string) => {
      return api.post(`/teams/${id}/invitations`, { email })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team', id, 'invitations'] })
      setInviteEmail('')
      setInviteError('')
    },
    onError: (error: any) => {
      setInviteError(error.response?.data?.detail || 'Failed to send invitation')
    },
  })

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      return api.delete(`/teams/${id}/members/${memberId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team', id, 'members'] })
      queryClient.invalidateQueries({ queryKey: ['team', id] })
    },
  })

  // Cancel invitation mutation
  const cancelInvitationMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      return api.delete(`/teams/${id}/invitations/${invitationId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team', id, 'invitations'] })
    },
  })

  // Delete team mutation
  const deleteTeamMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/teams/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] })
      navigate('/projects')
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Failed to delete team'
      setDeleteError(message)
    },
  })

  const isOwner = team?.owner_id === user?.id

  if (teamLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (!team) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Team Not Found</h1>
          <Link to="/team" className="text-primary hover:underline">Back to Teams</Link>
        </div>
      </div>
    )
  }

  if (!isOwner) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-4">Only team owners can access settings.</p>
          <Link to={`/team/${id}`} className="text-primary hover:underline">Back to Team</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Main Header */}
      <nav className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-6">
              <Logo />
              <div className="hidden sm:flex items-center gap-4">
                <Link
                  to="/team"
                  className="text-sm font-medium text-foreground inline-flex items-center gap-1"
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
                  className={`text-sm transition-colors inline-flex items-center gap-1 px-2 py-1 rounded-md border ${
                    pinnedTeam.id === id
                      ? 'bg-primary/20 border-primary/40 text-primary font-medium'
                      : 'bg-primary/10 border-primary/20 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Pin className="w-3 h-3 text-primary" />
                  <span className="text-primary font-medium">{pinnedTeam.name}</span>
                </Link>
              )}
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

      {/* Subheader - Team Settings Navigation */}
      <div className="bg-card/50 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-12">
            <div className="flex items-center gap-4">
              <Link 
                to={`/team/${id}`}
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Team
              </Link>
              <div className="h-4 w-px bg-border" />
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-primary" />
                <span className="font-semibold text-foreground">Settings</span>
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-muted-foreground">{team.name}</span>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">

        <div className="space-y-6">
          {/* Members Section */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2 mb-6">
              <Users className="w-5 h-5 text-primary" />
              Members ({members.length})
            </h2>

            {/* Invite Form */}
            <div className="pb-6 border-b border-border mb-6">
              <label className="text-sm font-medium text-foreground mb-2 block">
                Invite new member
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => {
                    setInviteEmail(e.target.value)
                    setInviteError('')
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && inviteEmail.trim()) {
                      inviteMutation.mutate(inviteEmail.trim())
                    }
                  }}
                  placeholder="Enter email address..."
                  className="flex-1 px-3 py-2 bg-secondary rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                />
                <button
                  onClick={() => {
                    if (inviteEmail.trim()) {
                      inviteMutation.mutate(inviteEmail.trim())
                    }
                  }}
                  disabled={!inviteEmail.trim() || inviteMutation.isPending}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 inline-flex items-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  {inviteMutation.isPending ? 'Sending...' : 'Invite'}
                </button>
              </div>
              {inviteError && (
                <p className="text-sm text-destructive mt-2">{inviteError}</p>
              )}
            </div>

            {/* Pending Invitations */}
            {invitations.filter(inv => inv.status === 'pending').length > 0 && (
              <div className="space-y-2 mb-6">
                <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Pending Invitations ({invitations.filter(inv => inv.status === 'pending').length})
                </h3>
                {invitations
                  .filter(inv => inv.status === 'pending')
                  .map((invitation) => (
                    <div
                      key={invitation.id}
                      className="flex items-center justify-between p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                          <Mail className="w-5 h-5 text-yellow-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{invitation.email}</p>
                          <p className="text-xs text-muted-foreground">
                            Invited {new Date(invitation.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => cancelInvitationMutation.mutate(invitation.id)}
                        disabled={cancelInvitationMutation.isPending}
                        className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                        title="Cancel invitation"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
              </div>
            )}

            {/* Members List */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                Team Members
              </h3>
              {members.map((member) => (
                <div
                  key={member.id}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    member.role === 'owner' ? 'bg-primary/10 border border-primary/20' : 'bg-secondary/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      member.role === 'owner' ? 'bg-primary/20' : 
                      member.role === 'admin' ? 'bg-blue-500/20' : 'bg-muted'
                    }`}>
                      {member.role === 'owner' ? (
                        <Crown className="w-5 h-5 text-primary" />
                      ) : member.role === 'admin' ? (
                        <Shield className="w-5 h-5 text-blue-500" />
                      ) : (
                        <UserIcon className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground">
                          {member.user.full_name || member.user.username}
                        </p>
                        {member.user_id === user?.id && (
                          <span className="px-1.5 py-0.5 rounded bg-primary/20 text-primary text-[10px] font-medium">
                            YOU
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground capitalize">
                        {member.role} • Joined {new Date(member.joined_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {member.role !== 'owner' && (
                    <button
                      onClick={() => {
                        if (confirm(`Remove ${member.user.full_name || member.user.username} from the team?`)) {
                          removeMemberMutation.mutate(member.id)
                        }
                      }}
                      disabled={removeMemberMutation.isPending}
                      className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                      title="Remove member"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* Danger Zone */}
          <Card className="p-6 border-destructive/30">
            <h2 className="text-xl font-semibold text-destructive flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5" />
              Danger Zone
            </h2>
            <p className="text-muted-foreground text-sm mb-4">
              Deleting the team will permanently remove all apps, members, and data associated with it.
              This action cannot be undone.
            </p>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors inline-flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete Team
            </button>
          </Card>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md p-6 m-4">
              <h3 className="text-lg font-semibold text-foreground mb-2">Delete Team</h3>
              <p className="text-muted-foreground mb-4">
                Are you sure you want to delete <strong>{team.name}</strong>? This will permanently delete:
              </p>
              <ul className="text-sm text-muted-foreground mb-4 list-disc list-inside space-y-1">
                <li>All apps in this team</li>
                <li>All team members and invitations</li>
                <li>All associated data</li>
              </ul>
              <p className="text-destructive text-sm font-medium mb-4">
                This action cannot be undone.
              </p>
              {deleteError && (
                <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
                  {deleteError}
                </div>
              )}
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false)
                    setDeleteError('')
                  }}
                  className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
                  disabled={deleteTeamMutation.isPending}
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteTeamMutation.mutate()}
                  disabled={deleteTeamMutation.isPending}
                  className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors disabled:opacity-50 inline-flex items-center gap-2"
                >
                  {deleteTeamMutation.isPending ? (
                    <>
                      <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Delete Team
                    </>
                  )}
                </button>
              </div>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}
