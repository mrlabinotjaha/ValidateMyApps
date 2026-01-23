import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Save, FolderKanban, Mail, Plus, X, Lightbulb, Pin } from 'lucide-react'
import type { User } from '../lib/auth'
import { api } from '../lib/api'
import { usePinnedTeam } from '../lib/pinnedTeam'
import ThemeToggle from '../components/ThemeToggle'
import NavUser from '../components/NavUser'
import NotificationBell from '../components/NotificationBell'
import Logo from '../components/Logo'
import { Card } from '../components/ui/card'

interface NewTeamProps {
  user: User
}

export default function NewTeam({ user }: NewTeamProps) {
  const navigate = useNavigate()
  const { pinnedTeam } = usePinnedTeam()
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  })
  const [invitations, setInvitations] = useState<string[]>([])
  const [newInvitationEmail, setNewInvitationEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleAddInvitation = () => {
    if (!newInvitationEmail.trim()) return
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newInvitationEmail.trim())) {
      setError('Please enter a valid email address')
      return
    }
    
    // Check for duplicates
    if (invitations.includes(newInvitationEmail.trim().toLowerCase())) {
      setError('This email is already in the invitation list')
      return
    }
    
    setInvitations([...invitations, newInvitationEmail.trim().toLowerCase()])
    setNewInvitationEmail('')
    setError('')
  }

  const handleRemoveInvitation = (index: number) => {
    setInvitations(invitations.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      setError('Team name is required')
      return
    }
    
    setLoading(true)
    setError('')
    
    try {
      const teamData = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        initial_invitations: invitations.length > 0 ? invitations : undefined,
      }
      
      const response = await api.post('/teams', teamData)
      const teamId = response.data.id
      
      // Navigate to the newly created team
      navigate(`/team/${teamId}`)
    } catch (err: any) {
      const errorData = err.response?.data;
      if (errorData) {
        if (Array.isArray(errorData.detail)) {
          const errorMessages = errorData.detail.map((e: any) => 
            `${e.loc?.join('.')}: ${e.msg}`
          ).join(', ');
          setError(errorMessages || 'Validation error');
        } else if (errorData.detail) {
          setError(errorData.detail);
        } else {
          setError('Failed to create team');
        }
      } else {
        setError(err.message || 'Failed to create team');
      }
    } finally {
      setLoading(false)
    }
  }

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
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1 px-2 py-1 bg-primary/10 rounded-md border border-primary/20"
                >
                  <Pin className="w-3 h-3 text-primary" />
                  <span className="text-primary font-medium">{pinnedTeam.name}</span>
                </Link>
              )}
              <ThemeToggle />
              <NotificationBell />
              <NavUser user={user} />
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto py-8 px-4">
        <div className="mb-6">
          <Link
            to="/team"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Create Team</h1>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Team Details</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Team Name *
                </label>
                <input
                  type="text"
                  placeholder="My Awesome Team"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe your team..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground resize-none"
                />
              </div>
            </div>
          </Card>

          {/* Invitations Section */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary" />
              Invite Team Members (Optional)
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Add email addresses to invite people to your team. They'll receive an invitation they can accept.
            </p>
            
            {/* Add Invitation */}
            <div className="flex gap-2 mb-4">
              <input
                type="email"
                placeholder="Enter email address..."
                value={newInvitationEmail}
                onChange={(e) => {
                  setNewInvitationEmail(e.target.value)
                  setError('')
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddInvitation()
                  }
                }}
                className="flex-1 px-4 py-2 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
              />
              <button
                type="button"
                onClick={handleAddInvitation}
                disabled={!newInvitationEmail.trim()}
                className="px-4 py-2 bg-secondary text-foreground rounded-lg hover:bg-secondary/80 disabled:opacity-50 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            
            {/* Invitations List */}
            {invitations.length > 0 && (
              <div className="space-y-2">
                {invitations.map((email, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg border border-border bg-card"
                  >
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span className="text-foreground">{email}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveInvitation(index)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {invitations.length === 0 && (
              <p className="text-center text-muted-foreground py-4 text-sm">
                No invitations added yet. You can always invite members later from team settings.
              </p>
            )}
          </Card>

          <div className="flex justify-end gap-3">
            <Link
              to="/team"
              className="px-6 py-2 border border-border text-foreground rounded-lg hover:bg-secondary transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading || !formData.name.trim()}
              className="inline-flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Creating...' : 'Create Team'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
