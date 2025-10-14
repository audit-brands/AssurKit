import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api-client'

export interface Risk {
  id: string
  subprocess_id: string
  risk_name: string
  description?: string
  risk_category?: string
  assertions?: string[]
  impact?: 'Low' | 'Medium' | 'High' | 'Critical'
  likelihood?: 'Rare' | 'Unlikely' | 'Possible' | 'Likely' | 'Almost Certain'
  inherent_risk_score?: number
  metadata?: Record<string, unknown>
  status: 'Active' | 'Inactive'
  created_at: string
  updated_at: string
}

export interface CreateRiskData {
  subprocess_id: string
  risk_name: string
  description?: string
  risk_category?: string
  assertions?: string[]
  impact?: 'Low' | 'Medium' | 'High' | 'Critical'
  likelihood?: 'Rare' | 'Unlikely' | 'Possible' | 'Likely' | 'Almost Certain'
  inherent_risk_score?: number
  metadata?: Record<string, unknown>
}

export interface UpdateRiskData extends CreateRiskData {
  status?: 'Active' | 'Inactive'
}

// Fetch all risks
export function useRisks() {
  return useQuery({
    queryKey: ['risks'],
    queryFn: async (): Promise<Risk[]> => {
      const response = await api.get('/api/risks')
      return response.data
    }
  })
}

// Fetch risks by subprocess
export function useRisksBySubprocess(subprocessId: string) {
  return useQuery({
    queryKey: ['risks', 'subprocess', subprocessId],
    queryFn: async (): Promise<Risk[]> => {
      const response = await api.get(`/api/risks?subprocess_id=${subprocessId}`)
      return response.data
    },
    enabled: !!subprocessId
  })
}

// Fetch single risk
export function useRisk(id: string) {
  return useQuery({
    queryKey: ['risks', id],
    queryFn: async (): Promise<Risk> => {
      const response = await api.get(`/api/risks/${id}`)
      return response.data
    },
    enabled: !!id
  })
}

// Create risk mutation
export function useCreateRisk() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateRiskData): Promise<Risk> => {
      const response = await api.post('/api/manage/risks', data)
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['risks'] })
      queryClient.invalidateQueries({ queryKey: ['risks', 'subprocess', variables.subprocess_id] })
    }
  })
}

// Update risk mutation
export function useUpdateRisk() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateRiskData }): Promise<Risk> => {
      const response = await api.put(`/api/manage/risks/${id}`, data)
      return response.data
    },
    onSuccess: (updatedRisk, variables) => {
      queryClient.invalidateQueries({ queryKey: ['risks'] })
      queryClient.invalidateQueries({ queryKey: ['risks', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['risks', 'subprocess', updatedRisk.subprocess_id] })
    }
  })
}

// Delete risk mutation
export function useDeleteRisk() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await api.delete(`/api/manage/risks/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['risks'] })
    }
  })
}