import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Lightbulb,
  User,
  Clock,
  Mail,
  Play,
  CheckCircle,
  XCircle,
  Trash2,
  FolderKanban,
  ExternalLink,
  MessageSquare,
  Check,
  X,
  Users,
  Pin,
} from 'lucide-react'
import { api } from '../lib/api'
import type { User as UserType } from '../lib/auth'
import { usePinnedTeam } from '../lib/pinnedTeam'
import ThemeToggle from '../components/ThemeToggle'
import NavUser from '../components/NavUser'
import NotificationBell from '../components/NotificationBell'
import { Card } from '../components/ui/card'

interface ClaimRequest {
  id: string
  app_request_id: string
  claimer_id: string
  claimer: {
    id: string
    username: string
    full_name?: string
    avatar_url?: string
  }
  message?: string
  status: 'pending' | 'approved' | 'denied'
  created_at: string
}

interface AppRequest {
  id: string
  name: string
  short_description: string
  description?: string
  status: 'open' | 'assigned' | 'in_progress' | 'completed' | 'cancelled'
  requester_id: string
  requester: {
    id: string
    username: string
    full_name?: string
    avatar_url?: string
  }
  assignee_id?: string
  assignee?: {
    id: string
    username: string
    full_name?: string
    avatar_url?: string
  }
  assigned_email?: string
  app_id?: string
  app?: {
    id: string
    name: string
  }
  team?: {
    id: string
    name: string
  }
  pending_claims_count?: number
  created_at: string
  updated_at: string
}

interface RequestDetailProps {
  user: UserType | null
}

const statusConfig = {
  open: { label: 'Open', color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: Lightbulb },
  assigned: { label: 'Assigned', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: User },
  in_progress: { label: 'In Progress', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: Play },
  completed: { label: 'Completed', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: XCircle },
}

