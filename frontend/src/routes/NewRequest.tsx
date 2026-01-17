import { useState } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Lightbulb, Mail, Users, FolderKanban, Pin } from 'lucide-react'
import { api } from '../lib/api'
import type { User } from '../lib/auth'
import type { Team } from '../lib/types'
import { usePinnedTeam } from '../lib/pinnedTeam'
import ThemeToggle from '../components/ThemeToggle'
import NavUser from '../components/NavUser'
import NotificationBell from '../components/NotificationBell'
import { Card } from '../components/ui/card'

interface NewRequestProps {
  user: User
}

export default function NewRequest({ user }: NewRequestProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { pinnedTeam } = usePinnedTeam()
  const [searchParams] = useSearchParams()
  const teamIdFromUrl = searchParams.get('team_id')

  const [formData, setFormData] = useState({
    name: '',
    short_description: '',
    description: '',
    assigned_email: '',
    team_id: teamIdFromUrl || '',
  })
  const [error, setError] = useState('')

  // Fetch user's teams
  const { data: teams = [] } = useQuery({
    queryKey: ['my-teams'],
    queryFn: async () => {
      const response = await api.get('/teams')
      return response.data as Team[]
    },
  })

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const payload = {
        name: data.name,
        short_description: data.short_description,
        description: data.description || null,
        assigned_email: data.assigned_email || null,
        team_id: data.team_id || null,
      }
      const response = await api.post('/app-requests', payload)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-requests'] })
      navigate('/requests')
    },
    onError: (err: any) => {
      const errorData = err.response?.data
      if (errorData?.detail) {
        setError(typeof errorData.detail === 'string' ? errorData.detail : 'Failed to create request')
      } else {
        setError('Failed to create request')
      }
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.name.trim()) {
      setError('Name is required')
      return
    }
    if (!formData.short_description.trim()) {
      setError('Short description is required')
      return
    }

    createMutation.mutate(formData)
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
                  className="text-sm font-medium text-foreground inline-flex items-center gap-1"
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
              <NotificationBell />
              <NavUser user={user} />
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            to="/requests"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Requests
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Request New App</h1>
          <p className="text-muted-foreground">
            Describe the app you'd like to see built. Others can claim and work on it.
          </p>
        </div>

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                App Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Task Manager, Weather App"
                className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-ring"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Short Description *
              </label>
              <input
                type="text"
                value={formData.short_description}
                onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                placeholder="Brief summary of what the app should do"
                maxLength={200}
                className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-ring"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                {formData.short_description.length}/200 characters
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Full Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detailed description of features, requirements, and use cases..."
                rows={6}
                className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-ring resize-none"
              />
            </div>

            <div className="border-t border-border pt-6">
              <h3 className="text-sm font-medium text-foreground mb-4">Optional Settings</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    <Mail className="w-4 h-4 inline mr-2" />
                    Assign to Email
                  </label>
                  <input
                    type="email"
                    value={formData.assigned_email}
                    onChange={(e) => setFormData({ ...formData, assigned_email: e.target.value })}
                    placeholder="developer@example.com"
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-ring"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Assign this request to a specific person. Leave empty to let anyone claim it.
                  </p>
                </div>

                {teams.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      <Users className="w-4 h-4 inline mr-2" />
                      Team
                    </label>
                    <select
                      value={formData.team_id}
                      onChange={(e) => setFormData({ ...formData, team_id: e.target.value })}
                      className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-ring"
                    >
                      <option value="">No team (public request)</option>
                      {teams.map((team) => (
                        <option key={team.id} value={team.id}>
                          {team.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => navigate('/requests')}
                className="flex-1 px-4 py-2 border border-border rounded-lg text-foreground hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                <Lightbulb className="w-4 h-4" />
                {createMutation.isPending ? 'Creating...' : 'Create Request'}
              </button>
            </div>
          </form>
        </Card>
      </main>
    </div>
  )
}
