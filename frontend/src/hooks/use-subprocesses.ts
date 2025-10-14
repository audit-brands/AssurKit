import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api-client'

export interface Subprocess {
  id: string
  process_id: string
  subprocess_name: string
  description?: string
  owner?: string
  metadata?: Record<string, unknown>
  status: 'Active' | 'Inactive'
  created_at: string
  updated_at: string
}

export interface CreateSubprocessData {
  process_id: string
  subprocess_name: string
  description?: string
  owner?: string
  metadata?: Record<string, unknown>
}

export interface UpdateSubprocessData extends CreateSubprocessData {
  status?: 'Active' | 'Inactive'
}

// Fetch all subprocesses
export function useSubprocesses() {
  return useQuery({
    queryKey: ['subprocesses'],
    queryFn: async (): Promise<Subprocess[]> => {
      const response = await api.get('/api/subprocesses')
      return response.data
    }
  })
}

// Fetch subprocesses by process
export function useSubprocessesByProcess(processId: string) {
  return useQuery({
    queryKey: ['subprocesses', 'process', processId],
    queryFn: async (): Promise<Subprocess[]> => {
      const response = await api.get(`/api/subprocesses?process_id=${processId}`)
      return response.data
    },
    enabled: !!processId
  })
}

// Fetch single subprocess
export function useSubprocess(id: string) {
  return useQuery({
    queryKey: ['subprocesses', id],
    queryFn: async (): Promise<Subprocess> => {
      const response = await api.get(`/api/subprocesses/${id}`)
      return response.data
    },
    enabled: !!id
  })
}

// Create subprocess mutation
export function useCreateSubprocess() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateSubprocessData): Promise<Subprocess> => {
      const response = await api.post('/api/manage/subprocesses', data)
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['subprocesses'] })
      queryClient.invalidateQueries({ queryKey: ['subprocesses', 'process', variables.process_id] })
    }
  })
}

// Update subprocess mutation
export function useUpdateSubprocess() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateSubprocessData }): Promise<Subprocess> => {
      const response = await api.put(`/api/manage/subprocesses/${id}`, data)
      return response.data
    },
    onSuccess: (updatedSubprocess, variables) => {
      queryClient.invalidateQueries({ queryKey: ['subprocesses'] })
      queryClient.invalidateQueries({ queryKey: ['subprocesses', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['subprocesses', 'process', updatedSubprocess.process_id] })
    }
  })
}

// Delete subprocess mutation
export function useDeleteSubprocess() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await api.delete(`/api/manage/subprocesses/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subprocesses'] })
    }
  })
}