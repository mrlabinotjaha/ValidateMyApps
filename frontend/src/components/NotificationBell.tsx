import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, Check, Lightbulb, Users, CheckCircle, XCircle, Mail } from 'lucide-react'
import { api } from '../lib/api'

interface Notification {
  id: string
  user_id: string
  type: 'request_assigned' | 'claim_approved' | 'claim_denied' | 'new_claim' | 'request_completed' | 'team_invitation'
  title: string
  message?: string
  related_id?: string
  related_type?: string
  is_read: boolean
  created_at: string
}

const notificationIcons: Record<string, React.ElementType> = {
  request_assigned: Lightbulb,
  claim_approved: CheckCircle,
  claim_denied: XCircle,
  new_claim: Users,
  request_completed: CheckCircle,
  team_invitation: Mail,
}

const notificationColors: Record<string, string> = {
  request_assigned: 'text-blue-400',
  claim_approved: 'text-green-400',
  claim_denied: 'text-red-400',
  new_claim: 'text-yellow-400',
  request_completed: 'text-purple-400',
  team_invitation: 'text-cyan-400',
}

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()

  // Fetch unread count
  const { data: countData } = useQuery({
    queryKey: ['notifications-count'],
    queryFn: async () => {
      const response = await api.get('/notifications/count')
      return response.data as { unread_count: number }
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  })

  // Fetch notifications
  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await api.get('/notifications', { params: { limit: 10 } })
      return response.data as Notification[]
    },
    enabled: isOpen,
  })

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      await api.post(`/notifications/${notificationId}/read`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-count'] })
    },
  })

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      await api.post('/notifications/read-all')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-count'] })
    },
  })

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const unreadCount = countData?.unread_count || 0

  const getNotificationLink = (notification: Notification) => {
    if (notification.related_type === 'app_request' && notification.related_id) {
      return `/requests/${notification.related_id}`
    }
    if (notification.related_type === 'team' && notification.related_id) {
      return `/team/${notification.related_id}`
    }
    if (notification.type === 'team_invitation') {
      return '/team'
    }
    return null
  }

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsReadMutation.mutate(notification.id)
    }
    setIsOpen(false)
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-lg shadow-lg z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h3 className="font-semibold text-foreground">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsReadMutation.mutate()}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                <Check className="w-3 h-3" />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-muted-foreground">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => {
                const Icon = notificationIcons[notification.type] || Bell
                const iconColor = notificationColors[notification.type] || 'text-muted-foreground'
                const link = getNotificationLink(notification)

                const content = (
                  <div
                    className={`flex items-start gap-3 px-4 py-3 hover:bg-muted transition-colors cursor-pointer ${
                      !notification.is_read ? 'bg-primary/5' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className={`mt-0.5 ${iconColor}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!notification.is_read ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                        {notification.title}
                      </p>
                      {notification.message && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatTime(notification.created_at)}
                      </p>
                    </div>
                    {!notification.is_read && (
                      <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                    )}
                  </div>
                )

                return link ? (
                  <Link key={notification.id} to={link}>
                    {content}
                  </Link>
                ) : (
                  <div key={notification.id}>{content}</div>
                )
              })
            )}
          </div>

          {notifications.length > 0 && (
            <div className="px-4 py-2 border-t border-border">
              <Link
                to="/notifications"
                className="text-xs text-primary hover:underline"
                onClick={() => setIsOpen(false)}
              >
                View all notifications
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
