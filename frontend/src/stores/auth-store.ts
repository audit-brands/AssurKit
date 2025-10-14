import { create } from 'zustand'
import { apiClient } from '@/lib/api-client'
import api from '@/lib/api-client'

export interface User {
  id: string
  email: string
  name: string
  role: 'Admin' | 'Manager' | 'Tester' | 'Viewer'
  created_at: string
  updated_at: string
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null

  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  logout: () => void
  fetchUser: () => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.post('/auth/login', { email, password })
      const { access_token, refresh_token, user } = response.data

      apiClient.setTokens(access_token, refresh_token)
      set({
        user,
        isAuthenticated: true,
        isLoading: false
      })
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Login failed',
        isLoading: false
      })
      throw error
    }
  },

  register: async (email: string, password: string, name: string) => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.post('/auth/register', {
        email,
        password,
        name,
        role: 'Viewer' // Default role for new registrations
      })
      const { access_token, refresh_token, user } = response.data

      apiClient.setTokens(access_token, refresh_token)
      set({
        user,
        isAuthenticated: true,
        isLoading: false
      })
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Registration failed',
        isLoading: false
      })
      throw error
    }
  },

  logout: () => {
    apiClient.clearTokens()
    set({
      user: null,
      isAuthenticated: false,
      error: null
    })
  },

  fetchUser: async () => {
    if (!apiClient.isAuthenticated()) {
      set({ user: null, isAuthenticated: false })
      return
    }

    set({ isLoading: true })
    try {
      const response = await api.get('/api/me')
      set({
        user: response.data,
        isAuthenticated: true,
        isLoading: false
      })
    } catch (error) {
      apiClient.clearTokens()
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false
      })
    }
  },

  clearError: () => set({ error: null })
}))