import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api-client'

export interface Process {
  id: string
  company_id: string
  company_name?: string
  process_name: string
  description?: string
  owner?: string
  metadata?: Record<string, unknown>
  status: 'Active' | 'Inactive'
  created_at: string
  updated_at: string
  subprocess_count?: number
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

interface ApiProcessSummary {
  id: string
  name: string
  description?: string | null
  owner_email?: string | null
  company: {
    id: string
    name: string
  }
  subprocesses_count?: number
  is_active: boolean
  created_at: string
  updated_at?: string
}

interface ApiProcessDetail extends ApiProcessSummary {
  metadata?: Record<string, unknown> | null
}

const mapApiProcessToProcess = (apiProcess: ApiProcessSummary | ApiProcessDetail): Process => {
  const metadata = (apiProcess as ApiProcessDetail).metadata ?? undefined

  return {
    id: apiProcess.id,
    company_id: apiProcess.company.id,
    company_name: apiProcess.company.name,
    process_name: apiProcess.name,
    description: apiProcess.description ?? undefined,
    owner: apiProcess.owner_email ?? undefined,
    metadata,
    status: apiProcess.is_active ? 'Active' : 'Inactive',
    created_at: apiProcess.created_at,
    updated_at: apiProcess.updated_at ?? apiProcess.created_at,
    subprocess_count: apiProcess.subprocesses_count,
  }
}

const buildProcessPayload = (data: Partial<CreateProcessData & { status?: 'Active' | 'Inactive' }>) => {
  const payload: Record<string, unknown> = {}

  if (data.company_id !== undefined) {
    payload.company_id = data.company_id
  }

  if (data.process_name !== undefined) {
    payload.name = data.process_name
  }

  if (data.description !== undefined) {
    payload.description = data.description
  }

  if (data.owner !== undefined) {
    payload.owner_email = data.owner
  }

  if (data.metadata !== undefined) {
    payload.metadata = data.metadata
  }

  if (data.status !== undefined) {
    payload.is_active = data.status === 'Active'
  }

  return payload
}

// Fetch all processes
export function useProcesses() {
  return useQuery({
    queryKey: ['processes'],
    queryFn: async (): Promise<Process[]> => {
      const response = await api.get('/api/processes')
      const processes = (response.data?.data ?? []) as ApiProcessSummary[]
      return processes.map(mapApiProcessToProcess)
    }
  })
}

// Fetch processes by company
export function useProcessesByCompany(companyId: string) {
  return useQuery({
    queryKey: ['processes', 'company', companyId],
    queryFn: async (): Promise<Process[]> => {
      const response = await api.get('/api/processes', {
        params: { company_id: companyId }
      })
      const processes = (response.data?.data ?? []) as ApiProcessSummary[]
      return processes.map(mapApiProcessToProcess)
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
      return mapApiProcessToProcess(response.data as ApiProcessDetail)
    },
    enabled: !!id
  })
}

// Create process mutation
export function useCreateProcess() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateProcessData): Promise<Process> => {
      const payload = buildProcessPayload(data)
      const response = await api.post('/api/manage/processes', payload)
      const apiProcess = (response.data?.process ?? response.data) as ApiProcessDetail
      return mapApiProcessToProcess(apiProcess)
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
      const payload = buildProcessPayload(data)
      const response = await api.put(`/api/manage/processes/${id}`, payload)
      const apiProcess = (response.data?.process ?? response.data) as ApiProcessDetail
      return mapApiProcessToProcess(apiProcess)
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
