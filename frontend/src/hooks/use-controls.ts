import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api-client'
import type { PaginatedResult, PaginationMetadata } from '@/lib/pagination'
import { normalizeLimit, normalizePage } from '@/lib/pagination'

export type ControlAutomation = 'Manual' | 'Semi-Automated' | 'Automated'
export type ControlFrequency = 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly' | 'Annual' | 'Ad-hoc'
export type ControlType = 'Preventive' | 'Detective' | 'Corrective'
export type ControlStatus = 'Draft' | 'Active' | 'Retired'

export interface ControlSummary {
  id: string
  control_name: string
  business_id?: string
  control_type: ControlType
  frequency: ControlFrequency
  automation: ControlAutomation
  key_control: boolean
  owner?: string
  reviewer?: string
  status: ControlStatus
  created_at: string
  updated_at: string
  risk_count: number
  frequency_weight?: number
  automation_score?: number
}

export interface ControlRisk {
  id: string
  name: string
  subprocess: {
    id: string
    name: string
    process: {
      id: string
      name: string
      company: {
        id: string
        name: string
      }
    }
  }
}

export interface ControlDetail extends ControlSummary {
  description?: string
  owner?: string
  reviewer?: string
  metadata?: Record<string, unknown>
  testing_procedures?: string
  status: ControlStatus
  risks: ControlRisk[]
}

export interface ControlListParams {
  page?: number
  limit?: number
  search?: string
  riskId?: string
  controlType?: ControlType
  automation?: ControlAutomation
  status?: ControlStatus
  isKeyControl?: boolean
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
  control_id: string | null
  name: string
  description: string | null
  control_type: string
  frequency: string
  automation_level: string
  is_key_control: boolean
  owner_email: string | null
  reviewer_email: string | null
  status: string
  created_at: string
  updated_at?: string
  metadata?: Record<string, unknown> | null
  frequency_weight?: number
  automation_score?: number
  risks_count?: number
}

interface ApiControlDetail extends ApiControlSummary {
  evidence_requirements?: string | null
  risks?: Array<{
    id: string
    name: string
    subprocess: {
      id: string
      name: string
      process: {
        id: string
        name: string
        company: {
          id: string
          name: string
        }
      }
    }
  }>
}

const automationMap: Record<string, ControlAutomation> = {
  Manual: 'Manual',
  'Semi-automated': 'Semi-Automated',
  'Semi-Automated': 'Semi-Automated',
  Automated: 'Automated',
}

const reverseAutomationMap: Record<ControlAutomation, string> = {
  Manual: 'Manual',
  'Semi-Automated': 'Semi-automated',
  Automated: 'Automated',
}

const mapApiControlSummary = (control: ApiControlSummary): ControlSummary => ({
  id: control.id,
  control_name: control.name,
  business_id: control.control_id ?? undefined,
  control_type: (control.control_type ?? 'Preventive') as ControlType,
  frequency: (control.frequency ?? 'Monthly') as ControlFrequency,
  automation: automationMap[control.automation_level] ?? 'Manual',
  key_control: !!control.is_key_control,
  owner: control.owner_email ?? undefined,
  reviewer: control.reviewer_email ?? undefined,
  status: (control.status ?? 'Draft') as ControlStatus,
  created_at: control.created_at,
  updated_at: control.updated_at ?? control.created_at,
  risk_count: control.risks_count ?? 0,
  frequency_weight: control.frequency_weight,
  automation_score: control.automation_score,
})

const mapApiControlDetail = (control: ApiControlDetail): ControlDetail => ({
  ...mapApiControlSummary(control),
  description: control.description ?? undefined,
  metadata: control.metadata ?? undefined,
  testing_procedures: control.evidence_requirements ?? undefined,
  risks: (control.risks ?? []).map(risk => ({
    id: risk.id,
    name: risk.name,
    subprocess: risk.subprocess,
  })),
})

const buildControlPayload = (data: Partial<CreateControlData | UpdateControlData>) => {
  const payload: Record<string, unknown> = {}

  if (data.control_name !== undefined) payload.name = data.control_name
  if (data.control_type !== undefined) payload.control_type = data.control_type
  if (data.frequency !== undefined) payload.frequency = data.frequency
  if (data.automation !== undefined) payload.automation_level = reverseAutomationMap[data.automation]
  if (data.key_control !== undefined) payload.is_key_control = data.key_control
  if (data.description !== undefined) payload.description = data.description
  if (data.owner !== undefined) payload.owner_email = data.owner
  if (data.reviewer !== undefined) payload.reviewer_email = data.reviewer
  if (data.testing_procedures !== undefined) payload.evidence_requirements = data.testing_procedures
  if (data.metadata !== undefined) payload.metadata = data.metadata
  if (data.status !== undefined) payload.status = data.status

  return payload
}

