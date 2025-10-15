import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api-client'

export interface Evidence {
  id: string
  test_execution_id?: string
  control_id?: string
  filename: string
  original_filename: string
  file_size: number
  file_type: string
  storage_path: string
  checksum_sha256: string
  description?: string
  tags: string[]
  uploaded_by: string
  uploaded_at: string
  retention_date?: string
  is_key_evidence: boolean
  confidentiality_level: 'Public' | 'Internal' | 'Confidential' | 'Restricted'
  status: 'Active' | 'Archived' | 'Deleted'
  metadata?: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface EvidenceUpload {
  file: File
  test_execution_id?: string
  control_id?: string
  description?: string
  tags?: string[]
  is_key_evidence?: boolean
  confidentiality_level?: Evidence['confidentiality_level']
}

export interface EvidenceFolder {
  id: string
  name: string
  description?: string
  parent_folder_id?: string
  created_by: string
  created_at: string
  updated_at: string
}

export interface EvidenceShare {
  id: string
  evidence_id: string
  shared_with: string
  shared_by: string
  permissions: 'Read' | 'Download' | 'Full'
  expires_at?: string
  created_at: string
}

export interface EvidenceAuditLog {
  id: string
  evidence_id: string
  action: 'Upload' | 'Download' | 'View' | 'Update' | 'Delete' | 'Share'
  performed_by: string
  ip_address?: string
  user_agent?: string
  details?: Record<string, unknown>
  timestamp: string
}

// Evidence queries
export function useEvidence(page = 1, limit = 20, filters?: {
  test_execution_id?: string
  control_id?: string
  tags?: string[]
  file_type?: string
  confidentiality_level?: string
  is_key_evidence?: boolean
  search?: string
}) {
  return useQuery({
    queryKey: ['evidence', page, limit, filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...Object.fromEntries(
          Object.entries(filters || {}).map(([key, value]) => [
            key,
            Array.isArray(value) ? value.join(',') : String(value)
          ])
        )
      })
      const response = await api.get(`/evidence?${params}`)
      return response.data as {
        items: Evidence[]
        total: number
        page: number
        limit: number
        total_pages: number
      }
    }
  })
}

export function useEvidenceItem(id: string) {
  return useQuery({
    queryKey: ['evidence', id],
    queryFn: async () => {
      const response = await api.get(`/evidence/${id}`)
      return response.data as Evidence
    },
    enabled: !!id
  })
}

export function useEvidenceDownloadUrl(id: string) {
  return useQuery({
    queryKey: ['evidence-download', id],
    queryFn: async () => {
      const response = await api.get(`/evidence/${id}/download-url`)
      return response.data.download_url as string
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useEvidencePreview(id: string) {
  return useQuery({
    queryKey: ['evidence-preview', id],
    queryFn: async () => {
      const response = await api.get(`/evidence/${id}/preview`)
      return response.data as {
        preview_url?: string
        thumbnail_url?: string
        can_preview: boolean
        file_info: {
          pages?: number
          dimensions?: { width: number; height: number }
          duration?: number
        }
      }
    },
    enabled: !!id
  })
}

// Evidence mutations
export function useUploadEvidence() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (upload: EvidenceUpload) => {
      const formData = new FormData()
      formData.append('file', upload.file)

      if (upload.test_execution_id) {
        formData.append('test_execution_id', upload.test_execution_id)
      }
      if (upload.control_id) {
        formData.append('control_id', upload.control_id)
      }
      if (upload.description) {
        formData.append('description', upload.description)
      }
      if (upload.tags) {
        formData.append('tags', JSON.stringify(upload.tags))
      }
      if (upload.is_key_evidence !== undefined) {
        formData.append('is_key_evidence', upload.is_key_evidence.toString())
      }
      if (upload.confidentiality_level) {
        formData.append('confidentiality_level', upload.confidentiality_level)
      }

      const response = await api.post('/evidence/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          // You can use this for progress tracking
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 1)
          )
          console.log(`Upload Progress: ${percentCompleted}%`)
        },
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evidence'] })
    }
  })
}

