import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MessageCircle, Reply, Send, X } from 'lucide-react'
import { api } from '../lib/api'
import ReactMarkdown from 'react-markdown'

interface Comment {
  id: string
  content: string
  user: {
    username: string
    full_name?: string
  }
  created_at: string
  replies: Comment[]
}

interface CommentItemProps {
  comment: Comment
  depth?: number
  user: { id: string } | null
  replyingTo: string | null
  replyText: string
  onReplyClick: (commentId: string) => void
  onReplyTextChange: (text: string) => void
  onSubmitReply: (commentId: string) => void
  onCancelReply: () => void
}

// CommentItem is defined OUTSIDE the main component to prevent re-creation
function CommentItem({
  comment,
  depth = 0,
  user,
  replyingTo,
  replyText,
  onReplyClick,
  onReplyTextChange,
  onSubmitReply,
  onCancelReply,
}: CommentItemProps) {
  return (
    <div className={`mb-4 ${depth > 0 ? 'ml-8 border-l-2 border-border pl-4' : ''}`}>
      <div className="bg-secondary rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-foreground">
              {comment.user.full_name || comment.user.username}
            </span>
            <span className="text-sm text-muted-foreground">
              {new Date(comment.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
        <div className="text-foreground/90 prose prose-invert prose-sm max-w-none">
          <ReactMarkdown>{comment.content}</ReactMarkdown>
        </div>
        {user && depth < 2 && (
          <button
            onClick={() => onReplyClick(comment.id)}
            className="mt-2 inline-flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors"
          >
            <Reply className="w-3 h-3" />
            Reply
          </button>
        )}
        {replyingTo === comment.id && (
          <div className="mt-3">
            <textarea
              value={replyText}
              onChange={(e) => onReplyTextChange(e.target.value)}
              placeholder="Write a reply..."
              className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              rows={3}
              autoFocus
            />
            <div className="mt-2 flex space-x-2">
              <button
                onClick={() => onSubmitReply(comment.id)}
                className="inline-flex items-center gap-1 px-3 py-1 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90 transition-colors"
              >
                <Send className="w-3 h-3" />
                Post Reply
              </button>
              <button
                onClick={onCancelReply}
                className="inline-flex items-center gap-1 px-3 py-1 bg-secondary text-foreground rounded-lg text-sm hover:bg-secondary/80 transition-colors"
              >
                <X className="w-3 h-3" />
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-2">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              depth={depth + 1}
              user={user}
              replyingTo={replyingTo}
              replyText={replyText}
              onReplyClick={onReplyClick}
              onReplyTextChange={onReplyTextChange}
              onSubmitReply={onSubmitReply}
              onCancelReply={onCancelReply}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface CommentSectionProps {
  appId: string
  user: { id: string } | null
}

export default function CommentSection({ appId, user }: CommentSectionProps) {
  const [newComment, setNewComment] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const queryClient = useQueryClient()

  const { data: comments, isLoading } = useQuery({
    queryKey: ['comments', appId],
    queryFn: async () => {
      const response = await api.get(`/apps/${appId}/comments`)
      return response.data
    },
  })

  const commentMutation = useMutation({
    mutationFn: async (data: { content: string; parent_comment_id?: string }) => {
      return api.post(`/apps/${appId}/comments`, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', appId] })
      setNewComment('')
      setReplyingTo(null)
      setReplyText('')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || !user) return
    commentMutation.mutate({ content: newComment })
  }

  const handleReplyClick = (commentId: string) => {
    if (replyingTo === commentId) {
      setReplyingTo(null)
      setReplyText('')
    } else {
      setReplyingTo(commentId)
      setReplyText('')
    }
  }

  const handleSubmitReply = (parentId: string) => {
    if (!replyText.trim() || !user) return
    commentMutation.mutate({ content: replyText, parent_comment_id: parentId })
  }

  const handleCancelReply = () => {
    setReplyingTo(null)
    setReplyText('')
  }

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Loading comments...</div>
  }

  return (
    <div className="mt-8">
      <h2 className="inline-flex items-center gap-2 text-2xl font-bold mb-6 text-foreground">
        <MessageCircle className="w-6 h-6" />
        Comments
      </h2>

      {user && (
        <form onSubmit={handleSubmit} className="mb-8">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment... (Markdown supported)"
            className="w-full px-4 py-3 border border-border bg-card text-foreground placeholder:text-muted-foreground rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            rows={4}
          />
          <div className="mt-2 flex justify-end">
            <button
              type="submit"
              disabled={!newComment.trim() || commentMutation.isPending}
              className="inline-flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              <Send className="w-4 h-4" />
              {commentMutation.isPending ? 'Posting...' : 'Post Comment'}
            </button>
          </div>
        </form>
      )}

      {!user && (
        <div className="mb-6 p-4 bg-primary/10 border border-primary/30 rounded-lg">
          <p className="text-primary">
            Please <a href="/login" className="underline">login</a> to post comments.
          </p>
        </div>
      )}

      {comments && comments.length > 0 ? (
        <div>
          {comments.map((comment: Comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              user={user}
              replyingTo={replyingTo}
              replyText={replyText}
              onReplyClick={handleReplyClick}
              onReplyTextChange={setReplyText}
              onSubmitReply={handleSubmitReply}
              onCancelReply={handleCancelReply}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          No comments yet. Be the first to comment!
        </div>
      )}
    </div>
  )
}
