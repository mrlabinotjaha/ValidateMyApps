import { useState, useRef, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Plus, AppWindow, Users, Settings, Trash2, ChevronDown } from 'lucide-react'
import type { User } from '../lib/auth'
import type { Team, App } from '../lib/types'
import ThemeToggle from '../components/ThemeToggle'
import { Card } from '../components/ui/card'
import AppCard from '../components/AppCard'
import { api } from '../lib/api'

interface TeamDetailProps {
  user: User | null
}

export default function TeamDetail({ user }: TeamDetailProps) {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const settingsDropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsDropdownRef.current && !settingsDropdownRef.current.contains(event.target as Node)) {
        setSettingsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
  // Fetch team
  const { data: team, isLoading: teamLoading } = useQuery({
    queryKey: ['team', id],
    queryFn: async () => {
      const response = await api.get(`/teams/${id}`)
      return response.data as Team
    },
    enabled: !!id,
  })

  // Fetch apps in this team
  const { data: apps = [], isLoading: appsLoading } = useQuery({
    queryKey: ['apps', 'team', id],
    queryFn: async () => {
      const response = await api.get('/apps', { params: { team_id: id } })
      return response.data as App[]
    },
    enabled: !!id,
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

  const handleDeleteTeam = () => {
    setDeleteError('')
    deleteTeamMutation.mutate()
  }

  const isLoading = teamLoading || appsLoading
  const isOwner = team?.owner_id === user?.id

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center text-muted-foreground">Loading team...</div>
      </div>
    )
  }

  if (!team) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Team Not Found</h1>
          <Link to="/projects" className="text-primary hover:underline">Back to Teams</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-4">
              <Link 
                to="/projects" 
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Link>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                <h1 className="text-xl font-bold text-foreground">{team.name}</h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Team Info */}
          <Card className="p-6">
            <p className="text-muted-foreground mb-4">{team.description || 'No description'}</p>
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>Created by {isOwner ? 'ME' : (team.owner.full_name || team.owner.username)}</span>
                <span>•</span>
                <span>Updated {new Date(team.updated_at).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {team.member_count || 0} members
                </span>
                <span className="inline-flex items-center gap-1">
                  <AppWindow className="w-4 h-4" />
                  {apps.length} apps
                </span>
              </div>
            </div>
          </Card>


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
                    onClick={handleDeleteTeam}
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

          {/* Apps Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-foreground">Apps</h2>
              {isOwner && (
                <div className="flex items-center gap-2">
                  <Link
                    to={`/apps/new?team_id=${id}`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    New App
                  </Link>
                  
                  {/* Settings Dropdown */}
                  <div className="relative" ref={settingsDropdownRef}>
                    <button
                      onClick={() => setSettingsOpen(!settingsOpen)}
                      className="inline-flex items-center gap-2 px-4 py-2 border border-border bg-card hover:bg-muted rounded-lg transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      <ChevronDown className={`w-4 h-4 transition-transform ${settingsOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Dropdown Menu */}
                    {settingsOpen && (
                      <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-lg shadow-lg py-1 z-50">
                        <button
                          onClick={() => {
                            setShowDeleteConfirm(true)
                            setSettingsOpen(false)
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-destructive hover:bg-destructive/10 transition-colors flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete Team
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {apps.length === 0 ? (
              <Card className="p-12 text-center">
                <AppWindow className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                  {isOwner 
                    ? "No apps yet. Create your first app to get started."
                    : "No apps in this team yet."
                  }
                </p>
                {isOwner && (
                  <Link
                    to={`/apps/new?team_id=${id}`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Create App
                  </Link>
                )}
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {apps.map((app: App) => (
                  <AppCard key={app.id} app={app} user={user} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
