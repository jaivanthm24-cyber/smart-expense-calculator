import React, { createContext, useContext, useState, useEffect } from 'react'
import { api } from '@/services/api'
import { User, AuthTokens } from '@/types'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (tokens: AuthTokens) => void
  logout: () => Promise<void>
  updateUser: (updated: User) => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('user')
    return saved ? JSON.parse(saved) : null
  })
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const refreshUser = async () => {
    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        setUser(null)
        setIsLoading(false)
        return
      }
      const res = await api.get('/auth/me')
      setUser(res.data)
      localStorage.setItem('user', JSON.stringify(res.data))
    } catch {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user')
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    refreshUser()
  }, [])

  const login = (tokens: AuthTokens) => {
    localStorage.setItem('access_token', tokens.access_token)
    localStorage.setItem('refresh_token', tokens.refresh_token)
    localStorage.setItem('user', JSON.stringify(tokens.user))
    setUser(tokens.user)
  }

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token')
      await api.post('/auth/logout', { refresh_token: refreshToken })
    } catch {
      // Proceed with local logout regardless
    } finally {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user')
      setUser(null)
      window.location.href = '/login'
    }
  }

  const updateUser = (updated: User) => {
    setUser(updated)
    localStorage.setItem('user', JSON.stringify(updated))
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        updateUser,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