export function useUpdateEvidence() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: { id: string } & Partial<Pick<Evidence, 'description' | 'tags' | 'is_key_evidence' | 'confidentiality_level'>>) => {
      const response = await api.put(`/evidence/${id}`, updates)
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['evidence'] })
      queryClient.invalidateQueries({ queryKey: ['evidence', variables.id] })
    }
  })
}

export function useDeleteEvidence() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/evidence/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evidence'] })
    }
  })
}

// Evidence folders
export function useEvidenceFolders() {
  return useQuery({
    queryKey: ['evidence-folders'],
    queryFn: async () => {
      const response = await api.get('/evidence/folders')
      return response.data as EvidenceFolder[]
    }
  })
}

export function useCreateEvidenceFolder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (folder: Omit<EvidenceFolder, 'id' | 'created_by' | 'created_at' | 'updated_at'>) => {
      const response = await api.post('/evidence/folders', folder)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evidence-folders'] })
    }
  })
}

// Evidence sharing
export function useEvidenceShares(evidenceId: string) {
  return useQuery({
    queryKey: ['evidence-shares', evidenceId],
    queryFn: async () => {
      const response = await api.get(`/evidence/${evidenceId}/shares`)
      return response.data as EvidenceShare[]
    },
    enabled: !!evidenceId
  })
}

export function useCreateEvidenceShare() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (share: Omit<EvidenceShare, 'id' | 'shared_by' | 'created_at'>) => {
      const response = await api.post(`/evidence/${share.evidence_id}/shares`, {
        shared_with: share.shared_with,
        permissions: share.permissions,
        expires_at: share.expires_at
      })
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['evidence-shares', variables.evidence_id] })
    }
  })
}

// Evidence audit log
export function useEvidenceAuditLog(evidenceId: string) {
  return useQuery({
    queryKey: ['evidence-audit-log', evidenceId],
    queryFn: async () => {
      const response = await api.get(`/evidence/${evidenceId}/audit-log`)
      return response.data as EvidenceAuditLog[]
    },
    enabled: !!evidenceId
  })
}

// Evidence statistics
export function useEvidenceStatistics() {
  return useQuery({
    queryKey: ['evidence-statistics'],
    queryFn: async () => {
      const response = await api.get('/evidence/statistics')
      return response.data as {
        total_files: number
        total_size_bytes: number
        total_size_formatted: string
        files_by_type: Record<string, number>
        files_by_confidentiality: Record<string, number>
        files_by_month: Array<{ month: string; count: number; size_bytes: number }>
        key_evidence_count: number
        retention_alerts: number
      }
    }
  })
}

// Bulk operations
export function useBulkDeleteEvidence() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (evidenceIds: string[]) => {
      await api.post('/evidence/bulk-delete', { evidence_ids: evidenceIds })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evidence'] })
    }
  })
}

export function useBulkUpdateEvidence() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      evidence_ids,
      updates
    }: {
      evidence_ids: string[]
      updates: Partial<Pick<Evidence, 'tags' | 'confidentiality_level' | 'is_key_evidence'>>
    }) => {
      await api.post('/evidence/bulk-update', { evidence_ids, updates })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evidence'] })
    }
  })
}

// File validation utilities
export function validateFile(file: File): { valid: boolean; error?: string } {
  // Maximum file size: 100MB
  const MAX_FILE_SIZE = 100 * 1024 * 1024

  // Allowed file types
  const ALLOWED_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'image/gif',
    'text/plain',
    'text/csv',
    'application/json'
  ]

  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'File size exceeds 100MB limit' }
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'File type not allowed' }
  }

  return { valid: true }
}

// Calculate file checksum (client-side for verification)
export async function calculateFileChecksum(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}