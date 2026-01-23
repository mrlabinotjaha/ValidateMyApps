import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  GitBranch,
  ExternalLink,
  Star,
  GitFork,
  AlertCircle,
  Code,
  Clock,
  ChevronDown,
  ChevronUp,
  Trash2,
  Pencil,
  Github,
  Link2,
  Key,
  Check,
  X
} from 'lucide-react'
import { api, API_BASE_URL } from '../lib/api'
import type { CommitsResponse, CommitInfo, GitHubStatus } from '../lib/types'
import { Card } from './ui/card'

interface RepositorySectionProps {
  appId: string
  repositoryUrl?: string
  isOwner: boolean
  hasGithubToken?: boolean
  onEditUrl?: () => void
  onDeleteUrl?: () => void
}

export default function RepositorySection({
  appId,
  repositoryUrl,
  isOwner,
  hasGithubToken = false,
  onEditUrl,
  onDeleteUrl
}: RepositorySectionProps) {
  const [showAllCommits, setShowAllCommits] = useState(false)
  const [showTokenInput, setShowTokenInput] = useState(false)
  const [tokenValue, setTokenValue] = useState('')
  const queryClient = useQueryClient()

  const setTokenMutation = useMutation({
    mutationFn: async (token: string) => {
      return api.post(`/apps/${appId}/github-token`, { token })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app', appId] })
      queryClient.invalidateQueries({ queryKey: ['commits', appId] })
      setShowTokenInput(false)
      setTokenValue('')
    }
  })

  const removeTokenMutation = useMutation({
    mutationFn: async () => {
      return api.delete(`/apps/${appId}/github-token`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app', appId] })
      queryClient.invalidateQueries({ queryKey: ['commits', appId] })
    }
  })

  const { data, isLoading, error } = useQuery({
    queryKey: ['commits', appId],
    queryFn: async () => {
      const response = await api.get(`/apps/${appId}/commits`)
      return response.data as CommitsResponse
    },
    enabled: !!repositoryUrl,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) return 'today'
    if (days === 1) return 'yesterday'
    if (days < 7) return `${days} days ago`
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`
    if (days < 365) return `${Math.floor(days / 30)} months ago`
    return `${Math.floor(days / 365)} years ago`
  }

  if (!repositoryUrl) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <GitBranch className="w-5 h-5" />
          Repository
        </h3>
        <div className="text-center py-4">
          <Code className="w-10 h-10 mx-auto text-muted-foreground/50 mb-2" />
          <p className="text-muted-foreground text-sm">
            No repository linked
          </p>
          {isOwner && (
            <button
              onClick={onEditUrl}
              className="mt-3 px-4 py-2 text-sm bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
            >
              Add Repository Link
            </button>
          )}
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6 max-h-[443px] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <GitBranch className="w-5 h-5" />
          Repository
        </h3>
        <div className="flex items-center gap-2">
          <a
            href={repositoryUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors"
          >
            View Repository
            <ExternalLink className="w-3 h-3" />
          </a>
          {isOwner && (
            <>
              <button
                onClick={onEditUrl}
                className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded transition-colors"
                title="Edit repository URL"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  if (confirm('Remove repository link?')) {
                    onDeleteUrl?.()
                  }
                }}
                className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors"
                title="Remove repository"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {data?.repo_info && (
        <div className="flex flex-wrap gap-4 mb-4 p-3 bg-secondary/50 rounded-lg">
          <div className="flex items-center gap-1 text-sm">
            <Star className="w-4 h-4 text-yellow-500" />
            <span className="font-medium">{data.repo_info.stars}</span>
            <span className="text-muted-foreground">stars</span>
          </div>
          <div className="flex items-center gap-1 text-sm">
            <GitFork className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">{data.repo_info.forks}</span>
            <span className="text-muted-foreground">forks</span>
          </div>
          {data.repo_info.language && (
            <div className="flex items-center gap-1 text-sm">
              <Code className="w-4 h-4 text-muted-foreground" />
              <span>{data.repo_info.language}</span>
            </div>
          )}
        </div>
      )}

      {isLoading && (
        <div className="text-center py-4 text-muted-foreground">
          Loading commits...
        </div>
      )}

      {/* Token Status for owners */}
      {isOwner && repositoryUrl && (
        <div className="mb-4 p-3 bg-secondary/30 rounded-lg">
          {hasGithubToken ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                <Key className="w-4 h-4" />
                <span>Personal Access Token configured</span>
              </div>
              <button
                onClick={() => {
                  if (confirm('Remove the GitHub token? This will disable access to private repo commits.')) {
                    removeTokenMutation.mutate()
                  }
                }}
                className="text-xs text-muted-foreground hover:text-destructive transition-colors"
              >
                Remove
              </button>
            </div>
          ) : showTokenInput ? (
            <div>
              <label className="block text-sm font-medium mb-2">GitHub Personal Access Token</label>
              <p className="text-xs text-muted-foreground mb-2">
                Create a <a href="https://github.com/settings/tokens/new" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">fine-grained token</a> with read-only access to your repo.
              </p>
              <input
                type="password"
                value={tokenValue}
                onChange={(e) => setTokenValue(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxx"
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-primary text-sm mb-2"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (tokenValue.trim()) {
                      setTokenMutation.mutate(tokenValue.trim())
                    }
                  }}
                  disabled={!tokenValue.trim() || setTokenMutation.isPending}
                  className="px-3 py-1.5 bg-primary text-primary-foreground rounded text-sm disabled:opacity-50"
                >
                  {setTokenMutation.isPending ? 'Saving...' : 'Save Token'}
                </button>
                <button
                  onClick={() => {
                    setShowTokenInput(false)
                    setTokenValue('')
                  }}
                  className="px-3 py-1.5 bg-secondary rounded text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowTokenInput(true)}
              className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
            >
              <Key className="w-4 h-4" />
              Add Personal Access Token for private repo
            </button>
          )}
        </div>
      )}

      {(error || data?.error) && (
        <div className="p-3 bg-destructive/10 rounded-lg">
          <div className="flex items-center gap-2 text-destructive text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{data?.error || 'Failed to load repository data'}</span>
          </div>
        </div>
      )}

      {data?.commits && data.commits.length > 0 && (
        <div className="flex flex-col min-h-0 flex-1">
          <h4 className="text-sm font-medium text-muted-foreground mb-3 flex-shrink-0">
            Recent Commits
          </h4>
          <div className="space-y-2 overflow-y-auto flex-1">
            {(showAllCommits ? data.commits : data.commits.slice(0, 5)).map((commit: CommitInfo) => (
              <a
                key={commit.full_sha}
                href={commit.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-3 bg-secondary/30 hover:bg-secondary/50 rounded-lg transition-colors group"
              >
                <div className="flex items-start gap-3">
                  <code className="text-xs text-primary bg-primary/10 px-1.5 py-0.5 rounded font-mono">
                    {commit.sha}
                  </code>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate group-hover:text-primary transition-colors">
                      {commit.message}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <span>{commit.author}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatRelativeTime(commit.date)}
                      </span>
                    </div>
                  </div>
                  <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                </div>
              </a>
            ))}
          </div>

          {data.commits.length > 5 && (
            <button
              onClick={() => setShowAllCommits(!showAllCommits)}
              className="mt-3 w-full py-2 text-sm text-primary hover:bg-primary/10 rounded-lg transition-colors flex items-center justify-center gap-1"
            >
              {showAllCommits ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  Show {data.commits.length - 5} more commits
                </>
              )}
            </button>
          )}
        </div>
      )}

      {data?.commits && data.commits.length === 0 && !data.error && (
        <p className="text-center py-4 text-muted-foreground text-sm">
          No commits found
        </p>
      )}
    </Card>
  )
}
