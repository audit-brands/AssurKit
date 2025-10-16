import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api-client'

export type RiskImpact = 'Low' | 'Medium' | 'High' | 'Critical'
export type RiskLikelihood = 'Rare' | 'Unlikely' | 'Possible' | 'Likely' | 'Almost Certain'

export interface Risk {
  id: string
  subprocess_id: string
  process_id?: string
  company_id?: string
  risk_name: string
  description?: string
  risk_category?: string
  assertions?: string[]
  impact?: RiskImpact
  likelihood?: RiskLikelihood
  inherent_risk_score?: number
  risk_level?: string
  metadata?: Record<string, unknown>
  status: 'Active' | 'Inactive'
  created_at: string
  updated_at: string
  subprocess_name?: string
  process_name?: string
  company_name?: string
}

export interface CreateRiskData {
  subprocess_id: string
  risk_name: string
  description?: string
  risk_category?: string
  assertions?: string[]
  impact?: RiskImpact
  likelihood?: RiskLikelihood
  inherent_risk_score?: number
  metadata?: Record<string, unknown>
}

export interface UpdateRiskData extends CreateRiskData {
  status?: 'Active' | 'Inactive'
}

interface ApiRiskSummary {
  id: string
  name: string
  description?: string | null
  risk_type?: string | null
  likelihood?: string | null
  impact?: string | null
  risk_level?: string | null
  calculated_risk_score?: number | null
  assertions?: string[] | null
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
  controls_count?: number
  is_active: boolean
  created_at: string
  updated_at?: string
}

interface ApiRiskDetail extends ApiRiskSummary {
  metadata?: Record<string, unknown> | null
}

const apiImpactToUi: Record<string, RiskImpact> = {
  'Very Low': 'Low',
  'Low': 'Low',
  'Medium': 'Medium',
  'High': 'High',
  'Very High': 'Critical',
}

const uiImpactToApi: Record<RiskImpact, string> = {
  Low: 'Low',
  Medium: 'Medium',
  High: 'High',
  Critical: 'Very High',
}

const apiLikelihoodToUi: Record<string, RiskLikelihood> = {
  'Very Low': 'Rare',
  'Low': 'Unlikely',
  'Medium': 'Possible',
  'High': 'Likely',
  'Very High': 'Almost Certain',
}

const uiLikelihoodToApi: Record<RiskLikelihood, string> = {
  Rare: 'Very Low',
  Unlikely: 'Low',
  Possible: 'Medium',
  Likely: 'High',
  'Almost Certain': 'Very High',
}

const mapApiRiskToRisk = (risk: ApiRiskSummary | ApiRiskDetail): Risk => {
  const metadata = (risk as ApiRiskDetail).metadata ?? undefined
  const impact = risk.impact ? apiImpactToUi[risk.impact] ?? 'Medium' : undefined
  const likelihood = risk.likelihood ? apiLikelihoodToUi[risk.likelihood] ?? 'Possible' : undefined
  const assertions = Array.isArray(risk.assertions) ? risk.assertions : undefined

  return {
    id: risk.id,
    subprocess_id: risk.subprocess.id,
    subprocess_name: risk.subprocess.name,
    process_id: risk.subprocess.process.id,
    process_name: risk.subprocess.process.name,
    company_id: risk.subprocess.process.company.id,
    company_name: risk.subprocess.process.company.name,
    risk_name: risk.name,
    description: risk.description ?? undefined,
    risk_category: risk.risk_type ?? undefined,
    assertions,
    impact,
    likelihood,
    inherent_risk_score: risk.calculated_risk_score ?? undefined,
    risk_level: risk.risk_level ?? undefined,
    metadata,
    status: risk.is_active ? 'Active' : 'Inactive',
    created_at: risk.created_at,
    updated_at: risk.updated_at ?? risk.created_at,
  }
}

const buildRiskPayload = (data: Partial<CreateRiskData & { status?: 'Active' | 'Inactive' }>) => {
  const payload: Record<string, unknown> = {}

  if (data.subprocess_id !== undefined) {
    payload.subprocess_id = data.subprocess_id
  }

  if (data.risk_name !== undefined) {
    payload.name = data.risk_name
  }

  if (data.description !== undefined) {
    payload.description = data.description
  }

  if (data.risk_category !== undefined) {
    payload.risk_type = data.risk_category
  }

  if (data.likelihood !== undefined) {
    payload.likelihood = uiLikelihoodToApi[data.likelihood]
  }

  if (data.impact !== undefined) {
    payload.impact = uiImpactToApi[data.impact]
  }

  if (data.assertions !== undefined) {
    payload.assertions = data.assertions
  }

  if (data.metadata !== undefined) {
    payload.metadata = data.metadata
  }

  if (data.status !== undefined) {
    payload.is_active = data.status === 'Active'
  }

  return payload
}

// Fetch all risks
export function useRisks() {
  return useQuery({
    queryKey: ['risks'],
    queryFn: async (): Promise<Risk[]> => {
      const response = await api.get('/api/risks')
      const risks = (response.data?.data ?? []) as ApiRiskSummary[]
      return risks.map(mapApiRiskToRisk)
    }
  })
}

// Fetch risks by subprocess
export function useRisksBySubprocess(subprocessId: string) {
  return useQuery({
    queryKey: ['risks', 'subprocess', subprocessId],
    queryFn: async (): Promise<Risk[]> => {
      const response = await api.get('/api/risks', {
        params: { subprocess_id: subprocessId }
      })
      const risks = (response.data?.data ?? []) as ApiRiskSummary[]
      return risks.map(mapApiRiskToRisk)
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
      return mapApiRiskToRisk(response.data as ApiRiskDetail)
    },
    enabled: !!id
  })
}

// Create risk mutation
export function useCreateRisk() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateRiskData): Promise<Risk> => {
      const payload = buildRiskPayload(data)
      const response = await api.post('/api/manage/risks', payload)
      const apiRisk = (response.data?.risk ?? response.data) as ApiRiskDetail
      return mapApiRiskToRisk(apiRisk)
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
      const payload = buildRiskPayload(data)
      const response = await api.put(`/api/manage/risks/${id}`, payload)
      const apiRisk = (response.data?.risk ?? response.data) as ApiRiskDetail
      return mapApiRiskToRisk(apiRisk)
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
