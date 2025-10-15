import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api-client'

export interface Issue {
  id: string
  test_execution_id?: string
  control_id: string
  title: string
  description: string
  severity: 'Low' | 'Medium' | 'High' | 'Critical'
  status: 'Open' | 'In Remediation' | 'Ready for Retest' | 'Closed'
  issue_type: 'Exception' | 'Deficiency' | 'Observation' | 'Recommendation'
  root_cause?: string
  business_impact?: string
  remediation_plan?: string
  remediation_owner?: string
  target_resolution_date?: string
  actual_resolution_date?: string
  retest_required: boolean
  retest_date?: string
  retest_result?: 'Pass' | 'Fail' | 'Partial'
  tags: string[]
  attachments: string[]
  created_by: string
  assigned_to?: string
  created_at: string
  updated_at: string
  resolved_at?: string
  metadata?: Record<string, unknown>
}

export interface IssueCreate {
  test_execution_id?: string
  control_id: string
  title: string
  description: string
  severity: Issue['severity']
  issue_type: Issue['issue_type']
  root_cause?: string
  business_impact?: string
  remediation_plan?: string
  remediation_owner?: string
  target_resolution_date?: string
  retest_required?: boolean
  tags?: string[]
  assigned_to?: string
}

export interface IssueUpdate {
  title?: string
  description?: string
  severity?: Issue['severity']
  status?: Issue['status']
  issue_type?: Issue['issue_type']
  root_cause?: string
  business_impact?: string
  remediation_plan?: string
  remediation_owner?: string
  target_resolution_date?: string
  actual_resolution_date?: string
  retest_required?: boolean
  retest_date?: string
  retest_result?: Issue['retest_result']
  tags?: string[]
  assigned_to?: string
}

export interface IssueComment {
  id: string
  issue_id: string
  author: string
  content: string
  created_at: string
  updated_at: string
}

export interface IssueActivity {
  id: string
  issue_id: string
  action: 'Created' | 'Updated' | 'Assigned' | 'Resolved' | 'Reopened' | 'Commented'
  actor: string
  details?: string
  changes?: Record<string, { from: unknown; to: unknown }>
  timestamp: string
}

// Issues queries
export function useIssues(page = 1, limit = 20, filters?: {
  control_id?: string
  test_execution_id?: string
  severity?: string
  status?: string
  issue_type?: string
  assigned_to?: string
  created_by?: string
  tags?: string[]
  search?: string
  overdue_only?: boolean
}) {
  return useQuery({
    queryKey: ['issues', page, limit, filters],
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
      const response = await api.get(`/issues?${params}`)
      return response.data as {
        items: Issue[]
        total: number
        page: number
        limit: number
        total_pages: number
      }
    }
  })
}

export function useIssue(id: string) {
  return useQuery({
    queryKey: ['issue', id],
    queryFn: async () => {
      const response = await api.get(`/issues/${id}`)
      return response.data as Issue
    },
    enabled: !!id
  })
}

export function useIssueComments(issueId: string) {
  return useQuery({
    queryKey: ['issue-comments', issueId],
    queryFn: async () => {
      const response = await api.get(`/issues/${issueId}/comments`)
      return response.data as IssueComment[]
    },
    enabled: !!issueId
  })
}

export function useIssueActivity(issueId: string) {
  return useQuery({
    queryKey: ['issue-activity', issueId],
    queryFn: async () => {
      const response = await api.get(`/issues/${issueId}/activity`)
      return response.data as IssueActivity[]
    },
    enabled: !!issueId
  })
}

// Issue mutations
export function useCreateIssue() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (issue: IssueCreate) => {
      const response = await api.post('/issues', issue)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues'] })
      queryClient.invalidateQueries({ queryKey: ['issue-statistics'] })
    }
  })
}

export function useUpdateIssue() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & IssueUpdate) => {
      const response = await api.put(`/issues/${id}`, updates)
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['issues'] })
      queryClient.invalidateQueries({ queryKey: ['issue', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['issue-activity', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['issue-statistics'] })
    }
  })
}

export function useDeleteIssue() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/issues/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues'] })
      queryClient.invalidateQueries({ queryKey: ['issue-statistics'] })
    }
  })
}

export function useAssignIssue() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, assignee }: { id: string; assignee: string }) => {
      const response = await api.post(`/issues/${id}/assign`, { assigned_to: assignee })
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['issues'] })
      queryClient.invalidateQueries({ queryKey: ['issue', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['issue-activity', variables.id] })
    }
  })
}

