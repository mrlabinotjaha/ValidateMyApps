import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { authService } from '../lib/auth'
import type { User } from '../lib/auth'

interface OAuthCallbackProps {
  onLogin: (user: User) => void
}

export default function OAuthCallback({ onLogin }: OAuthCallbackProps) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [error, setError] = useState('')

  useEffect(() => {
    const token = searchParams.get('token')

    if (token) {
      // Store the token
      localStorage.setItem('access_token', token)

      // Get user info and complete login
      authService.getCurrentUser()
        .then(user => {
          onLogin(user)
          navigate('/')
        })
        .catch(() => {
          localStorage.removeItem('access_token')
          navigate('/login?error=oauth_failed')
        })
    } else {
      setError('No authentication token received')
      setTimeout(() => {
        navigate('/login?error=no_token')
      }, 2000)
    }
  }, [searchParams, onLogin, navigate])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-destructive mb-2">{error}</p>
          <p className="text-muted-foreground">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Completing sign-in...</p>
      </div>
    </div>
  )
}
