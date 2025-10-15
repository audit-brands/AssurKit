import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: 'assignment' | 'due_date' | 'overdue' | 'approval' | 'comment' | 'status_change' | 'system'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  read_at: string | null
  archived_at: string | null
  created_at: string
  updated_at: string

  // Related entity information
  entity_type: 'test' | 'issue' | 'control' | 'evidence' | 'user' | null
  entity_id: string | null

  // Action data
  action_url: string | null
  action_label: string | null

  // Metadata
  metadata: Record<string, unknown>
}

export interface NotificationPreferences {
  id: string
  user_id: string

  // Email notifications
  email_assignments: boolean
  email_due_dates: boolean
  email_overdue: boolean
  email_approvals: boolean
  email_comments: boolean
  email_status_changes: boolean

  // In-app notifications
  app_assignments: boolean
  app_due_dates: boolean
  app_overdue: boolean
  app_approvals: boolean
  app_comments: boolean
  app_status_changes: boolean

  // Frequency settings
  digest_frequency: 'immediate' | 'daily' | 'weekly' | 'never'
  quiet_hours_start: string | null
  quiet_hours_end: string | null

  created_at: string
  updated_at: string
}

export interface Assignment {
  id: string
  entity_type: 'test' | 'issue' | 'control' | 'review'
  entity_id: string
  assigned_by_user_id: string
  assigned_to_user_id: string
  role: 'owner' | 'reviewer' | 'approver' | 'collaborator'
  due_date: string | null
  completed_at: string | null
  created_at: string
  updated_at: string

  // Assignment metadata
  instructions: string | null
  priority: 'low' | 'medium' | 'high' | 'urgent'

  // Related data (populated by API)
  assigned_by_user?: {
    id: string
    name: string
    email: string
  }
  assigned_to_user?: {
    id: string
    name: string
    email: string
  }
  entity?: {
    title: string
    type: string
    status: string
  }
}

export interface NotificationFilters {
  type?: string[]
  priority?: string[]
  entity_type?: string[]
  read?: boolean
  archived?: boolean
  limit?: number
  offset?: number
}

export interface AssignmentFilters {
  entity_type?: string[]
  role?: string[]
  assigned_to_user_id?: string
  assigned_by_user_id?: string
  status?: 'pending' | 'completed' | 'overdue'
  due_date_from?: string
  due_date_to?: string
  limit?: number
  offset?: number
}

// Notifications hooks
export function useNotifications(filters: NotificationFilters = {}) {
  return useQuery({
    queryKey: ['notifications', filters],
    queryFn: async (): Promise<{ items: Notification[]; total: number }> => {
      const params = new URLSearchParams()

      if (filters.type?.length) {
        filters.type.forEach(type => params.append('type[]', type))
      }
      if (filters.priority?.length) {
        filters.priority.forEach(priority => params.append('priority[]', priority))
      }
      if (filters.entity_type?.length) {
        filters.entity_type.forEach(type => params.append('entity_type[]', type))
      }
      if (filters.read !== undefined) params.append('read', filters.read.toString())
      if (filters.archived !== undefined) params.append('archived', filters.archived.toString())
      if (filters.limit) params.append('limit', filters.limit.toString())
      if (filters.offset) params.append('offset', filters.offset.toString())

      const response = await fetch(`/api/notifications?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch notifications')
      }
      return response.json()
    },
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async (): Promise<number> => {
      const response = await fetch('/api/notifications/unread-count')
      if (!response.ok) {
        throw new Error('Failed to fetch unread count')
      }
      const data = await response.json()
      return data.count
    },
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 60 * 1000, // Refetch every minute
  })
}

export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (notificationId: string): Promise<void> => {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
      })
      if (!response.ok) {
        throw new Error('Failed to mark notification as read')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (): Promise<void> => {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'PATCH',
      })
      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

export function useArchiveNotification() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (notificationId: string): Promise<void> => {
      const response = await fetch(`/api/notifications/${notificationId}/archive`, {
        method: 'PATCH',
      })
      if (!response.ok) {
        throw new Error('Failed to archive notification')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

// Assignment hooks
export function useAssignments(filters: AssignmentFilters = {}) {
  return useQuery({
    queryKey: ['assignments', filters],
    queryFn: async (): Promise<{ items: Assignment[]; total: number }> => {
      const params = new URLSearchParams()

      if (filters.entity_type?.length) {
        filters.entity_type.forEach(type => params.append('entity_type[]', type))
      }
      if (filters.role?.length) {
        filters.role.forEach(role => params.append('role[]', role))
      }
      if (filters.assigned_to_user_id) params.append('assigned_to_user_id', filters.assigned_to_user_id)
      if (filters.assigned_by_user_id) params.append('assigned_by_user_id', filters.assigned_by_user_id)
      if (filters.status) params.append('status', filters.status)
      if (filters.due_date_from) params.append('due_date_from', filters.due_date_from)
      if (filters.due_date_to) params.append('due_date_to', filters.due_date_to)
      if (filters.limit) params.append('limit', filters.limit.toString())
      if (filters.offset) params.append('offset', filters.offset.toString())

      const response = await fetch(`/api/assignments?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch assignments')
      }
      return response.json()
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

export function useMyAssignments() {
  return useQuery({
    queryKey: ['assignments', 'my-assignments'],
    queryFn: async (): Promise<Assignment[]> => {
      const response = await fetch('/api/assignments/my-assignments')
      if (!response.ok) {
        throw new Error('Failed to fetch my assignments')
      }
      return response.json()
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

export function useOverdueAssignments() {
  return useQuery({
    queryKey: ['assignments', 'overdue'],
    queryFn: async (): Promise<Assignment[]> => {
      const response = await fetch('/api/assignments/overdue')
      if (!response.ok) {
        throw new Error('Failed to fetch overdue assignments')
      }
      return response.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  })
}

export function useCreateAssignment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (assignment: Omit<Assignment, 'id' | 'created_at' | 'updated_at'>): Promise<Assignment> => {
      const response = await fetch('/api/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(assignment),
      })
      if (!response.ok) {
        throw new Error('Failed to create assignment')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

export function useUpdateAssignment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Assignment> & { id: string }): Promise<Assignment> => {
      const response = await fetch(`/api/assignments/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })
      if (!response.ok) {
        throw new Error('Failed to update assignment')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

export function useCompleteAssignment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (assignmentId: string): Promise<Assignment> => {
      const response = await fetch(`/api/assignments/${assignmentId}/complete`, {
        method: 'PATCH',
      })
      if (!response.ok) {
        throw new Error('Failed to complete assignment')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

export function useDeleteAssignment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (assignmentId: string): Promise<void> => {
      const response = await fetch(`/api/assignments/${assignmentId}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        throw new Error('Failed to delete assignment')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] })
    },
  })
}

// Notification preferences hooks
export function useNotificationPreferences() {
  return useQuery({
    queryKey: ['notification-preferences'],
    queryFn: async (): Promise<NotificationPreferences> => {
      const response = await fetch('/api/notifications/preferences')
      if (!response.ok) {
        throw new Error('Failed to fetch notification preferences')
      }
      return response.json()
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  })
}

export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (preferences: Partial<NotificationPreferences>): Promise<NotificationPreferences> => {
      const response = await fetch('/api/notifications/preferences', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences),
      })
      if (!response.ok) {
        throw new Error('Failed to update notification preferences')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] })
    },
  })
}