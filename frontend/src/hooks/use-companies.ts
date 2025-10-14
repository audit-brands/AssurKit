import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api-client'

export interface Company {
  id: string
  company_name: string
  industry: string
  country: string
  description?: string
  metadata?: Record<string, unknown>
  status: 'Active' | 'Inactive'
  created_at: string
  updated_at: string
}

export interface CreateCompanyData {
  company_name: string
  industry: string
  country: string
  description?: string
  metadata?: Record<string, unknown>
}

export interface UpdateCompanyData extends CreateCompanyData {
  status?: 'Active' | 'Inactive'
}

// Fetch all companies
export function useCompanies() {
  return useQuery({
    queryKey: ['companies'],
    queryFn: async (): Promise<Company[]> => {
      const response = await api.get('/api/companies')
      return response.data
    }
  })
}

// Fetch single company
export function useCompany(id: string) {
  return useQuery({
    queryKey: ['companies', id],
    queryFn: async (): Promise<Company> => {
      const response = await api.get(`/api/companies/${id}`)
      return response.data
    },
    enabled: !!id
  })
}

// Create company mutation
export function useCreateCompany() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateCompanyData): Promise<Company> => {
      const response = await api.post('/api/manage/companies', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] })
    }
  })
}

// Update company mutation
export function useUpdateCompany() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateCompanyData }): Promise<Company> => {
      const response = await api.put(`/api/manage/companies/${id}`, data)
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['companies'] })
      queryClient.invalidateQueries({ queryKey: ['companies', variables.id] })
    }
  })
}

// Delete company mutation
export function useDeleteCompany() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await api.delete(`/api/manage/companies/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] })
    }
  })
}