import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api-client'

export interface Process {
  id: string
  company_id: string
  process_name: string
  description?: string
  owner?: string
  metadata?: Record<string, unknown>
  status: 'Active' | 'Inactive'
  created_at: string
  updated_at: string
}

export interface CreateProcessData {
  company_id: string
  process_name: string
  description?: string
  owner?: string
  metadata?: Record<string, unknown>
}

export interface UpdateProcessData extends CreateProcessData {
  status?: 'Active' | 'Inactive'
}

// Fetch all processes
export function useProcesses() {
  return useQuery({
    queryKey: ['processes'],
    queryFn: async (): Promise<Process[]> => {
      const response = await api.get('/api/processes')
      return response.data
    }
  })
}

// Fetch processes by company
export function useProcessesByCompany(companyId: string) {
  return useQuery({
    queryKey: ['processes', 'company', companyId],
    queryFn: async (): Promise<Process[]> => {
      const response = await api.get(`/api/processes?company_id=${companyId}`)
      return response.data
    },
    enabled: !!companyId
  })
}

// Fetch single process
export function useProcess(id: string) {
  return useQuery({
    queryKey: ['processes', id],
    queryFn: async (): Promise<Process> => {
      const response = await api.get(`/api/processes/${id}`)
      return response.data
    },
    enabled: !!id
  })
}

// Create process mutation
export function useCreateProcess() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateProcessData): Promise<Process> => {
      const response = await api.post('/api/manage/processes', data)
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['processes'] })
      queryClient.invalidateQueries({ queryKey: ['processes', 'company', variables.company_id] })
    }
  })
}

// Update process mutation
export function useUpdateProcess() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateProcessData }): Promise<Process> => {
      const response = await api.put(`/api/manage/processes/${id}`, data)
      return response.data
    },
    onSuccess: (updatedProcess, variables) => {
      queryClient.invalidateQueries({ queryKey: ['processes'] })
      queryClient.invalidateQueries({ queryKey: ['processes', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['processes', 'company', updatedProcess.company_id] })
    }
  })
}

// Delete process mutation
export function useDeleteProcess() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await api.delete(`/api/manage/processes/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['processes'] })
    }
  })
}