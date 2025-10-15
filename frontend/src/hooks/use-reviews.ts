import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export interface Review {
  id: string
  entity_type: 'test' | 'issue' | 'control' | 'evidence'
  entity_id: string
  review_type: 'approval' | 'validation' | 'quality_check' | 'compliance_review'
  status: 'pending' | 'in_review' | 'approved' | 'rejected' | 'changes_requested'

  // Review metadata
  title: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'urgent'

  // Reviewer information
  requested_by_user_id: string
  assigned_to_user_id: string
  reviewed_by_user_id: string | null

  // Approval chain
  approval_level: number
  required_approval_level: number
  approval_chain: Array<{
    level: number
    role: string
    user_id: string | null
    status: 'pending' | 'approved' | 'rejected'
    approved_at: string | null
    comments: string | null
  }>

  // Timeline
  due_date: string | null
  requested_at: string
  reviewed_at: string | null
  completed_at: string | null

  // Review details
  review_criteria: string[]
  comments: ReviewComment[]
  attachments: ReviewAttachment[]

  // Decision
  decision: 'approved' | 'rejected' | 'changes_requested' | null
  decision_reason: string | null

  created_at: string
  updated_at: string

  // Related data (populated by API)
  entity?: {
    title: string
    type: string
    status: string
  }
  requested_by_user?: {
    id: string
    name: string
    email: string
  }
  assigned_to_user?: {
    id: string
    name: string
    email: string
  }
  reviewed_by_user?: {
    id: string
    name: string
    email: string
  }
}

export interface ReviewComment {
  id: string
  review_id: string
  user_id: string
  comment: string
  comment_type: 'general' | 'approval' | 'rejection' | 'change_request' | 'question'
  is_internal: boolean
  created_at: string
  updated_at: string

  // Related data
  user?: {
    id: string
    name: string
    email: string
  }
}

export interface ReviewAttachment {
  id: string
  review_id: string
  filename: string
  file_size: number
  file_type: string
  uploaded_by_user_id: string
  uploaded_at: string
}

export interface ReviewTemplate {
  id: string
  name: string
  entity_type: 'test' | 'issue' | 'control' | 'evidence'
  review_type: 'approval' | 'validation' | 'quality_check' | 'compliance_review'
  description: string

  // Template configuration
  required_approval_level: number
  approval_chain_template: Array<{
    level: number
    role: string
    auto_assign_by_role: boolean
  }>

  // Review criteria
  criteria: string[]
  required_attachments: string[]