export function useControls(params: ControlListParams = {}) {
  const page = normalizePage(params.page)
  const limit = normalizeLimit(params.limit)
  const search = params.search?.trim() || undefined
  const riskId = params.riskId
  const controlType = params.controlType
  const automation = params.automation
  const status = params.status
  const isKeyControl = params.isKeyControl

  return useQuery({
    queryKey: ['controls', page, limit, search, riskId, controlType, automation, status, isKeyControl],
    queryFn: async (): Promise<PaginatedResult<ControlSummary>> => {
      const response = await api.get('/api/controls', {
        params: {
          page,
          limit,
          search,
          risk_id: riskId,
          control_type: controlType,
          automation_level: automation ? reverseAutomationMap[automation] : undefined,
          status,
          is_key_control: typeof isKeyControl === 'boolean' ? Number(isKeyControl) : undefined,
        },
      })

      const payload = response.data as { data?: ApiControlSummary[]; pagination?: PaginationMetadata }
      const items = (payload.data ?? []).map(mapApiControlSummary)
      const pagination = payload.pagination ?? {
        page,
        limit,
        total: payload.data?.length ?? items.length,
        pages: Math.max(1, Math.ceil((payload.data?.length ?? items.length) / limit)),
      }

      return { items, pagination }
    },
  })
}

export function useControlsByRisk(riskId: string, params: Omit<ControlListParams, 'riskId'> = {}) {
  return useControls({ ...params, riskId })
}

export function useControl(id: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['controls', 'detail', id],
    queryFn: async (): Promise<ControlDetail> => {
      const response = await api.get(`/api/controls/${id}`)
      return mapApiControlDetail(response.data as ApiControlDetail)
    },
    enabled: options?.enabled ?? !!id,
  })
}

export function useCreateControl() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateControlData): Promise<ControlDetail> => {
      const { risk_id, ...controlData } = data
      const payload = buildControlPayload(controlData)
      const response = await api.post('/api/manage/controls', payload)
      const detail = mapApiControlDetail((response.data?.control ?? response.data) as ApiControlDetail)

      if (risk_id) {
        await api.post('/api/manage/risk-control-matrix/assign', {
          risk_id,
          control_id: detail.id,
          effectiveness: 'Not Effective',
        })
      }

      await queryClient.invalidateQueries({ queryKey: ['controls'] })
      await queryClient.invalidateQueries({ queryKey: ['controls', 'detail', detail.id] })

      return detail
    },
  })
}

export function useUpdateControl() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & UpdateControlData): Promise<ControlDetail> => {
      const { risk_id, previous_risk_id, ...controlData } = data
      const payload = buildControlPayload(controlData)
      const response = await api.put(`/api/manage/controls/${id}`, payload)
      const detail = mapApiControlDetail((response.data?.control ?? response.data) as ApiControlDetail)

      if (previous_risk_id && previous_risk_id !== risk_id) {
        await api.delete('/api/manage/risk-control-matrix/remove', {
          data: {
            risk_id: previous_risk_id,
            control_id: id,
          },
        })
      }

      if (risk_id && risk_id !== previous_risk_id) {
        await api.post('/api/manage/risk-control-matrix/assign', {
          risk_id,
          control_id: id,
          effectiveness: 'Not Effective',
        })
      }

      await queryClient.invalidateQueries({ queryKey: ['controls'] })
      await queryClient.invalidateQueries({ queryKey: ['controls', 'detail', id] })

      return detail
    },
  })
}

export function useDeleteControl() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const response = await api.get(`/api/controls/${id}`)
      const detail = mapApiControlDetail(response.data as ApiControlDetail)

      for (const risk of detail.risks) {
        await api.delete('/api/manage/risk-control-matrix/remove', {
          data: {
            risk_id: risk.id,
            control_id: id,
          },
        })
      }

      await api.delete(`/api/manage/controls/${id}`)
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['controls'] })
      queryClient.invalidateQueries({ queryKey: ['controls', 'detail', id] })
    },
  })
}
