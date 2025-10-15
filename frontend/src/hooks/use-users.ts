import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api-client'

export interface User {
  id: string
  name: string
  email: string
  roles: string[]
  created_at: string
  updated_at: string
}

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await api.get('/users')
      return response.data as User[]
    }
  })
}

export function useUser(id: string) {
  return useQuery({
    queryKey: ['user', id],
    queryFn: async () => {
      const response = await api.get(`/users/${id}`)
      return response.data as User
    },
    enabled: !!id
  })
}