export function useResolveIssue() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      resolution_notes,
      actual_resolution_date
    }: {
      id: string;
      resolution_notes?: string;
      actual_resolution_date?: string;
    }) => {
      const response = await api.post(`/issues/${id}/resolve`, {
        resolution_notes,
        actual_resolution_date
      })
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['issues'] })
      queryClient.invalidateQueries({ queryKey: ['issue', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['issue-activity', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['issue-statistics'] })
    }
  })
}

export function useReopenIssue() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      const response = await api.post(`/issues/${id}/reopen`, { reason })
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['issues'] })
      queryClient.invalidateQueries({ queryKey: ['issue', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['issue-activity', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['issue-statistics'] })
    }
  })
}

// Issue comments
export function useAddIssueComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ issueId, content }: { issueId: string; content: string }) => {
      const response = await api.post(`/issues/${issueId}/comments`, { content })
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['issue-comments', variables.issueId] })
      queryClient.invalidateQueries({ queryKey: ['issue-activity', variables.issueId] })
    }
  })
}

export function useUpdateIssueComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      issueId,
      commentId,
      content
    }: {
      issueId: string;
      commentId: string;
      content: string;
    }) => {
      const response = await api.put(`/issues/${issueId}/comments/${commentId}`, { content })
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['issue-comments', variables.issueId] })
    }
  })
}

export function useDeleteIssueComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ issueId, commentId }: { issueId: string; commentId: string }) => {
      await api.delete(`/issues/${issueId}/comments/${commentId}`)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['issue-comments', variables.issueId] })
    }
  })
}

// Issue statistics
export function useIssueStatistics() {
  return useQuery({
    queryKey: ['issue-statistics'],
    queryFn: async () => {
      const response = await api.get('/issues/statistics')
      return response.data as {
        total_issues: number
        by_status: Record<string, number>
        by_severity: Record<string, number>
        by_type: Record<string, number>
        overdue_count: number
        avg_resolution_time_days: number
        issues_by_month: Array<{ month: string; count: number; resolved: number }>
        top_controls_with_issues: Array<{ control_id: string; control_name: string; issue_count: number }>
        resolution_trends: Array<{ date: string; opened: number; resolved: number }>
      }
    }
  })
}

// Bulk operations
export function useBulkUpdateIssues() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      issue_ids,
      updates
    }: {
      issue_ids: string[]
      updates: Partial<Pick<Issue, 'status' | 'severity' | 'assigned_to' | 'tags'>>
    }) => {
      await api.post('/issues/bulk-update', { issue_ids, updates })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues'] })
      queryClient.invalidateQueries({ queryKey: ['issue-statistics'] })
    }
  })
}

export function useBulkDeleteIssues() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (issueIds: string[]) => {
      await api.post('/issues/bulk-delete', { issue_ids: issueIds })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues'] })
      queryClient.invalidateQueries({ queryKey: ['issue-statistics'] })
    }
  })
}

// Helper functions
export function getIssueSeverityColor(severity: Issue['severity']) {
  switch (severity) {
    case 'Critical': return 'bg-red-100 text-red-800'
    case 'High': return 'bg-orange-100 text-orange-800'
    case 'Medium': return 'bg-yellow-100 text-yellow-800'
    case 'Low': return 'bg-blue-100 text-blue-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

export function getIssueStatusColor(status: Issue['status']) {
  switch (status) {
    case 'Open': return 'bg-red-100 text-red-800'
    case 'In Remediation': return 'bg-yellow-100 text-yellow-800'
    case 'Ready for Retest': return 'bg-blue-100 text-blue-800'
    case 'Closed': return 'bg-green-100 text-green-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

export function getIssueTypeColor(type: Issue['issue_type']) {
  switch (type) {
    case 'Exception': return 'bg-red-100 text-red-800'
    case 'Deficiency': return 'bg-orange-100 text-orange-800'
    case 'Observation': return 'bg-blue-100 text-blue-800'
    case 'Recommendation': return 'bg-green-100 text-green-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

export function isIssueOverdue(issue: Issue): boolean {
  if (!issue.target_resolution_date || issue.status === 'Closed') {
    return false
  }
  return new Date(issue.target_resolution_date) < new Date()
}