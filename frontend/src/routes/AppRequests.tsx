import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Plus,
  Lightbulb,
  Clock,
  User,
  CheckCircle,
  XCircle,
  Play,
  FolderKanban,
  LogIn,
  Pin,
} from 'lucide-react'
import { api } from '../lib/api'
import type { User as UserType } from '../lib/auth'
import { usePinnedTeam } from '../lib/pinnedTeam'
import ThemeToggle from '../components/ThemeToggle'
import NavUser from '../components/NavUser'
import NotificationBell from '../components/NotificationBell'
import Logo from '../components/Logo'
import { Card } from '../components/ui/card'

interface AppRequest {
  id: string
  name: string
  description?: string
  status: 'open' | 'assigned' | 'in_progress' | 'completed' | 'cancelled'
  requester: {
    id: string
    username: string
    full_name?: string
    avatar_url?: string
  }
  assignee?: {
    id: string
    username: string
    full_name?: string
    avatar_url?: string
  }
  assigned_email?: string
  team?: {
    id: string
    name: string
  }
  created_at: string
}

interface AppRequestsProps {
  user: UserType | null
}

const statusConfig = {
  open: { label: 'Open', color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: Lightbulb },
  assigned: { label: 'Assigned', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: User },
  in_progress: { label: 'In Progress', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: Play },
  completed: { label: 'Completed', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: XCircle },
}

export default function AppRequests({ user }: AppRequestsProps) {
  const [filter, setFilter] = useState<'all' | 'open' | 'my_requests' | 'assigned_to_me'>('all')
  const { pinnedTeam } = usePinnedTeam()

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['app-requests', filter],
    queryFn: async () => {
      const params: Record<string, string> = {}
      if (filter === 'open') params.status = 'open'
      if (filter === 'my_requests') params.my_requests = 'true'
      if (filter === 'assigned_to_me') params.assigned_to_me = 'true'
      const response = await api.get('/app-requests', { params })
      return response.data as AppRequest[]
    },
  })

  return (
    <div className="min-h-screen bg-background">
      <nav className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-6">
              <Logo />
              <div className="hidden sm:flex items-center gap-4">
                <Link
                  to="/team"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
                >
                  <FolderKanban className="w-4 h-4" />
                  Teams
                </Link>
                <Link
                  to="/requests"
                  className="text-sm font-medium text-foreground inline-flex items-center gap-1"
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

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">App Requests</h1>
            <p className="text-muted-foreground">Browse ideas or request a new app to be built</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                  filter === 'all'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('open')}
                className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                  filter === 'open'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Open
              </button>
              {user && (
                <>
                  <button
                    onClick={() => setFilter('my_requests')}
                    className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                      filter === 'my_requests'
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    My Requests
                  </button>
                  <button
                    onClick={() => setFilter('assigned_to_me')}
                    className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                      filter === 'assigned_to_me'
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Assigned to Me
                  </button>
                </>
              )}
            </div>

            {user && (
              <Link
                to="/requests/new"
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Plus className="w-4 h-4" />
                New Request
              </Link>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        ) : requests.length === 0 ? (
          <Card className="p-12 text-center">
            <Lightbulb className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No requests found</h3>
            <p className="text-muted-foreground mb-4">
              {filter === 'open'
                ? 'No open requests available right now.'
                : filter === 'my_requests'
                ? "You haven't created any requests yet."
                : filter === 'assigned_to_me'
                ? "No requests are assigned to you."
                : 'Be the first to request a new app!'}
            </p>
            {user && (
              <Link
                to="/requests/new"
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create Request
              </Link>
            )}
          </Card>
        ) : (
          <div className="grid gap-4">
            {requests.map((request) => {
              const StatusIcon = statusConfig[request.status].icon
              const isMyRequest = user && request.requester.id === user.id

              return (
                <Link key={request.id} to={`/requests/${request.id}`}>
                  <Card className="p-4 hover:border-primary/50 hover:shadow-md transition-all">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Lightbulb className="w-5 h-5 text-primary" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold text-foreground truncate">
                            {request.name}
                          </h3>
                          {isMyRequest && (
                            <span className="px-1.5 py-0.5 rounded bg-primary/20 text-primary text-[10px] font-medium">
                              YOUR REQUEST
                            </span>
                          )}
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-medium border ${
                              statusConfig[request.status].color
                            }`}
                          >
                            <StatusIcon className="w-3 h-3 inline mr-1" />
                            {statusConfig[request.status].label}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                          {request.description}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {request.requester.full_name || request.requester.username}
                          </span>
                          {request.team && (
                            <span className="inline-flex items-center gap-1">
                              <FolderKanban className="w-3 h-3" />
                              {request.team.name}
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(request.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {request.assignee && (
                        <div className="flex-shrink-0 text-right">
                          <p className="text-xs text-muted-foreground">Assigned to</p>
                          <p className="text-sm font-medium text-foreground">
                            {request.assignee.full_name || request.assignee.username}
                          </p>
                        </div>
                      )}
                      {!request.assignee && request.assigned_email && (
                        <div className="flex-shrink-0 text-right">
                          <p className="text-xs text-muted-foreground">Assigned to</p>
                          <p className="text-sm font-medium text-foreground">
                            {request.assigned_email}
                          </p>
                        </div>
                      )}
                    </div>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