  // Timing
  default_due_days: number
  escalation_days: number

  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ReviewFilters {
  status?: string[]
  review_type?: string[]
  entity_type?: string[]
  assigned_to_user_id?: string
  requested_by_user_id?: string
  priority?: string[]
  due_date_from?: string
  due_date_to?: string
  overdue?: boolean
  limit?: number
  offset?: number
}

// Review hooks
export function useReviews(filters: ReviewFilters = {}) {
  return useQuery({
    queryKey: ['reviews', filters],
    queryFn: async (): Promise<{ items: Review[]; total: number }> => {
      const params = new URLSearchParams()

      if (filters.status?.length) {
        filters.status.forEach(status => params.append('status[]', status))
      }
      if (filters.review_type?.length) {
        filters.review_type.forEach(type => params.append('review_type[]', type))
      }
      if (filters.entity_type?.length) {
        filters.entity_type.forEach(type => params.append('entity_type[]', type))
      }
      if (filters.assigned_to_user_id) params.append('assigned_to_user_id', filters.assigned_to_user_id)
      if (filters.requested_by_user_id) params.append('requested_by_user_id', filters.requested_by_user_id)
      if (filters.priority?.length) {
        filters.priority.forEach(priority => params.append('priority[]', priority))
      }
      if (filters.due_date_from) params.append('due_date_from', filters.due_date_from)
      if (filters.due_date_to) params.append('due_date_to', filters.due_date_to)
      if (filters.overdue !== undefined) params.append('overdue', filters.overdue.toString())
      if (filters.limit) params.append('limit', filters.limit.toString())
      if (filters.offset) params.append('offset', filters.offset.toString())

      const response = await fetch(`/api/reviews?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch reviews')
      }
      return response.json()
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

export function useReview(reviewId: string) {
  return useQuery({
    queryKey: ['reviews', reviewId],
    queryFn: async (): Promise<Review> => {
      const response = await fetch(`/api/reviews/${reviewId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch review')
      }
      return response.json()
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

export function useMyReviews() {
  return useQuery({
    queryKey: ['reviews', 'my-reviews'],
    queryFn: async (): Promise<Review[]> => {
      const response = await fetch('/api/reviews/my-reviews')
      if (!response.ok) {
        throw new Error('Failed to fetch my reviews')
      }
      return response.json()
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

export function usePendingReviews() {
  return useQuery({
    queryKey: ['reviews', 'pending'],
    queryFn: async (): Promise<Review[]> => {
      const response = await fetch('/api/reviews/pending')
      if (!response.ok) {
        throw new Error('Failed to fetch pending reviews')
      }
      return response.json()
    },
    staleTime: 30 * 1000, // 30 seconds - more frequent updates for pending items
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 2 * 60 * 1000, // Refetch every 2 minutes
  })
}

export function useOverdueReviews() {
  return useQuery({
    queryKey: ['reviews', 'overdue'],
    queryFn: async (): Promise<Review[]> => {
      const response = await fetch('/api/reviews/overdue')
      if (!response.ok) {
        throw new Error('Failed to fetch overdue reviews')
      }
      return response.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  })
}

export function useCreateReview() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (review: Omit<Review, 'id' | 'created_at' | 'updated_at' | 'comments' | 'attachments'>): Promise<Review> => {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(review),
      })
      if (!response.ok) {
        throw new Error('Failed to create review')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

export function useUpdateReview() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Review> & { id: string }): Promise<Review> => {
      const response = await fetch(`/api/reviews/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })
      if (!response.ok) {
        throw new Error('Failed to update review')
      }
      return response.json()
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] })
      queryClient.invalidateQueries({ queryKey: ['reviews', id] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

export function useApproveReview() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ reviewId, comments }: { reviewId: string; comments?: string }): Promise<Review> => {
      const response = await fetch(`/api/reviews/${reviewId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ comments }),
      })
      if (!response.ok) {
        throw new Error('Failed to approve review')
      }
      return response.json()
    },
    onSuccess: (_, { reviewId }) => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] })
      queryClient.invalidateQueries({ queryKey: ['reviews', reviewId] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

export function useRejectReview() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ reviewId, reason, comments }: { reviewId: string; reason: string; comments?: string }): Promise<Review> => {
      const response = await fetch(`/api/reviews/${reviewId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason, comments }),
      })
      if (!response.ok) {
        throw new Error('Failed to reject review')
      }
      return response.json()
    },
    onSuccess: (_, { reviewId }) => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] })
      queryClient.invalidateQueries({ queryKey: ['reviews', reviewId] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

export function useRequestChanges() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ reviewId, changes, comments }: { reviewId: string; changes: string[]; comments?: string }): Promise<Review> => {
      const response = await fetch(`/api/reviews/${reviewId}/request-changes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ changes, comments }),
      })
      if (!response.ok) {
        throw new Error('Failed to request changes')
      }
      return response.json()
    },
    onSuccess: (_, { reviewId }) => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] })
      queryClient.invalidateQueries({ queryKey: ['reviews', reviewId] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

export function useDeleteReview() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (reviewId: string): Promise<void> => {
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        throw new Error('Failed to delete review')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] })
    },
  })
}

// Review comments hooks
export function useReviewComments(reviewId: string) {
  return useQuery({
    queryKey: ['review-comments', reviewId],
    queryFn: async (): Promise<ReviewComment[]> => {
      const response = await fetch(`/api/reviews/${reviewId}/comments`)
      if (!response.ok) {
        throw new Error('Failed to fetch review comments')
      }
      return response.json()
    },
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useAddReviewComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ reviewId, comment, commentType, isInternal }: {
      reviewId: string
      comment: string
      commentType: ReviewComment['comment_type']
      isInternal: boolean
    }): Promise<ReviewComment> => {
      const response = await fetch(`/api/reviews/${reviewId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          comment,
          comment_type: commentType,
          is_internal: isInternal,
        }),
      })
      if (!response.ok) {
        throw new Error('Failed to add review comment')
      }
      return response.json()
    },
    onSuccess: (_, { reviewId }) => {
      queryClient.invalidateQueries({ queryKey: ['review-comments', reviewId] })
      queryClient.invalidateQueries({ queryKey: ['reviews', reviewId] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

// Review templates hooks
export function useReviewTemplates() {
  return useQuery({
    queryKey: ['review-templates'],
    queryFn: async (): Promise<ReviewTemplate[]> => {
      const response = await fetch('/api/review-templates')
      if (!response.ok) {
        throw new Error('Failed to fetch review templates')
      }
      return response.json()
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  })
}

export function useCreateReviewFromTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ templateId, entityType, entityId, assignedToUserId, dueDate }: {
      templateId: string
      entityType: string
      entityId: string
      assignedToUserId: string
      dueDate?: string
    }): Promise<Review> => {
      const response = await fetch('/api/reviews/from-template', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          template_id: templateId,
          entity_type: entityType,
          entity_id: entityId,
          assigned_to_user_id: assignedToUserId,
          due_date: dueDate,
        }),
      })
      if (!response.ok) {
        throw new Error('Failed to create review from template')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}