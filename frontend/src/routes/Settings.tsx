import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  User,
  Lock,
  Bell,
  Palette,
  Trash2,
  Save,
  FolderKanban,
  Lightbulb,
  Pin,
  Eye,
  EyeOff,
  Check
} from 'lucide-react'
import type { User as UserType } from '../lib/auth'
import { authService } from '../lib/auth'
import { api } from '../lib/api'
import { usePinnedTeam } from '../lib/pinnedTeam'
import ThemeToggle from '../components/ThemeToggle'
import NavUser from '../components/NavUser'
import NotificationBell from '../components/NotificationBell'
import { Card } from '../components/ui/card'

interface SettingsProps {
  user: UserType
  onUserUpdate?: (user: UserType) => void
}

export default function Settings({ user, onUserUpdate }: SettingsProps) {
  const navigate = useNavigate()
  const { pinnedTeam } = usePinnedTeam()

  // Profile state
  const [profileData, setProfileData] = useState({
    full_name: user.full_name || '',
    email: user.email,
  })
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileSuccess, setProfileSuccess] = useState(false)
  const [profileError, setProfileError] = useState('')

  // Password state
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  })
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [passwordError, setPasswordError] = useState('')

  // Notification preferences
  const [notifications, setNotifications] = useState({
    email_comments: true,
    email_votes: false,
    email_team_invites: true,
    email_app_updates: true,
  })
  const [notifLoading, setNotifLoading] = useState(false)
  const [notifSuccess, setNotifSuccess] = useState(false)

  // Delete account state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileLoading(true)
    setProfileError('')
    setProfileSuccess(false)

    try {
      const response = await api.put('/auth/me', {
        full_name: profileData.full_name.trim() || null,
        email: profileData.email.trim(),
      })

      if (onUserUpdate) {
        onUserUpdate(response.data)
      }
      setProfileSuccess(true)
      setTimeout(() => setProfileSuccess(false), 3000)
    } catch (err: any) {
      setProfileError(err.response?.data?.detail || 'Failed to update profile')
    } finally {
      setProfileLoading(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (passwordData.new_password !== passwordData.confirm_password) {
      setPasswordError('New passwords do not match')
      return
    }

    if (passwordData.new_password.length < 8) {
      setPasswordError('Password must be at least 8 characters')
      return
    }

    setPasswordLoading(true)
    setPasswordError('')
    setPasswordSuccess(false)

    try {
      await api.put('/auth/password', {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
      })

      setPasswordSuccess(true)
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: '',
      })
      setTimeout(() => setPasswordSuccess(false), 3000)
    } catch (err: any) {
      setPasswordError(err.response?.data?.detail || 'Failed to update password')
    } finally {
      setPasswordLoading(false)
    }
  }

  const handleNotificationSave = async () => {
    setNotifLoading(true)
    try {
      await api.put('/auth/notifications', notifications)
      setNotifSuccess(true)
      setTimeout(() => setNotifSuccess(false), 3000)
    } catch (err) {
      console.error('Failed to save notifications:', err)
    } finally {
      setNotifLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== user.username) return

    setDeleteLoading(true)
    try {
      await api.delete('/auth/me')
      authService.logout()
      navigate('/login')
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to delete account')
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-6">
              <Link to="/" className="text-xl font-bold text-foreground">
                App Showcase
              </Link>
              <div className="hidden sm:flex items-center gap-4">
                <Link
                  to="/teams"
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

      <main className="max-w-3xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/teams"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your account settings and preferences</p>
        </div>

        <div className="space-y-6">
          {/* Profile Settings */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-primary/10 rounded-lg">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Profile</h2>
                <p className="text-sm text-muted-foreground">Your personal information</p>
              </div>
            </div>

            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={user.username}
                  disabled
                  className="w-full px-4 py-2 border border-border bg-secondary/50 text-muted-foreground rounded-lg cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground mt-1">Username cannot be changed</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={profileData.full_name}
                  onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                  placeholder="Enter your full name"
                  className="w-full px-4 py-2 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {profileError && (
                <p className="text-sm text-destructive">{profileError}</p>
              )}

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={profileLoading}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  {profileLoading ? 'Saving...' : 'Save Changes'}
                </button>
                {profileSuccess && (
                  <span className="inline-flex items-center gap-1 text-sm text-green-600">
                    <Check className="w-4 h-4" />
                    Saved
                  </span>
                )}
              </div>
            </form>
          </Card>

          {/* Password Settings */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Lock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Password</h2>
                <p className="text-sm text-muted-foreground">Update your password</p>
              </div>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={passwordData.current_password}
                    onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                    className="w-full px-4 py-2 pr-10 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordData.new_password}
                    onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                    className="w-full px-4 py-2 pr-10 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={passwordData.confirm_password}
                  onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                  className="w-full px-4 py-2 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {passwordError && (
                <p className="text-sm text-destructive">{passwordError}</p>
              )}

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={passwordLoading || !passwordData.current_password || !passwordData.new_password}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  <Lock className="w-4 h-4" />
                  {passwordLoading ? 'Updating...' : 'Update Password'}
                </button>
                {passwordSuccess && (
                  <span className="inline-flex items-center gap-1 text-sm text-green-600">
                    <Check className="w-4 h-4" />
                    Password updated
                  </span>
                )}
              </div>
            </form>
          </Card>

          {/* Appearance Settings */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Palette className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Appearance</h2>
                <p className="text-sm text-muted-foreground">Customize how the app looks</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Theme</p>
                  <p className="text-sm text-muted-foreground">Select your preferred theme</p>
                </div>
                <ThemeToggle />
              </div>
            </div>
          </Card>

          {/* Notification Settings */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Bell className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Notifications</h2>
                <p className="text-sm text-muted-foreground">Manage your notification preferences</p>
              </div>
            </div>

            <div className="space-y-4">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="font-medium text-foreground">Comments</p>
                  <p className="text-sm text-muted-foreground">Get notified when someone comments on your apps</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.email_comments}
                  onChange={(e) => setNotifications({ ...notifications, email_comments: e.target.checked })}
                  className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="font-medium text-foreground">Votes</p>
                  <p className="text-sm text-muted-foreground">Get notified when someone votes on your apps</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.email_votes}
                  onChange={(e) => setNotifications({ ...notifications, email_votes: e.target.checked })}
                  className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="font-medium text-foreground">Team Invitations</p>
                  <p className="text-sm text-muted-foreground">Get notified when you're invited to a team</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.email_team_invites}
                  onChange={(e) => setNotifications({ ...notifications, email_team_invites: e.target.checked })}
                  className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="font-medium text-foreground">App Updates</p>
                  <p className="text-sm text-muted-foreground">Get notified about updates to apps you follow</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.email_app_updates}
                  onChange={(e) => setNotifications({ ...notifications, email_app_updates: e.target.checked })}
                  className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
                />
              </label>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleNotificationSave}
                  disabled={notifLoading}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  {notifLoading ? 'Saving...' : 'Save Preferences'}
                </button>
                {notifSuccess && (
                  <span className="inline-flex items-center gap-1 text-sm text-green-600">
                    <Check className="w-4 h-4" />
                    Saved
                  </span>
                )}
              </div>
            </div>
          </Card>

          {/* Danger Zone */}
          <Card className="p-6 border-destructive/30">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-destructive/10 rounded-lg">
                <Trash2 className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-destructive">Danger Zone</h2>
                <p className="text-sm text-muted-foreground">Irreversible actions</p>
              </div>
            </div>

            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 border border-destructive text-destructive rounded-lg hover:bg-destructive/10 transition-colors"
              >
                Delete Account
              </button>
            ) : (
              <div className="space-y-4 p-4 bg-destructive/5 rounded-lg border border-destructive/20">
                <p className="text-sm text-foreground">
                  This action cannot be undone. This will permanently delete your account, all your apps,
                  and remove you from all teams.
                </p>
                <p className="text-sm text-foreground">
                  Please type <strong>{user.username}</strong> to confirm:
                </p>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Enter your username"
                  className="w-full px-4 py-2 border border-destructive/30 bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-destructive"
                />
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleteLoading || deleteConfirmText !== user.username}
                    className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 disabled:opacity-50 transition-colors"
                  >
                    {deleteLoading ? 'Deleting...' : 'Delete My Account'}
                  </button>
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false)
                      setDeleteConfirmText('')
                    }}
                    className="px-4 py-2 border border-border rounded-lg hover:bg-secondary transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  )
}
