import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api-client'

export type ControlAutomation = 'Manual' | 'Semi-Automated' | 'Automated'
export type ControlFrequency = 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly' | 'Annual' | 'Ad-hoc'
export type ControlType = 'Preventive' | 'Detective' | 'Corrective'
export type ControlStatus = 'Draft' | 'Active' | 'Retired'

export interface Control {
  id: string
  risk_id?: string
  risk_ids: string[]
  control_name: string
  control_type: ControlType
  frequency: ControlFrequency
  automation: ControlAutomation
  key_control: boolean
  description?: string
  owner?: string
  reviewer?: string
  testing_procedures?: string
  metadata?: Record<string, unknown>
  status: ControlStatus
  created_at: string
  updated_at: string
  business_id?: string
}

export interface CreateControlData {
  risk_id?: string
  control_name: string
  control_type: ControlType
  frequency: ControlFrequency
  automation: ControlAutomation
  key_control: boolean
  description?: string
  owner?: string
  reviewer?: string
  testing_procedures?: string
  metadata?: Record<string, unknown>
  status?: ControlStatus
}

export interface UpdateControlData extends CreateControlData {
  previous_risk_id?: string
}

interface ApiControlSummary {
  id: string
  control_id: string
  name: string
  description: string
  control_type: string
  frequency: string
  automation_level: string
  is_key_control: boolean
  owner_email: string
  reviewer_email?: string | null
  status: string
  created_at: string
  updated_at?: string
  metadata?: Record<string, unknown> | null
}

interface ApiControlDetail extends ApiControlSummary {
  evidence_requirements?: unknown
  risks?: Array<{
    id: string
  }>
}

interface ApiRiskControlMatrixItem {
  risk_id: string
  controls: Array<{
    control_id: string
  }>
}

const automationMap: Record<string, ControlAutomation> = {
  Manual: 'Manual',
  'Semi-automated': 'Semi-Automated',
  Automated: 'Automated',
}

const reverseAutomationMap: Record<ControlAutomation, string> = {
  Manual: 'Manual',
  'Semi-Automated': 'Semi-automated',
  Automated: 'Automated',
}

const mapApiControlToControl = (control: ApiControlSummary | ApiControlDetail, riskIds: string[]): Control => {
  const metadata = control.metadata ?? undefined

  return {
    id: control.id,
    risk_id: riskIds[0],
    risk_ids: riskIds,
    control_name: control.name,
    control_type: (control.control_type ?? 'Preventive') as ControlType,
    frequency: (control.frequency ?? 'Monthly') as ControlFrequency,
    automation: automationMap[control.automation_level] ?? 'Manual',
    key_control: !!control.is_key_control,
    description: control.description ?? undefined,
    owner: control.owner_email ?? undefined,
    reviewer: control.reviewer_email ?? undefined,
    metadata,
    status: (control.status ?? 'Draft') as ControlStatus,
    created_at: control.created_at,
    updated_at: control.updated_at ?? control.created_at,
    business_id: control.control_id ?? undefined,
  }
}

const loadControls = async (): Promise<Control[]> => {
  const [controlsResponse, rcmResponse] = await Promise.all([
    api.get('/api/controls', { params: { limit: 1000 } }),
    api.get('/api/risk-control-matrix', { params: { limit: 1000 } }),
  ])

  const controlItems = (controlsResponse.data?.data ?? []) as ApiControlSummary[]
  const rcmItems = (rcmResponse.data?.data ?? []) as ApiRiskControlMatrixItem[]

  const controlRiskMap = new Map<string, Set<string>>()
  rcmItems.forEach(item => {
    item.controls.forEach(control => {
      if (!controlRiskMap.has(control.control_id)) {
        controlRiskMap.set(control.control_id, new Set<string>())
      }
      controlRiskMap.get(control.control_id)!.add(item.risk_id)
    })
  })

  return controlItems.map(control => {
    const riskIds = Array.from(controlRiskMap.get(control.id) ?? [])
    return mapApiControlToControl(control, riskIds)
  })
}