export default function RequestDetail({ user }: RequestDetailProps) {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { pinnedTeam } = usePinnedTeam()
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [showClaimModal, setShowClaimModal] = useState(false)
  const [assignEmail, setAssignEmail] = useState('')
  const [claimMessage, setClaimMessage] = useState('')

  const { data: request, isLoading } = useQuery({
    queryKey: ['app-request', id],
    queryFn: async () => {
      const response = await api.get(`/app-requests/${id}`)
      return response.data as AppRequest
    },
    enabled: !!id,
  })

  const isRequester = user && request?.requester_id === user.id

  // Fetch claim requests (only for requester)
  const { data: claimRequests = [] } = useQuery({
    queryKey: ['claim-requests', id],
    queryFn: async () => {
      const response = await api.get(`/app-requests/${id}/claims`)
      return response.data as ClaimRequest[]
    },
    enabled: !!id && !!isRequester,
  })

  const pendingClaims = claimRequests.filter(c => c.status === 'pending')

  const requestClaimMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await api.post(`/app-requests/${id}/claim`, { message: message || null })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-request', id] })
      setShowClaimModal(false)
      setClaimMessage('')
    },
  })

  const approveClaimMutation = useMutation({
    mutationFn: async (claimId: string) => {
      const response = await api.post(`/app-requests/${id}/claims/${claimId}/approve`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-request', id] })
      queryClient.invalidateQueries({ queryKey: ['claim-requests', id] })
    },
  })

  const denyClaimMutation = useMutation({
    mutationFn: async (claimId: string) => {
      const response = await api.post(`/app-requests/${id}/claims/${claimId}/deny`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['claim-requests', id] })
    },
  })

  const assignMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await api.post(`/app-requests/${id}/assign`, { email })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-request', id] })
      setShowAssignModal(false)
      setAssignEmail('')
    },
  })

  const cancelMutation = useMutation({
    mutationFn: async () => {
      const response = await api.put(`/app-requests/${id}`, { status: 'cancelled' })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-request', id] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/app-requests/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-requests'] })
      navigate('/requests')
    },
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Request Not Found</h1>
          <Link to="/requests" className="text-primary hover:underline">
            Back to Requests
          </Link>
        </div>
      </div>
    )
  }

  const isAssignee = user && request.assignee_id === user.id
  const canRequestClaim = user && request.status === 'open' && !isRequester
  const canAssign = isRequester && request.status === 'open'
  const canCancel = isRequester && ['open', 'assigned'].includes(request.status)
  const canDelete = isRequester

  const StatusIcon = statusConfig[request.status].icon

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
              {user && <NotificationBell />}
              {user ? (
                <NavUser user={user} />
              ) : (
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <Link
          to="/requests"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Requests
        </Link>

        <Card className="p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Lightbulb className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">{request.name}</h1>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${
                    statusConfig[request.status].color
                  }`}
                >
                  <StatusIcon className="w-3 h-3" />
                  {statusConfig[request.status].label}
                </span>
              </div>
            </div>

            {isRequester && (
              <div className="flex items-center gap-2">
                {canDelete && (
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this request?')) {
                        deleteMutation.mutate()
                      }
                    }}
                    className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                    title="Delete request"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>

          <p className="text-lg text-muted-foreground mb-4">{request.short_description}</p>

          {request.description && (
            <div className="prose prose-sm max-w-none text-foreground mb-6">
              <p className="whitespace-pre-wrap">{request.description}</p>
            </div>
          )}

          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground border-t border-border pt-4">
            <span className="inline-flex items-center gap-1">
              <User className="w-4 h-4" />
              Requested by {request.requester.full_name || request.requester.username}
            </span>
            {request.team && (
              <span className="inline-flex items-center gap-1">
                <FolderKanban className="w-4 h-4" />
                {request.team.name}
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {new Date(request.created_at).toLocaleDateString()}
            </span>
          </div>
        </Card>

        {/* Pending Claims (only for requester) */}
        {isRequester && pendingClaims.length > 0 && (
          <Card className="p-4 mb-6 border-yellow-500/30 bg-yellow-500/5">
            <h3 className="text-sm font-medium text-yellow-400 mb-3 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Pending Claim Requests ({pendingClaims.length})
            </h3>
            <div className="space-y-3">
              {pendingClaims.map((claim) => (
                <div
                  key={claim.id}
                  className="flex items-start justify-between p-3 bg-card rounded-lg border border-border"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {claim.claimer.full_name || claim.claimer.username}
                      </p>
                      {claim.message && (
                        <p className="text-sm text-muted-foreground mt-1 flex items-start gap-1">
                          <MessageSquare className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          {claim.message}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(claim.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => approveClaimMutation.mutate(claim.id)}
                      disabled={approveClaimMutation.isPending}
                      className="p-2 text-green-500 hover:bg-green-500/10 rounded-lg transition-colors"
                      title="Approve"
                    >
                      <Check className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => denyClaimMutation.mutate(claim.id)}
                      disabled={denyClaimMutation.isPending}
                      className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Deny"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Assignment Info */}
        {(request.assignee || request.assigned_email) && (
          <Card className="p-4 mb-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Assigned To</h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">
                  {request.assignee
                    ? request.assignee.full_name || request.assignee.username
                    : request.assigned_email}
                </p>
                {request.assigned_email && !request.assignee && (
                  <p className="text-xs text-muted-foreground">Pending acceptance</p>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Completed App Link */}
        {request.status === 'completed' && request.app && (
          <Card className="p-4 mb-6 border-green-500/30 bg-green-500/5">
            <h3 className="text-sm font-medium text-green-400 mb-2">Completed App</h3>
            <Link
              to={`/apps/${request.app.id}`}
              className="inline-flex items-center gap-2 text-foreground hover:text-primary transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              {request.app.name}
            </Link>
          </Card>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          {canRequestClaim && (
            <button
              onClick={() => setShowClaimModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Play className="w-4 h-4" />
              Request to Work on This
            </button>
          )}

          {canAssign && (
            <button
              onClick={() => setShowAssignModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
            >
              <Mail className="w-4 h-4" />
              Assign to Someone
            </button>
          )}

          {canCancel && (
            <button
              onClick={() => {
                if (confirm('Are you sure you want to cancel this request?')) {
                  cancelMutation.mutate()
                }
              }}
              disabled={cancelMutation.isPending}
              className="inline-flex items-center gap-2 px-4 py-2 border border-destructive/30 text-destructive rounded-lg hover:bg-destructive/10 transition-colors"
            >
              <XCircle className="w-4 h-4" />
              Cancel Request
            </button>
          )}

          {isAssignee && ['assigned', 'in_progress'].includes(request.status) && (
            <Link
              to={`/apps/new?from_request=${request.id}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              Create App & Complete
            </Link>
          )}
        </div>

        {/* Claim Modal */}
        {showClaimModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="p-6 w-full max-w-md mx-4">
              <h2 className="text-lg font-semibold text-foreground mb-2">Request to Claim</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Your request will be sent to the requester for approval.
              </p>
              <div className="mb-4">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Message (optional)
                </label>
                <textarea
                  value={claimMessage}
                  onChange={(e) => setClaimMessage(e.target.value)}
                  placeholder="Tell them why you'd like to work on this..."
                  rows={3}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-ring resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowClaimModal(false)
                    setClaimMessage('')
                  }}
                  className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => requestClaimMutation.mutate(claimMessage)}
                  disabled={requestClaimMutation.isPending}
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {requestClaimMutation.isPending ? 'Sending...' : 'Send Request'}
                </button>
              </div>
            </Card>
          </div>
        )}

        {/* Assign Modal */}
        {showAssignModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="p-6 w-full max-w-md mx-4">
              <h2 className="text-lg font-semibold text-foreground mb-4">Assign Request</h2>
              <div className="mb-4">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={assignEmail}
                  onChange={(e) => setAssignEmail(e.target.value)}
                  placeholder="developer@example.com"
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-ring"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowAssignModal(false)
                    setAssignEmail('')
                  }}
                  className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => assignMutation.mutate(assignEmail)}
                  disabled={!assignEmail || assignMutation.isPending}
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {assignMutation.isPending ? 'Assigning...' : 'Assign'}
                </button>
              </div>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}
