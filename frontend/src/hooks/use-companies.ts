import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api-client'

export interface Company {
  id: string
  company_name: string
  industry: string
  country?: string
  description?: string
  metadata?: Record<string, unknown>
  ticker_symbol?: string
  processes_count?: number
  subprocesses_count?: number
  status: 'Active' | 'Inactive'
  created_at: string
  updated_at: string
}

export interface CreateCompanyData {
  company_name: string
  industry?: string
  country?: string
  description?: string
}

export interface UpdateCompanyData extends CreateCompanyData {
  status?: 'Active' | 'Inactive'
}

interface ApiCompanySummary {
  id: string
  name: string
  description?: string | null
  ticker_symbol?: string | null
  industry?: string | null
  is_active: boolean
  created_at: string
  metadata?: Record<string, unknown> | null
  updated_at?: string
  processes_count?: number
  subprocesses_count?: number
}

interface ApiCompanyDetail extends ApiCompanySummary {
  metadata?: Record<string, unknown> | null
}

const mapApiCompanyToCompany = (apiCompany: ApiCompanySummary | ApiCompanyDetail): Company => {
  const metadata = (apiCompany.metadata ?? undefined) as Record<string, unknown> | undefined
  const rawCountry = metadata ? metadata['country'] : undefined
  const country = typeof rawCountry === 'string' ? rawCountry : undefined

  return {
    id: apiCompany.id,
    company_name: apiCompany.name,
    industry: apiCompany.industry ?? '',
    country,
    description: apiCompany.description ?? undefined,
    metadata,
    ticker_symbol: apiCompany.ticker_symbol ?? undefined,
    processes_count: apiCompany.processes_count,
    subprocesses_count: apiCompany.subprocesses_count,
    status: apiCompany.is_active ? 'Active' : 'Inactive',
    created_at: apiCompany.created_at,
    updated_at: apiCompany.updated_at ?? apiCompany.created_at,
  }
}

const buildCompanyPayload = (data: Partial<CreateCompanyData & { status?: 'Active' | 'Inactive' }>) => {
  const payload: Record<string, unknown> = {}

  if (data.company_name !== undefined) {
    payload.name = data.company_name
  }

  if (data.industry !== undefined) {
    payload.industry = data.industry
  }

  if (data.description !== undefined) {
    payload.description = data.description
  }

  const metadata: Record<string, unknown> = {}
  if (data.country) {
    metadata.country = data.country
  }

  if (Object.keys(metadata).length > 0) {
    payload.metadata = metadata
  }

  if (data.status !== undefined) {
    payload.is_active = data.status === 'Active'
  }

  return payload
}

// Fetch all companies
export function useCompanies() {
  return useQuery({
    queryKey: ['companies'],
    queryFn: async (): Promise<Company[]> => {
      const response = await api.get('/api/companies')
      const companies = (response.data?.data ?? []) as ApiCompanySummary[]
      return companies.map(mapApiCompanyToCompany)
    }
  })
}

// Fetch single company
export function useCompany(id: string) {
  return useQuery({
    queryKey: ['companies', id],
    queryFn: async (): Promise<Company> => {
      const response = await api.get(`/api/companies/${id}`)
      return mapApiCompanyToCompany(response.data as ApiCompanyDetail)
    },
    enabled: !!id
  })
}

// Create company mutation
export function useCreateCompany() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateCompanyData): Promise<Company> => {
      const payload = buildCompanyPayload(data)
      const response = await api.post('/api/manage/companies', payload)
      const apiCompany = (response.data?.company ?? response.data) as ApiCompanyDetail
      return mapApiCompanyToCompany(apiCompany)
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
      const payload = buildCompanyPayload(data)
      const response = await api.put(`/api/manage/companies/${id}`, payload)
      const apiCompany = (response.data?.company ?? response.data) as ApiCompanyDetail
      return mapApiCompanyToCompany(apiCompany)
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
