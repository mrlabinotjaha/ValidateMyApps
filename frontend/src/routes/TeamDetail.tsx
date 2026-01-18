import { useState, useEffect, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Plus, AppWindow, Users, Settings, LayoutGrid, List, Grid2X2, Grid3X3, ThumbsUp, Clock, Pin, PinOff, FolderKanban, LogIn, Lightbulb } from 'lucide-react'
import type { User } from '../lib/auth'
import type { Team, App } from '../lib/types'
import { usePinnedTeam } from '../lib/pinnedTeam'
import ThemeToggle from '../components/ThemeToggle'
import NavUser from '../components/NavUser'
import NotificationBell from '../components/NotificationBell'
import { Card } from '../components/ui/card'
import AppCard from '../components/AppCard'
import { api, getImageUrl } from '../lib/api'

type GridSize = 3 | 4 | 5
type ViewMode = 'grid' | 'list'

interface TeamDetailProps {
  user: User | null
}

export default function TeamDetail({ user }: TeamDetailProps) {
  const { id } = useParams<{ id: string }>()
  const { pinnedTeam, pinTeam, unpinTeam, isPinned } = usePinnedTeam()

  // View controls
  const [groupByCreator, setGroupByCreator] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('teamViewMode')
      return (saved as ViewMode) || 'grid'
    }
    return 'grid'
  })
  const [gridSize, setGridSize] = useState<GridSize>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('teamGridSize')
      return (saved ? parseInt(saved) : 3) as GridSize
    }
    return 3
  })

  useEffect(() => {
    localStorage.setItem('teamViewMode', viewMode)
  }, [viewMode])

  useEffect(() => {
    localStorage.setItem('teamGridSize', gridSize.toString())
  }, [gridSize])

  const gridClasses: Record<GridSize, string> = {
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-1 md:grid-cols-3 lg:grid-cols-5',
  }
  
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

  const isLoading = teamLoading || appsLoading
  const isOwner = team?.owner_id === user?.id

  // Group apps by creator
  const groupedApps = useMemo(() => {
    if (!apps || !groupByCreator) return null

    const groups: Record<string, App[]> = {}

    apps.forEach((app: App) => {
      const creatorName =
        app.creator?.full_name || app.creator?.username || 'Unknown'
      if (!groups[creatorName]) {
        groups[creatorName] = []
      }
      groups[creatorName].push(app)
    })

    return groups
  }, [apps, groupByCreator])

  // List item component for list view
  const AppListItem = ({ app, user: currentUser }: { app: App; user: User | null }) => {
    const isMyApp = currentUser && app.creator_id === currentUser.id
    const ownerLabel = isMyApp
      ? 'ME'
      : app.creator?.full_name || app.creator?.username || 'Unknown'
    const progressValue = app.progress ?? 0

    const getStatusColor = (status: string) => {
      switch (status) {
        case 'completed':
          return 'bg-green-500/20 text-green-400 border-green-500/30'
        case 'beta':
          return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
        default:
          return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      }
    }

    const getPlaceholderColor = (appId: string) => {
      const colors = [
        'bg-blue-500/20',
        'bg-purple-500/20',
        'bg-pink-500/20',
        'bg-orange-500/20',
        'bg-green-500/20',
        'bg-cyan-500/20',
        'bg-indigo-500/20',
        'bg-rose-500/20',
      ]
      const hash = appId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
      return colors[hash % colors.length]
    }

    const firstLetter = app.name?.charAt(0)?.toUpperCase() || 'A'
    const showPlaceholder = !app.images?.[0]

    return (
      <Link to={`/apps/${app.id}`} className="block">
        <Card
          className={`hover:border-primary/50 hover:shadow-md transition-all p-4 ${
            isMyApp ? 'border-primary/30 bg-primary/5' : ''
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
                by {ownerLabel} • {app.short_description}
              </p>
            </div>

            {/* Progress */}
            <div className="hidden sm:flex items-center gap-2 w-32 flex-shrink-0">
              <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    progressValue >= 80
                      ? 'bg-green-500'
                      : progressValue >= 50
                      ? 'bg-yellow-500'
                      : 'bg-primary'
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
                  app.status || 'in_development'
                )}`}
              >
                {app.status?.replace('_', ' ').toUpperCase() || 'IN DEVELOPMENT'}
              </span>
            </div>

            {/* Votes */}
            <div className="hidden lg:flex items-center gap-1 text-sm text-muted-foreground flex-shrink-0 w-20">
              <ThumbsUp className="w-4 h-4" />
              <span className="font-medium text-foreground">
                {app.vote_count > 0 ? '+' : ''}
                {app.vote_count || 0}
              </span>
            </div>

            {/* Date */}
            <div className="hidden xl:flex items-center gap-1 text-sm text-muted-foreground flex-shrink-0">
              <Clock className="w-4 h-4" />
              {app.created_at ? new Date(app.created_at).toLocaleDateString() : 'N/A'}
            </div>
          </div>
        </Card>
      </Link>
    )
  }

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

  const isTeamPinned = isPinned(team.id)

  return (
    <div className="min-h-screen bg-background">
      {/* Main Header */}
      <nav className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-6">
              <Link to="/" className="text-xl font-bold text-foreground">
                App Showcase
              </Link>
              <div className="hidden sm:flex items-center gap-4">
                <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
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
                    className={`text-sm transition-colors inline-flex items-center gap-1 px-2 py-1 rounded-md border ${
                      pinnedTeam.id === team.id
                        ? 'bg-primary/20 border-primary/40 text-primary font-medium'
                        : 'bg-primary/10 border-primary/20 text-muted-foreground hover:text-foreground'
                    }`}
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

      {/* Subheader - Team Navigation */}
      <div className="bg-card/50 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-12">
            <div className="flex items-center gap-4">
              <Link 
                to="/projects" 
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Link>
              <div className="h-4 w-px bg-border" />
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <span className="font-semibold text-foreground">{team.name}</span>
                {/* Pin/Unpin Button */}
                <button
                  onClick={() => isTeamPinned ? unpinTeam() : pinTeam(team)}
                  className={`p-1 rounded-md transition-colors ${
                    isTeamPinned 
                      ? 'bg-primary/20 text-primary hover:bg-primary/30' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                  title={isTeamPinned ? 'Unpin team' : 'Pin team to header'}
                >
                  {isTeamPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground hidden md:block">
                {team.member_count || 0} members • {apps.length} apps
              </span>
              {isOwner && (
                <Link
                  to={`/teams/${id}/settings`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-border bg-card hover:bg-muted rounded-md transition-colors"
                >
                  <Settings className="w-3.5 h-3.5" />
                  Settings
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

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

          {/* Apps Section */}
          <div>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
              <h2 className="text-2xl font-semibold text-foreground">Apps</h2>
              
              <div className="flex items-center gap-3">
                {/* Group by Creator Toggle */}
                <button
                  onClick={() => setGroupByCreator(!groupByCreator)}
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    groupByCreator
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                  title="Group by creator"
                >
                  <Users className="w-4 h-4" />
                  <span className="hidden sm:inline">Group by Creator</span>
                </button>

                {/* View Controls */}
                <div className="flex items-center gap-2">
                  {/* View Mode Toggle */}
                  <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded-md transition-colors ${
                        viewMode === 'grid'
                          ? 'bg-background text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                      title="Grid view"
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded-md transition-colors ${
                        viewMode === 'list'
                          ? 'bg-background text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                      title="List view"
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Grid Size Selector (only show in grid mode) */}
                  {viewMode === 'grid' && (
                    <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
                      <button
                        onClick={() => setGridSize(3)}
                        className={`p-2 rounded-md transition-colors ${
                          gridSize === 3
                            ? 'bg-background text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                        title="3 per row"
                      >
                        <Grid2X2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setGridSize(4)}
                        className={`p-2 rounded-md transition-colors ${
                          gridSize === 4
                            ? 'bg-background text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                        title="4 per row"
                      >
                        <Grid3X3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setGridSize(5)}
                        className={`p-2 rounded-md transition-colors ${
                          gridSize === 5
                            ? 'bg-background text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                        title="5 per row"
                      >
                        <LayoutGrid className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {isOwner && (
                  <Link
                    to={`/apps/new?team_id=${id}`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    New App
                  </Link>
                )}
              </div>
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
            ) : groupByCreator && groupedApps ? (
              // Grouped view
              <div className="space-y-8">
                {Object.entries(groupedApps).map(
                  ([creatorName, creatorApps]) => (
                    <div key={creatorName}>
                      <h3 className="text-xl font-bold text-foreground mb-4">
                        {creatorName}: all apps ({creatorApps.length})
                      </h3>
                      {viewMode === 'grid' ? (
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
            ) : viewMode === 'grid' ? (
              <div className={`grid ${gridClasses[gridSize]} gap-6`}>
                {apps.map((app: App) => (
                  <AppCard key={app.id} app={app} user={user} />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {apps.map((app: App) => (
                  <AppListItem key={app.id} app={app} user={user} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
