import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { api } from './api'
import type { Team } from './types'

interface PinnedTeamContextType {
  pinnedTeam: Team | null
  pinnedTeamId: string | null
  pinTeam: (team: Team) => void
  unpinTeam: () => void
  isPinned: (teamId: string) => boolean
}

const PinnedTeamContext = createContext<PinnedTeamContextType | undefined>(undefined)

export function PinnedTeamProvider({ children }: { children: ReactNode }) {
  const [pinnedTeamId, setPinnedTeamId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('pinnedTeamId')
    }
    return null
  })
  const [pinnedTeam, setPinnedTeam] = useState<Team | null>(null)

  // Fetch pinned team details when ID changes
  useEffect(() => {
    if (pinnedTeamId) {
      api.get(`/teams/${pinnedTeamId}`)
        .then(response => {
          setPinnedTeam(response.data as Team)
        })
        .catch(() => {
          // Team not found or error, clear the pin
          localStorage.removeItem('pinnedTeamId')
          setPinnedTeamId(null)
          setPinnedTeam(null)
        })
    } else {
      setPinnedTeam(null)
    }
  }, [pinnedTeamId])

  const pinTeam = (team: Team) => {
    localStorage.setItem('pinnedTeamId', team.id)
    setPinnedTeamId(team.id)
    setPinnedTeam(team)
  }

  const unpinTeam = () => {
    localStorage.removeItem('pinnedTeamId')
    setPinnedTeamId(null)
    setPinnedTeam(null)
  }

  const isPinned = (teamId: string) => pinnedTeamId === teamId

  return (
    <PinnedTeamContext.Provider value={{ pinnedTeam, pinnedTeamId, pinTeam, unpinTeam, isPinned }}>
      {children}
    </PinnedTeamContext.Provider>
  )
}

export function usePinnedTeam() {
  const context = useContext(PinnedTeamContext)
  if (context === undefined) {
    throw new Error('usePinnedTeam must be used within a PinnedTeamProvider')
  }
  return context
}
