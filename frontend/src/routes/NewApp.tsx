import { useState, useMemo } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { Upload, X, Save, ArrowLeft, Image as ImageIcon, FolderKanban, Lightbulb, Pin } from 'lucide-react'
import { api } from '../lib/api'
import type { User } from '../lib/auth'
import type { App } from '../lib/types'
import { usePinnedTeam } from '../lib/pinnedTeam'
import ThemeToggle from '../components/ThemeToggle'
import NavUser from '../components/NavUser'
import NotificationBell from '../components/NotificationBell'
import Logo from '../components/Logo'
import { Card } from '../components/ui/card'
import AppCard from '../components/AppCard'

interface NewAppProps {
  user: User
}

export default function NewApp({ user }: NewAppProps) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const teamId = searchParams.get('team_id')
  
  const [formData, setFormData] = useState({
    name: '',
    full_description: '',
    status: 'in_development',
    // Team apps are not published (private to team), public apps are published
    is_published: !teamId,
  })
  const [images, setImages] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const { getRootProps, getInputProps } = useDropzone({
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'] },
    onDrop: (acceptedFiles) => {
      setImages([...images, ...acceptedFiles])
      if (fieldErrors.images) {
        setFieldErrors({ ...fieldErrors, images: '' })
      }
    },
  })

  // Generate preview URLs for images
  const imagePreviewUrls = useMemo(() => {
    return images.map(img => URL.createObjectURL(img))
  }, [images])

  const validateForm = () => {
    const errors: Record<string, string> = {}
    
    if (!formData.name.trim()) {
      errors.name = 'App name is required'
    }

    if (images.length === 0) {
      errors.images = 'At least one image is required'
    }
    
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    setLoading(true)
    setError('')
    setFieldErrors({})

    try {
      // Create app
      const appPayload = {
        ...formData,
        team_id: teamId || undefined,
      }
      const appResponse = await api.post('/apps', appPayload)
      const appId = appResponse.data.id

      // Upload images
      for (const image of images) {
        const imageFormData = new FormData()
        imageFormData.append('file', image)
        // Don't set Content-Type header - browser will set it with boundary
        await api.post(`/apps/${appId}/images?is_featured=${images.indexOf(image) === 0}`, imageFormData)
      }

      navigate(`/apps/${appId}`)
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to create app'
      setError(errorMessage)
      
      // Try to parse field-specific errors if available
      if (err.response?.data?.errors) {
        setFieldErrors(err.response.data.errors)
      }
    } finally {
      setLoading(false)
    }
  }


  const { pinnedTeam } = usePinnedTeam()

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
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

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            to={teamId ? `/team/${teamId}` : '/team'}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <h1 className="text-3xl font-bold text-foreground">
            {teamId ? 'Create Team App' : 'Create New App'}
          </h1>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Form */}
          <div>
            <form onSubmit={handleSubmit} className="space-y-6 bg-card p-6 rounded-lg border border-border">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">App Name *</label>
                <input
                  type="text"
                  placeholder="My Awesome App"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value })
                    if (fieldErrors.name) {
                      setFieldErrors({ ...fieldErrors, name: '' })
                    }
                  }}
                  className={`block w-full border ${fieldErrors.name ? 'border-destructive' : 'border-border'} bg-background text-foreground rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring placeholder:text-muted-foreground`}
                />
                {fieldErrors.name && (
                  <p className="mt-1 text-sm text-destructive">{fieldErrors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Description</label>
                <textarea
                  rows={5}
                  placeholder="Detailed description of your app, features, and functionality..."
                  value={formData.full_description}
                  onChange={(e) => setFormData({ ...formData, full_description: e.target.value })}
                  className="block w-full border border-border bg-background text-foreground rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring placeholder:text-muted-foreground resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="block w-full border border-border bg-background text-foreground rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
                >
                  <option value="in_development">In Development</option>
                  <option value="beta">Beta</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              {/* Info for team apps */}
              {teamId && (
                <div className="p-3 rounded-lg bg-muted border border-border">
                  <p className="text-sm text-muted-foreground">
                    This app will be private to your team and only visible to team members.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Images *</label>
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed ${fieldErrors.images ? 'border-destructive' : 'border-border'} rounded-lg p-6 text-center cursor-pointer hover:border-ring hover:bg-muted/50 transition-colors`}
                >
                  <input {...getInputProps()} />
                  <div className="pointer-events-none">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Drag and drop images, or click to select</p>
                    <p className="text-xs text-muted-foreground mt-1">First image will be the featured image</p>
                  </div>
                </div>
                {fieldErrors.images && (
                  <p className="mt-1 text-sm text-destructive">{fieldErrors.images}</p>
                )}
                {images.length > 0 && (
                  <div className="mt-4 grid grid-cols-4 gap-3">
                    {images.map((img, idx) => (
                      <div key={idx} className="relative group">
                        <img
                          src={imagePreviewUrls[idx]}
                          alt={`Preview ${idx + 1}`}
                          className="w-full h-20 object-cover rounded-lg border border-border"
                        />
                        {idx === 0 && (
                          <span className="absolute bottom-1 left-1 text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded">
                            Featured
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setImages(images.filter((_, i) => i !== idx))
                            if (images.length === 1 && fieldErrors.images) {
                              // Keep error if this was the last image
                            } else if (fieldErrors.images) {
                              setFieldErrors({ ...fieldErrors, images: '' })
                            }
                          }}
                          className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => navigate(teamId ? `/team/${teamId}` : '/team')}
                  className="px-4 py-2 border border-border text-foreground rounded-lg hover:bg-secondary transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Save className="w-4 h-4" />
                  {loading ? 'Creating...' : 'Create App'}
                </button>
              </div>
            </form>
          </div>

          {/* Right Column - Live Preview */}
          <div className="lg:sticky lg:top-8 h-fit">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-foreground">Live Preview</h2>
              <p className="text-sm text-muted-foreground">This is how your app will appear in the list</p>
            </div>

            {/* Preview Card using AppCard component */}
            <div className="max-w-md pointer-events-none">
              <AppCard
                app={{
                  id: 'preview',
                  name: formData.name || 'App Name',
                  full_description: formData.full_description || 'Description will appear here...',
                  status: formData.status as App['status'],
                  is_published: formData.is_published,
                  images: images.length > 0 ? [{ id: 'preview-img', image_url: imagePreviewUrls[0] }] : [],
                  creator: {
                    id: user.id,
                    username: user.username,
                    full_name: user.full_name,
                  },
                  creator_id: user.id,
                  progress: 0,
                  progress_mode: 'manual',
                  tasks: [],
                  vote_count: 0,
                  total_votes: 0,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                } as App}
                user={user}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
