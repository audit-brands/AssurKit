import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api-client'

export interface Control {
  id: string
  risk_id: string
  control_name: string
  control_type: 'Preventive' | 'Detective' | 'Corrective' | 'Compensating'
  frequency: 'Real-time' | 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly' | 'Annual' | 'Ad-hoc'
  automation: 'Manual' | 'Semi-Automated' | 'Automated'
  key_control: boolean
  description?: string
  owner?: string
  testing_procedures?: string
  metadata?: Record<string, unknown>
  status: 'Draft' | 'Active' | 'Retired'
  created_at: string
  updated_at: string
}

export interface CreateControlData {
  risk_id: string
  control_name: string
  control_type: 'Preventive' | 'Detective' | 'Corrective' | 'Compensating'
  frequency: 'Real-time' | 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly' | 'Annual' | 'Ad-hoc'
  automation: 'Manual' | 'Semi-Automated' | 'Automated'
  key_control: boolean
  description?: string
  owner?: string
  testing_procedures?: string
  metadata?: Record<string, unknown>
}

export interface UpdateControlData extends CreateControlData {
  status?: 'Draft' | 'Active' | 'Retired'
}

// Fetch all controls
export function useControls() {
  return useQuery({
    queryKey: ['controls'],
    queryFn: async (): Promise<Control[]> => {
      const response = await api.get('/api/controls')
      return response.data
    }
  })
}

// Fetch controls by risk
export function useControlsByRisk(riskId: string) {
  return useQuery({
    queryKey: ['controls', 'risk', riskId],
    queryFn: async (): Promise<Control[]> => {
      const response = await api.get(`/api/controls?risk_id=${riskId}`)
      return response.data
    },
    enabled: !!riskId
  })
}

// Fetch single control
export function useControl(id: string) {
  return useQuery({
    queryKey: ['controls', id],
    queryFn: async (): Promise<Control> => {
      const response = await api.get(`/api/controls/${id}`)
      return response.data
    },
    enabled: !!id
  })
}

// Create control mutation
export function useCreateControl() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateControlData): Promise<Control> => {
      const response = await api.post('/api/manage/controls', data)
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['controls'] })
      queryClient.invalidateQueries({ queryKey: ['controls', 'risk', variables.risk_id] })
    }
  })
}

// Update control mutation
export function useUpdateControl() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateControlData }): Promise<Control> => {
      const response = await api.put(`/api/manage/controls/${id}`, data)
      return response.data
    },
    onSuccess: (updatedControl, variables) => {
      queryClient.invalidateQueries({ queryKey: ['controls'] })
      queryClient.invalidateQueries({ queryKey: ['controls', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['controls', 'risk', updatedControl.risk_id] })
    }
  })
}

// Delete control mutation
export function useDeleteControl() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await api.delete(`/api/manage/controls/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['controls'] })
    }
  })
}