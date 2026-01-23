import { useState, useRef, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { X, Trash2, Check, MessageSquare } from 'lucide-react'
import { api, getImageUrl } from '../lib/api'
import type { User } from '../lib/auth'

interface Annotation {
  id: string
  image_id: string
  user_id: string
  x_position: number
  y_position: number
  annotation_type: string
  comment: string
  status: 'open' | 'resolved'
  created_at: string
  user: {
    id: string
    username: string
    full_name?: string
  }
}

interface ImageAnnotationModalProps {
  imageId: string
  imageUrl: string
  isOpen: boolean
  onClose: () => void
  user: User | null
}

export default function ImageAnnotationModal({
  imageId,
  imageUrl,
  isOpen,
  onClose,
  user
}: ImageAnnotationModalProps) {
  const queryClient = useQueryClient()
  const imageRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const [newAnnotationPos, setNewAnnotationPos] = useState<{ x: number; y: number } | null>(null)
  const [newComment, setNewComment] = useState('')
  const [selectedAnnotation, setSelectedAnnotation] = useState<string | null>(null)
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 })

  // Fetch annotations
  const { data: annotations = [] } = useQuery({
    queryKey: ['annotations', imageId],
    queryFn: async () => {
      const response = await api.get(`/images/${imageId}/annotations`)
      return response.data as Annotation[]
    },
    enabled: isOpen && !!imageId
  })

  // Create annotation mutation
  const createAnnotation = useMutation({
    mutationFn: async (data: { x_position: number; y_position: number; comment: string }) => {
      return api.post(`/images/${imageId}/annotations`, {
        x_position: data.x_position,
        y_position: data.y_position,
        annotation_type: 'point',
        comment: data.comment,
        status: 'open'
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['annotations', imageId] })
      setNewAnnotationPos(null)
      setNewComment('')
    }
  })

  // Delete annotation mutation
  const deleteAnnotation = useMutation({
    mutationFn: async (annotationId: string) => {
      return api.delete(`/images/annotations/${annotationId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['annotations', imageId] })
      setSelectedAnnotation(null)
    }
  })

  // Resolve annotation mutation
  const resolveAnnotation = useMutation({
    mutationFn: async (annotationId: string) => {
      return api.patch(`/images/annotations/${annotationId}/resolve`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['annotations', imageId] })
    }
  })

  // Handle image click to add annotation
  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!user) return

    const img = imageRef.current
    if (!img) return

    const rect = img.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    setNewAnnotationPos({ x, y })
  }

  // Handle save annotation
  const handleSaveAnnotation = () => {
    if (!newAnnotationPos || !newComment.trim()) return
    createAnnotation.mutate({
      x_position: newAnnotationPos.x,
      y_position: newAnnotationPos.y,
      comment: newComment.trim()
    })
  }

  // Update image dimensions when loaded
  const handleImageLoad = () => {
    if (imageRef.current) {
      setImageDimensions({
        width: imageRef.current.offsetWidth,
        height: imageRef.current.offsetHeight
      })
    }
  }

  // Close on escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (newAnnotationPos) {
          setNewAnnotationPos(null)
          setNewComment('')
        } else {
          onClose()
        }
      }
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose, newAnnotationPos])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-50"
      >
        <X className="w-6 h-6 text-white" />
      </button>

      {/* Hint for adding annotations */}
      {user && !newAnnotationPos && (
        <div className="absolute top-4 left-4 z-50">
          <span className="px-3 py-1.5 bg-white/10 backdrop-blur rounded-lg text-white/70 text-sm">
            Click on the image to add an annotation
          </span>
        </div>
      )}

      {/* Main content area */}
      <div
        ref={containerRef}
        className="relative max-w-[90vw] max-h-[85vh] flex items-center justify-center"
      >
        {/* Image with annotations */}
        <div className="relative">
          <img
            ref={imageRef}
            src={getImageUrl(imageUrl)}
            alt="Annotatable image"
            className={`max-w-full max-h-[85vh] object-contain rounded-lg ${
              user ? 'cursor-crosshair' : ''
            }`}
            onClick={handleImageClick}
            onLoad={handleImageLoad}
          />

          {/* Existing annotations */}
          {annotations.map((annotation, index) => (
            <div key={annotation.id}>
              {/* Marker */}
              <button
                onClick={() => setSelectedAnnotation(
                  selectedAnnotation === annotation.id ? null : annotation.id
                )}
                className={`absolute w-8 h-8 -ml-4 -mt-4 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  annotation.status === 'resolved'
                    ? 'bg-green-500 text-white'
                    : 'bg-red-500 text-white hover:scale-110'
                } ${selectedAnnotation === annotation.id ? 'ring-2 ring-white ring-offset-2 ring-offset-black/50' : ''}`}
                style={{
                  left: `${annotation.x_position}%`,
                  top: `${annotation.y_position}%`
                }}
              >
                {String(index + 1).padStart(2, '0')}
              </button>

              {/* Tooltip/Note card */}
              {selectedAnnotation === annotation.id && (
                <div
                  className="absolute z-10 w-64 bg-card border border-border rounded-lg shadow-xl p-3"
                  style={{
                    left: `${Math.min(annotation.x_position + 3, 70)}%`,
                    top: `${annotation.y_position}%`
                  }}
                >
                  {/* Line connector */}
                  <div
                    className="absolute w-8 h-0.5 bg-red-500"
                    style={{
                      right: '100%',
                      top: '20px'
                    }}
                  />

                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      {annotation.user.username}
                    </span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      annotation.status === 'resolved'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {annotation.status}
                    </span>
                  </div>
                  <p className="text-sm text-foreground mb-3">{annotation.comment}</p>

                  {user && (annotation.user_id === user.id || user.id) && (
                    <div className="flex items-center gap-2 pt-2 border-t border-border">
                      {annotation.status !== 'resolved' && (
                        <button
                          onClick={() => resolveAnnotation.mutate(annotation.id)}
                          className="flex items-center gap-1 text-xs text-green-400 hover:text-green-300"
                        >
                          <Check className="w-3 h-3" />
                          Resolve
                        </button>
                      )}
                      {annotation.user_id === user.id && (
                        <button
                          onClick={() => {
                            if (confirm('Delete this annotation?')) {
                              deleteAnnotation.mutate(annotation.id)
                            }
                          }}
                          className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* New annotation being placed */}
          {newAnnotationPos && (
            <div>
              {/* Marker */}
              <div
                className="absolute w-8 h-8 -ml-4 -mt-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold animate-pulse"
                style={{
                  left: `${newAnnotationPos.x}%`,
                  top: `${newAnnotationPos.y}%`
                }}
              >
                {String(annotations.length + 1).padStart(2, '0')}
              </div>

              {/* Input card */}
              <div
                className="absolute z-10 w-72 bg-card border border-border rounded-lg shadow-xl p-3"
                style={{
                  left: `${Math.min(newAnnotationPos.x + 3, 65)}%`,
                  top: `${newAnnotationPos.y}%`
                }}
              >
                {/* Line connector */}
                <div
                  className="absolute w-8 h-0.5 bg-primary"
                  style={{
                    right: '100%',
                    top: '24px'
                  }}
                />

                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Add Note</span>
                </div>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Enter your annotation..."
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-primary resize-none"
                  rows={3}
                  autoFocus
                />
                <div className="flex justify-end gap-2 mt-2">
                  <button
                    onClick={() => {
                      setNewAnnotationPos(null)
                      setNewComment('')
                    }}
                    className="px-3 py-1.5 text-sm bg-secondary rounded-lg hover:bg-secondary/80"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveAnnotation}
                    disabled={!newComment.trim() || createAnnotation.isPending}
                    className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
                  >
                    {createAnnotation.isPending ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Annotation list sidebar */}
      {annotations.length > 0 && (
        <div className="absolute right-4 top-20 bottom-4 w-72 bg-card/95 backdrop-blur border border-border rounded-lg overflow-hidden flex flex-col">
          <div className="p-3 border-b border-border">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Annotations ({annotations.length})
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {annotations.map((annotation, index) => (
              <button
                key={annotation.id}
                onClick={() => setSelectedAnnotation(
                  selectedAnnotation === annotation.id ? null : annotation.id
                )}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  selectedAnnotation === annotation.id
                    ? 'bg-primary/10 border border-primary/30'
                    : 'bg-secondary/50 hover:bg-secondary'
                }`}
              >
                <div className="flex items-start gap-2">
                  <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    annotation.status === 'resolved'
                      ? 'bg-green-500 text-white'
                      : 'bg-red-500 text-white'
                  }`}>
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground line-clamp-2">{annotation.comment}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      by {annotation.user.username}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