const buildControlPayload = (data: Partial<CreateControlData>): Record<string, unknown> => {
  const payload: Record<string, unknown> = {}

  if (data.control_name !== undefined) {
    payload.name = data.control_name
  }

  if (data.description !== undefined) {
    payload.description = data.description
  }

  if (data.control_type !== undefined) {
    payload.control_type = data.control_type
  }

  if (data.frequency !== undefined) {
    payload.frequency = data.frequency
  }

  if (data.automation !== undefined) {
    payload.automation_level = reverseAutomationMap[data.automation]
  }

  if (data.key_control !== undefined) {
    payload.is_key_control = data.key_control
  }

  if (data.owner !== undefined) {
    payload.owner_email = data.owner
  }

  if (data.reviewer !== undefined) {
    payload.reviewer_email = data.reviewer
  }

  if (data.metadata !== undefined) {
    payload.metadata = data.metadata
  }

  if (data.status !== undefined) {
    payload.status = data.status
  }

  return payload
}

// Fetch all controls
export function useControls() {
  return useQuery({
    queryKey: ['controls'],
    queryFn: loadControls,
  })
}

// Fetch controls by risk using cached controls
export function useControlsByRisk(riskId: string) {
  const { data, isLoading, error } = useControls()

  const controls = useMemo(() => {
    if (!data || !riskId) return []
    return data.filter(control => control.risk_ids.includes(riskId))
  }, [data, riskId])

  return {
    data: controls,
    isLoading,
    error,
  }
}

// Fetch single control
export function useControl(id: string) {
  return useQuery({
    queryKey: ['controls', id],
    queryFn: async (): Promise<Control> => {
      const response = await api.get(`/api/controls/${id}`)
      const control = response.data as ApiControlDetail
      const riskIds = control.risks?.map(risk => risk.id) ?? []
      return mapApiControlToControl(control, riskIds)
    },
    enabled: !!id
  })
}

// Create control mutation
export function useCreateControl() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateControlData): Promise<Control> => {
      const { risk_id, ...controlData } = data
      const payload = buildControlPayload(controlData)
      const response = await api.post('/api/manage/controls', payload)
      const apiControl = (response.data?.control ?? response.data) as ApiControlSummary

      if (risk_id) {
        await api.post('/api/manage/risk-control-matrix/assign', {
          risk_id,
          control_id: apiControl.id,
          effectiveness: 'Not Effective',
        })
      }

      const riskIds = risk_id ? [risk_id] : []
      return mapApiControlToControl(apiControl, riskIds)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['controls'] })
    }
  })
}

// Update control mutation
export function useUpdateControl() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateControlData }): Promise<Control> => {
      const { risk_id, previous_risk_id, ...controlData } = data
      const payload = buildControlPayload(controlData)
      const response = await api.put(`/api/manage/controls/${id}`, payload)
      const apiControl = (response.data?.control ?? response.data) as ApiControlSummary

      let removedPrevious = false

      if (previous_risk_id && previous_risk_id !== risk_id) {
        await api.delete('/api/manage/risk-control-matrix/remove', {
          data: {
            risk_id: previous_risk_id,
            control_id: id,
          },
        })
        removedPrevious = true
      }

      if (risk_id && (!previous_risk_id || previous_risk_id !== risk_id)) {
        await api.post('/api/manage/risk-control-matrix/assign', {
          risk_id,
          control_id: id,
          effectiveness: 'Not Effective',
        })
      }

      const resultingRiskIds = new Set<string>()
      if (risk_id) {
        resultingRiskIds.add(risk_id)
      } else if (previous_risk_id && !removedPrevious) {
        resultingRiskIds.add(previous_risk_id)
      }

      return mapApiControlToControl(apiControl, Array.from(resultingRiskIds))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['controls'] })
    }
  })
}

// Delete control mutation
export function useDeleteControl() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, risk_ids }: { id: string; risk_ids?: string[] }): Promise<void> => {
      if (risk_ids && risk_ids.length > 0) {
        for (const riskId of risk_ids) {
          await api.delete('/api/manage/risk-control-matrix/remove', {
            data: {
              risk_id: riskId,
              control_id: id,
            },
          })
        }
      }

      await api.delete(`/api/manage/controls/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['controls'] })
    }
  })
}
