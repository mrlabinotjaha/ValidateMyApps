import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useDropzone } from 'react-dropzone'
import { ArrowLeft, ThumbsUp, ThumbsDown, Upload, X, Image as ImageIcon, Users, Lock, Globe, Plus, Check, Trash2, Settings, Pencil, ChevronDown, ChevronUp, Share2 } from 'lucide-react'
import { api } from '../lib/api'
import type { User } from '../lib/auth'
import type { Team, App, VoteInfo, AppTask } from '../lib/types'
import CommentSection from '../components/CommentSection'
import ThemeToggle from '../components/ThemeToggle'
import { Card } from '../components/ui/card'
import AppCard from '../components/AppCard'

interface AppDetailProps {
  user: User | null
}

export default function AppDetail({ user }: AppDetailProps) {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const [showUpload, setShowUpload] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [editingField, setEditingField] = useState<string | null>(null)
  const [editValues, setEditValues] = useState({
    name: '',
    short_description: '',
    full_description: '',
    status: 'in_development' as App['status']
  })
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [showSettingsMenu, setShowSettingsMenu] = useState(false)

  const { data: app, isLoading } = useQuery({
    queryKey: ['app', id],
    queryFn: async () => {
      const response = await api.get(`/apps/${id}`)
      return response.data as App
    },
  })

  // Fetch the team if the app belongs to one
  const { data: team } = useQuery({
    queryKey: ['team', app?.team_id],
    queryFn: async () => {
      const response = await api.get(`/teams/${app!.team_id}`)
      return response.data as Team
    },
    enabled: !!app?.team_id,
  })

  const isOwner = user && app?.creator_id === user.id

  // Update app mutation
  const updateAppMutation = useMutation({
    mutationFn: async (data: Partial<App>) => {
      return api.put(`/apps/${id}`, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app', id] })
    },
  })

  // Task mutations
  const addTaskMutation = useMutation({
    mutationFn: async (title: string) => {
      return api.post(`/apps/${id}/tasks`, { title })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app', id] })
      setNewTaskTitle('')
    },
  })

  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, is_completed }: { taskId: string; is_completed: boolean }) => {
      return api.put(`/apps/${id}/tasks/${taskId}`, { is_completed })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app', id] })
    },
  })

  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      return api.delete(`/apps/${id}/tasks/${taskId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app', id] })
    },
  })

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'] },
    onDrop: async (acceptedFiles) => {
      if (acceptedFiles.length === 0 || !id) return
      
      setUploading(true)
      try {
        for (const file of acceptedFiles) {
          const formData = new FormData()
          formData.append('file', file)
          await api.post(`/apps/${id}/images`, formData)
        }
        queryClient.invalidateQueries({ queryKey: ['app', id] })
        setShowUpload(false)
      } catch (error: any) {
        console.error('Failed to upload image:', error)
        alert(error.response?.data?.detail || 'Failed to upload image')
      } finally {
        setUploading(false)
      }
    },
    disabled: uploading,
    noClick: false,
    noKeyboard: false,
  })

  const { data: voteStats } = useQuery({
    queryKey: ['votes', id],
    queryFn: async () => {
      const response = await api.get(`/apps/${id}/votes`)
      return response.data as VoteInfo
    },
    enabled: !!user && !!id,
  })

  const voteMutation = useMutation({
    mutationFn: async (voteType: 'upvote' | 'downvote') => {
      return api.post(`/apps/${id}/vote`, { vote_type: voteType })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['votes', id] })
    },
  })

  const handleVote = (voteType: 'upvote' | 'downvote') => {
    if (!user) return
    voteMutation.mutate(voteType)
  }

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return
    addTaskMutation.mutate(newTaskTitle.trim())
  }

  // Sync edit values with app data
  useEffect(() => {
    if (app) {
      setEditValues({
        name: app.name,
        short_description: app.short_description,
        full_description: app.full_description || '',
        status: app.status
      })
    }
  }, [app])

  // Editing handlers
  const startEditing = (field: string) => {
    if (!app) return
    setEditingField(field)
    setEditValues({
      name: app.name,
      short_description: app.short_description,
      full_description: app.full_description || '',
      status: app.status
    })
  }

  const cancelEditing = () => {
    setEditingField(null)
    if (app) {
      setEditValues({
        name: app.name,
        short_description: app.short_description,
        full_description: app.full_description || '',
        status: app.status
      })
    }
  }

  const saveField = (field: string) => {
    if (!app) return
    
    const updateData: any = {}
    if (field === 'name') {
      updateData.name = editValues.name.trim()
      if (!updateData.name) {
        alert('Name cannot be empty')
        return
      }
    } else if (field === 'short_description') {
      updateData.short_description = editValues.short_description.trim()
      if (!updateData.short_description) {
        alert('Short description cannot be empty')
        return
      }
    } else if (field === 'full_description') {
      updateData.full_description = editValues.full_description.trim()
    } else if (field === 'status') {
      updateData.status = editValues.status
    }

    updateAppMutation.mutate(updateData, {
      onSuccess: () => {
        setEditingField(null)
      },
      onError: () => {
        // Keep editing on error
      }
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent, field: string) => {
    if (e.key === 'Enter' && field !== 'full_description') {
      e.preventDefault()
      saveField(field)
    } else if (e.key === 'Escape') {
      cancelEditing()
    }
  }

  // Calculate auto progress based on completed tasks
  const tasks = app?.tasks || []
  const completedTasks = tasks.filter(t => t.is_completed).length
  const autoProgress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0
  const displayProgress = app?.progress_mode === 'auto' ? autoProgress : (app?.progress || 0)
  const images = app?.images || []

  // Reset selected image index when images change
  useEffect(() => {
    if (images.length > 0 && selectedImageIndex >= images.length) {
      setSelectedImageIndex(0)
    }
  }, [images.length, selectedImageIndex])

  // Keyboard navigation for images
  useEffect(() => {
    const imageCount = images.length
    if (imageCount <= 1) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return // Don't interfere with text inputs
      }
      
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        setSelectedImageIndex((prev) => (prev - 1 + imageCount) % imageCount)
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        setSelectedImageIndex((prev) => (prev + 1) % imageCount)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [images.length])

  // Close settings menu on Escape
  useEffect(() => {
    if (!showSettingsMenu) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowSettingsMenu(false)
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [showSettingsMenu])

  if (isLoading) return <div className="text-center py-12 text-muted-foreground bg-background min-h-screen">Loading...</div>
  if (!app) return <div className="text-center py-12 text-muted-foreground bg-background min-h-screen">App not found</div>

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

  const handleShare = async () => {
    const url = window.location.href
    try {
      await navigator.clipboard.writeText(url)
      alert('Link copied to clipboard!')
    } catch (err) {
      alert('Failed to copy link')
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-4">
          <Link to={team ? `/teams/${team.id}` : "/"} className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            {team ? `Back to ${team.name}` : 'Back to Dashboard'}
          </Link>
          <ThemeToggle />
        </div>

        {/* Sticky Summary Bar */}
        <div className="sticky top-0 z-50 mb-6 bg-background/95 backdrop-blur-sm border-b border-border">
          <Card className="border-0 shadow-sm">
            <div className="p-4 flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                {editingField === 'name' ? (
                  <input
                    type="text"
                    value={editValues.name}
                    onChange={(e) => setEditValues({ ...editValues, name: e.target.value })}
                    onBlur={() => saveField('name')}
                    onKeyDown={(e) => handleKeyDown(e, 'name')}
                    autoFocus
                    className="text-xl font-bold bg-background border border-primary rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                ) : (
                  <div className="flex items-center gap-2 group">
                    <h1 className="text-xl font-bold text-foreground truncate">{app.name}</h1>
                    {isOwner && (
                      <button
                        onClick={() => startEditing('name')}
                        className="opacity-30 group-hover:opacity-100 transition-opacity p-1 hover:bg-secondary rounded"
                        title="Edit name"
                        aria-label="Edit app name"
                      >
                        <Pencil className="w-4 h-4 text-muted-foreground" />
                      </button>
                    )}
                  </div>
                )}
                {editingField === 'status' ? (
                  <select
                    value={editValues.status}
                    onChange={(e) => {
                      const newStatus = e.target.value as App['status']
                      setEditValues({ ...editValues, status: newStatus })
                      updateAppMutation.mutate({ status: newStatus }, {
                        onSuccess: () => {
                          setEditingField(null)
                        }
                      })
                    }}
                    autoFocus
                    className={`px-2 py-1 rounded text-xs font-medium border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary ${getStatusColor(editValues.status)}`}
                  >
                    <option value="in_development">IN DEVELOPMENT</option>
                    <option value="beta">BETA</option>
                    <option value="completed">COMPLETED</option>
                  </select>
                ) : (
                  <div className="flex items-center gap-2 group/status">
                    <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(app.status)}`}>
                      {app.status?.replace('_', ' ').toUpperCase()}
                    </span>
                    {isOwner && (
                      <button
                        onClick={() => startEditing('status')}
                        className="opacity-30 group-hover/status:opacity-100 transition-opacity p-1 hover:bg-secondary rounded"
                        title="Edit status"
                        aria-label="Edit status"
                      >
                        <Pencil className="w-3 h-3 text-muted-foreground" />
                      </button>
                    )}
                  </div>
                )}
                {voteStats && !isOwner && (
                  <div className="flex items-center gap-1 text-sm">
                    <ThumbsUp className="w-4 h-4 text-muted-foreground" />
                    <span className="font-semibold text-foreground">{voteStats.net_score}</span>
                    <span className="text-muted-foreground">({voteStats.upvotes + voteStats.downvotes} votes)</span>
                  </div>
                )}
                {app.is_published ? (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Globe className="w-4 h-4" />
                    <span>Public</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Lock className="w-4 h-4" />
                    <span>Private</span>
                  </div>
                )}
                <span className="text-sm text-muted-foreground">
                  Created by {app.creator?.full_name || app.creator?.username} • Updated {new Date(app.updated_at).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleShare}
                  className="p-2 hover:bg-secondary rounded-lg transition-colors"
                  title="Share app"
                  aria-label="Share app"
                >
                  <Share2 className="w-4 h-4 text-muted-foreground" />
                </button>
                {isOwner && (
                  <div className="relative">
                    <button
                      onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                      className="p-2 hover:bg-secondary rounded-lg transition-colors"
                      title="Settings"
                      aria-label="App settings"
                    >
                      <Settings className="w-4 h-4 text-muted-foreground" />
                    </button>
                    {showSettingsMenu && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setShowSettingsMenu(false)}
                        />
                        <div className="absolute right-0 mt-2 w-64 bg-card border border-border rounded-lg shadow-lg z-50">
                          <div className="p-4 space-y-4">
                            {/* Visibility Toggle */}
                            <div>
                              <label className="text-sm text-muted-foreground mb-2 block">Visibility</label>
                              <div className="flex bg-secondary rounded-lg p-1">
                                <button
                                  onClick={() => {
                                    updateAppMutation.mutate({ is_published: false })
                                    setShowSettingsMenu(false)
                                  }}
                                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors flex-1 ${
                                    !app.is_published ? 'bg-background text-foreground shadow' : 'text-muted-foreground hover:text-foreground'
                                  }`}
                                >
                                  <Lock className="w-3.5 h-3.5" />
                                  Private
                                </button>
                                <button
                                  onClick={() => {
                                    updateAppMutation.mutate({ is_published: true })
                                    setShowSettingsMenu(false)
                                  }}
                                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors flex-1 ${
                                    app.is_published ? 'bg-background text-foreground shadow' : 'text-muted-foreground hover:text-foreground'
                                  }`}
                                >
                                  <Globe className="w-3.5 h-3.5" />
                                  Public
                                </button>
                              </div>
                            </div>

                            {/* Team Info */}
                            {team && (
                              <div>
                                <label className="text-sm text-muted-foreground mb-2 block">Team</label>
                                <Link
                                  to={`/teams/${team.id}`}
                                  onClick={() => setShowSettingsMenu(false)}
                                  className="flex items-center gap-2 p-3 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors"
                                >
                                  <Users className="w-4 h-4 text-primary" />
                                  <span className="text-sm text-foreground">{team.name}</span>
                                </Link>
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Show team info if app belongs to a team (for non-owners) */}
        {team && !isOwner && (
          <Link to={`/teams/${team.id}`} className="block mb-6">
            <div className="bg-card rounded-lg border border-border p-4 hover:border-primary/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Part of team</p>
                  <h3 className="font-semibold text-foreground">{team.name}</h3>
                </div>
              </div>
            </div>
          </Link>
        )}

        {/* Owner Controls - Progress & Tasks */}
        {isOwner && (
          <Card className="mb-6 p-6">
            {/* Progress Section */}
            <div className="mb-6 pb-6 border-b border-border">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">Progress</h2>
                <div className="flex bg-secondary rounded-lg p-1">
                  <button
                    onClick={() => updateAppMutation.mutate({ progress_mode: 'auto' })}
                    className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                      app.progress_mode === 'auto' ? 'bg-background text-foreground shadow' : 'text-muted-foreground hover:text-foreground'
                    }`}
                    title={app.progress_mode === 'auto' ? 'Auto: Progress calculated from completed tasks' : 'Switch to auto mode'}
                  >
                    Auto
                  </button>
                  <button
                    onClick={() => updateAppMutation.mutate({ progress_mode: 'manual' })}
                    className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                      app.progress_mode === 'manual' ? 'bg-background text-foreground shadow' : 'text-muted-foreground hover:text-foreground'
                    }`}
                    title={app.progress_mode === 'manual' ? 'Manual: Set progress manually' : 'Switch to manual mode'}
                  >
                    Manual
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {app.progress_mode === 'auto' ? 'Auto progress (based on tasks)' : 'Manual progress'}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-foreground">{displayProgress}%</span>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xs font-bold ${
                      displayProgress >= 80 ? 'bg-green-500/20 text-green-400' : 
                      displayProgress >= 50 ? 'bg-yellow-500/20 text-yellow-400' : 
                      'bg-primary/20 text-primary'
                    }`}>
                      {displayProgress}
                    </div>
                  </div>
                </div>
                <div className="h-4 w-full rounded-full bg-muted overflow-hidden relative">
                  <div
                    className={`h-full transition-all duration-300 ${
                      displayProgress >= 80 ? 'bg-green-500' : displayProgress >= 50 ? 'bg-yellow-500' : 'bg-primary'
                    }`}
                    style={{ width: `${displayProgress}%` }}
                  />
                </div>
                
                {app.progress_mode === 'manual' && (
                  <div className="pt-2">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={app.progress || 0}
                      onChange={(e) => updateAppMutation.mutate({ progress: parseInt(e.target.value) })}
                      className="w-full accent-primary"
                      aria-label="Set progress percentage"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>0%</span>
                      <span>50%</span>
                      <span>100%</span>
                    </div>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Last updated: {new Date(app.updated_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Tasks Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">Tasks</h2>
                <span className="text-sm text-muted-foreground">
                  {completedTasks} / {tasks.length} completed
                </span>
              </div>

              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                  placeholder="Add a new task..."
                  className="flex-1 px-4 py-2 bg-secondary rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                />
                <button
                  onClick={handleAddTask}
                  disabled={!newTaskTitle.trim() || addTaskMutation.isPending}
                  className="px-4 py-2 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors disabled:opacity-50"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              {tasks.length === 0 ? (
                <p className="text-center text-muted-foreground py-4 text-sm">
                  No tasks yet. Add your first task above.
                </p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {tasks.map((task: AppTask) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg group"
                    >
                      <button
                        onClick={() => updateTaskMutation.mutate({ taskId: task.id, is_completed: !task.is_completed })}
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
                          task.is_completed
                            ? 'bg-primary border-primary text-primary-foreground'
                            : 'border-muted-foreground hover:border-primary'
                        }`}
                      >
                        {task.is_completed && <Check className="w-3 h-3" />}
                      </button>
                      <span className={`flex-1 text-sm ${task.is_completed ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                        {task.title}
                      </span>
                      <button
                        onClick={() => deleteTaskMutation.mutate(task.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-all flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Live Preview - Show how the card looks */}
        {isOwner && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Live Preview</h2>
            <p className="text-sm text-muted-foreground mb-4">This is how your app appears in the list:</p>
            <div className="max-w-md pointer-events-none">
              <AppCard app={app} user={user} />
            </div>
          </div>
        )}

        {/* Images Section */}
        <Card className="mb-6 overflow-hidden">
          {images.length > 0 ? (
            <>
              {/* Main Image Display */}
              <div className="relative bg-secondary/50 p-4">
                <div className="flex items-center justify-center min-h-[400px] relative">
                  <img
                    src={images[selectedImageIndex]?.image_url.startsWith('data:') || images[selectedImageIndex]?.image_url.startsWith('http')
                      ? images[selectedImageIndex].image_url 
                      : `http://localhost:8000${images[selectedImageIndex]?.image_url}`}
                    alt={`${app.name} - Image ${selectedImageIndex + 1}`}
                    className="max-h-[400px] max-w-full object-contain rounded-lg"
                  />
                  {isOwner && (
                    <button
                      onClick={async () => {
                        if (confirm('Delete this image?')) {
                          try {
                            await api.delete(`/apps/images/${images[selectedImageIndex].id}`)
                            queryClient.invalidateQueries({ queryKey: ['app', id] })
                            if (selectedImageIndex >= images.length - 1 && selectedImageIndex > 0) {
                              setSelectedImageIndex(selectedImageIndex - 1)
                            }
                          } catch (error: any) {
                            alert(error.response?.data?.detail || 'Failed to delete image')
                          }
                        }
                      }}
                      className="absolute top-4 right-4 p-2 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 transition-colors shadow-lg"
                      title="Delete image"
                      aria-label="Delete image"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={() => setSelectedImageIndex((prev) => (prev - 1 + images.length) % images.length)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            setSelectedImageIndex((prev) => (prev - 1 + images.length) % images.length)
                          }
                        }}
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-background/80 hover:bg-background rounded-full shadow-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                        aria-label="Previous image"
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setSelectedImageIndex((prev) => (prev + 1) % images.length)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            setSelectedImageIndex((prev) => (prev + 1) % images.length)
                          }
                        }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-background/80 hover:bg-background rounded-full shadow-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                        aria-label="Next image"
                      >
                        <ArrowLeft className="w-5 h-5 rotate-180" />
                      </button>
                    </>
                  )}
                </div>
                <div className="text-center mt-2 text-sm text-muted-foreground">
                  Image {selectedImageIndex + 1} of {images.length}
                </div>
              </div>

              {/* Thumbnail Strip */}
              {(images.length > 1 || isOwner) && (
                <div className="p-4 border-t border-border">
                  <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'thin' }}>
                    {images.map((image: any, idx: number) => (
                      <button
                        key={image.id || idx}
                        onClick={() => setSelectedImageIndex(idx)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            setSelectedImageIndex(idx)
                          }
                        }}
                        className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all focus:outline-none focus:ring-2 focus:ring-primary ${
                          selectedImageIndex === idx
                            ? 'border-primary ring-2 ring-primary/20'
                            : 'border-transparent hover:border-border'
                        }`}
                        aria-label={`View image ${idx + 1}`}
                      >
                        <img
                          src={image.image_url.startsWith('data:') || image.image_url.startsWith('http')
                            ? image.image_url 
                            : `http://localhost:8000${image.image_url}`}
                          alt={`Thumbnail ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                    {isOwner && (
                      <div className="flex-shrink-0">
                        {showUpload ? (
                          <div
                            {...getRootProps()}
                            className={`w-20 h-20 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer transition-colors ${
                              isDragActive
                                ? 'border-primary bg-primary/10'
                                : 'border-border hover:border-primary/50'
                            } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            <input {...getInputProps()} />
                            <div className="text-center pointer-events-none">
                              {uploading ? (
                                <div className="text-xs text-muted-foreground">...</div>
                              ) : (
                                <Upload className="w-5 h-5 text-muted-foreground" />
                              )}
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setShowUpload(true)}
                            className="w-20 h-20 border-2 border-dashed border-border rounded-lg flex items-center justify-center hover:border-primary/50 hover:bg-primary/5 transition-colors text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                            aria-label="Add image"
                          >
                            <Plus className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="p-12">
              <div className="w-full flex items-center justify-center p-12 text-muted-foreground">
                <div className="text-center">
                  <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>No images yet</p>
                  {isOwner && (
                    <div className="mt-4">
                      {showUpload ? (
                        <div
                          {...getRootProps()}
                          className={`border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer transition-colors p-8 ${
                            isDragActive
                              ? 'border-primary bg-primary/10'
                              : 'border-border hover:border-primary/50'
                          } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <input {...getInputProps()} />
                          <div className="text-center pointer-events-none">
                            {uploading ? (
                              <div className="text-muted-foreground">Uploading...</div>
                            ) : (
                              <>
                                <Upload className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                                <p className="text-sm text-muted-foreground">
                                  {isDragActive ? 'Drop images here' : 'Click or drag to upload'}
                                </p>
                              </>
                            )}
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setShowUpload(true)}
                          className="border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center hover:border-primary/50 hover:bg-primary/5 transition-colors text-muted-foreground p-8"
                        >
                          <Upload className="w-12 h-12 mb-2" />
                          <span className="text-sm">Add Image</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="p-8">
            {!isOwner && <h1 className="text-4xl font-bold mb-4 text-foreground">{app.name}</h1>}
            
            {/* Short Description - Editable */}
            <div className="group mb-6 relative">
              {editingField === 'short_description' ? (
                <div>
                  <input
                    type="text"
                    value={editValues.short_description}
                    onChange={(e) => setEditValues({ ...editValues, short_description: e.target.value })}
                    onBlur={() => saveField('short_description')}
                    onKeyDown={(e) => handleKeyDown(e, 'short_description')}
                    autoFocus
                    className="w-full text-lg bg-background border border-primary rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200"
                  />
                </div>
              ) : (
                <div className="flex items-start gap-2 group/edit">
                  <p className="text-muted-foreground flex-1">{app.short_description}</p>
                  {isOwner && (
                    <button
                      onClick={() => startEditing('short_description')}
                      onFocus={() => {}}
                      className="opacity-30 group-hover/edit:opacity-100 focus:opacity-100 transition-opacity p-1 hover:bg-secondary rounded flex-shrink-0"
                      title="Edit short description"
                      aria-label="Edit short description"
                    >
                      <Pencil className="w-4 h-4 text-muted-foreground" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Full Description - Editable & Collapsible */}
            <div className="mb-6 group">
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-2xl font-semibold text-foreground">Description</h2>
                {isOwner && editingField !== 'full_description' && (
                  <button
                    onClick={() => startEditing('full_description')}
                    onFocus={() => {}}
                    className="opacity-30 group-hover:opacity-100 focus:opacity-100 transition-opacity p-1 hover:bg-secondary rounded"
                    title="Edit description"
                    aria-label="Edit full description"
                  >
                    <Pencil className="w-4 h-4 text-muted-foreground" />
                  </button>
                )}
              </div>
              {editingField === 'full_description' ? (
                <div className="space-y-2">
                  <textarea
                    value={editValues.full_description}
                    onChange={(e) => setEditValues({ ...editValues, full_description: e.target.value })}
                    rows={8}
                    className="w-full bg-background border border-primary rounded px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-y transition-all duration-200"
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        cancelEditing()
                      }
                    }}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => saveField('full_description')}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm"
                    >
                      Save
                    </button>
                    <button
                      onClick={cancelEditing}
                      className="px-4 py-2 bg-secondary text-foreground rounded-lg hover:bg-secondary/80 transition-colors text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  {app.full_description ? (
                    <>
                      <div className={`text-muted-foreground whitespace-pre-wrap transition-all duration-300 ${
                        isDescriptionExpanded ? '' : 'line-clamp-3'
                      }`}>
                        {app.full_description}
                      </div>
                      {app.full_description.length > 150 && (
                        <button
                          onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                          className="mt-2 text-sm text-primary hover:text-primary/80 inline-flex items-center gap-1 transition-colors"
                        >
                          {isDescriptionExpanded ? (
                            <>
                              <ChevronUp className="w-4 h-4" />
                              Show less
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-4 h-4" />
                              Show more
                            </>
                          )}
                        </button>
                      )}
                    </>
                  ) : (
                    <p className="text-muted-foreground italic">
                      {isOwner ? 'No description yet. Click the pencil icon to add one.' : 'No description available.'}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center space-x-6 mb-6 flex-wrap">
              {!isOwner && (
                <>
                  {user && voteStats ? (
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => handleVote('upvote')}
                        disabled={voteMutation.isPending}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                          voteStats.user_vote === 'upvote' ? 'bg-success text-success-foreground' : 'bg-secondary hover:bg-secondary/80 text-foreground'
                        }`}
                      >
                        <ThumbsUp className="w-4 h-4" />
                        {voteStats.upvotes}
                      </button>
                      <span className="text-2xl font-bold text-foreground">{voteStats.net_score}</span>
                      <button
                        onClick={() => handleVote('downvote')}
                        disabled={voteMutation.isPending}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                          voteStats.user_vote === 'downvote' ? 'bg-destructive text-destructive-foreground' : 'bg-secondary hover:bg-secondary/80 text-foreground'
                        }`}
                      >
                        <ThumbsDown className="w-4 h-4" />
                        {voteStats.downvotes}
                      </button>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      <a href="/login" className="text-primary hover:underline">Login</a> to vote
                    </div>
                  )}
                </>
              )}
              {!isOwner && <span className="text-muted-foreground">Status: {app.status?.replace('_', ' ')}</span>}
              {app.tags && app.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {app.tags.map((tag: any) => (
                    <span key={tag.id} className="px-2 py-1 bg-primary/20 text-primary rounded-lg text-sm">
                      {tag.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>


        <div className="mt-8">
          <CommentSection appId={id!} user={user} />
        </div>
      </div>
    </div>
  )
}
