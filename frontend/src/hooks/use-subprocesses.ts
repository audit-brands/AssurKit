import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api-client'

export interface Subprocess {
  id: string
  process_id: string
  company_id?: string
  company_name?: string
  process_name?: string
  subprocess_name: string
  description?: string
  owner?: string
  assertions?: string[]
  metadata?: Record<string, unknown>
  status: 'Active' | 'Inactive'
  created_at: string
  updated_at: string
  risks_count?: number
}

export interface CreateSubprocessData {
  process_id: string
  subprocess_name: string
  description?: string
  owner?: string
  assertions?: string[]
  metadata?: Record<string, unknown>
}

export interface UpdateSubprocessData extends CreateSubprocessData {
  status?: 'Active' | 'Inactive'
}

interface ApiSubprocessSummary {
  id: string
  name: string
  description?: string | null
  owner_email?: string | null
  assertions?: string[] | null
  process: {
    id: string
    name: string
    company: {
      id: string
      name: string
    }
  }
  risks_count?: number
  is_active: boolean
  created_at: string
  updated_at?: string
}

interface ApiSubprocessDetail extends ApiSubprocessSummary {
  metadata?: Record<string, unknown> | null
}

const mapApiSubprocessToSubprocess = (subprocess: ApiSubprocessSummary | ApiSubprocessDetail): Subprocess => {
  const metadata = (subprocess as ApiSubprocessDetail).metadata ?? undefined
  const assertions = Array.isArray(subprocess.assertions) ? subprocess.assertions : undefined

  return {
    id: subprocess.id,
    process_id: subprocess.process.id,
    company_id: subprocess.process.company.id,
    company_name: subprocess.process.company.name,
    process_name: subprocess.process.name,
    subprocess_name: subprocess.name,
    description: subprocess.description ?? undefined,
    owner: subprocess.owner_email ?? undefined,
    assertions,
    metadata,
    status: subprocess.is_active ? 'Active' : 'Inactive',
    created_at: subprocess.created_at,
    updated_at: subprocess.updated_at ?? subprocess.created_at,
    risks_count: subprocess.risks_count,
  }
}

const buildSubprocessPayload = (data: Partial<CreateSubprocessData & { status?: 'Active' | 'Inactive' }>) => {
  const payload: Record<string, unknown> = {}

  if (data.process_id !== undefined) {
    payload.process_id = data.process_id
  }

  if (data.subprocess_name !== undefined) {
    payload.name = data.subprocess_name
  }

  if (data.description !== undefined) {
    payload.description = data.description
  }

  if (data.owner !== undefined) {
    payload.owner_email = data.owner
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

// Fetch all subprocesses
export function useSubprocesses() {
  return useQuery({
    queryKey: ['subprocesses'],
    queryFn: async (): Promise<Subprocess[]> => {
      const response = await api.get('/api/subprocesses')
      const subprocesses = (response.data?.data ?? []) as ApiSubprocessSummary[]
      return subprocesses.map(mapApiSubprocessToSubprocess)
    }
  })
}

// Fetch subprocesses by process
export function useSubprocessesByProcess(processId: string) {
  return useQuery({
    queryKey: ['subprocesses', 'process', processId],
    queryFn: async (): Promise<Subprocess[]> => {
      const response = await api.get('/api/subprocesses', {
        params: { process_id: processId }
      })
      const subprocesses = (response.data?.data ?? []) as ApiSubprocessSummary[]
      return subprocesses.map(mapApiSubprocessToSubprocess)
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
      return mapApiSubprocessToSubprocess(response.data as ApiSubprocessDetail)
    },
    enabled: !!id
  })
}

// Create subprocess mutation
export function useCreateSubprocess() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateSubprocessData): Promise<Subprocess> => {
      const payload = buildSubprocessPayload(data)
      const response = await api.post('/api/manage/subprocesses', payload)
      const apiSubprocess = (response.data?.subprocess ?? response.data) as ApiSubprocessDetail
      return mapApiSubprocessToSubprocess(apiSubprocess)
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
      const payload = buildSubprocessPayload(data)
      const response = await api.put(`/api/manage/subprocesses/${id}`, payload)
      const apiSubprocess = (response.data?.subprocess ?? response.data) as ApiSubprocessDetail
      return mapApiSubprocessToSubprocess(apiSubprocess)
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
