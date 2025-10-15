import { useQuery } from '@tanstack/react-query'

export interface ExecutiveSummary {
  // Risk & Control Metrics
  total_controls: number
  active_controls: number
  key_controls: number
  non_key_controls: number
  automated_controls: number
  manual_controls: number
  controls_by_frequency: Record<string, number>
  controls_by_type: Record<string, number>

  // Testing Metrics
  total_tests: number
  tests_completed: number
  tests_in_progress: number
  tests_overdue: number
  test_pass_rate: number
  tests_by_status: Record<string, number>
  tests_by_conclusion: Record<string, number>

  // Issue Metrics
  total_issues: number
  open_issues: number
  overdue_issues: number
  critical_issues: number
  high_issues: number
  issues_by_status: Record<string, number>
  issues_by_severity: Record<string, number>
  avg_resolution_time_days: number

  // Evidence Metrics
  total_evidence_files: number
  evidence_by_type: Record<string, number>
  evidence_by_confidentiality: Record<string, number>
  total_evidence_size_gb: number
  key_evidence_count: number

  // Trend Data
  monthly_test_trends: Array<{
    month: string
    tests_planned: number
    tests_completed: number
    pass_rate: number
  }>

  monthly_issue_trends: Array<{
    month: string
    issues_opened: number
    issues_resolved: number
    net_change: number
  }>

  quarterly_compliance_score: Array<{
    quarter: string
    compliance_score: number
    test_completion_rate: number
    issue_resolution_rate: number
  }>

  // Risk Indicators
  top_risk_areas: Array<{
    process_name: string
    subprocess_name: string
    risk_count: number
    open_issues: number
    overdue_tests: number
    risk_score: number
  }>

  // Performance Indicators
  control_effectiveness: Array<{
    control_id: string
    control_name: string
    test_count: number
    pass_rate: number
    last_test_date: string
    effectiveness_score: number
  }>

  // Operational Metrics
  user_activity: Array<{
    user_name: string
    tests_assigned: number
    tests_completed: number
    issues_assigned: number
    issues_resolved: number
    activity_score: number
  }>
}

export interface DashboardFilters {
  period?: 'current' | 'previous' | 'ytd' | 'custom'
  start_date?: string
  end_date?: string
  business_unit?: string[]
  process_ids?: string[]
  control_types?: string[]
}

export function useExecutiveSummary(filters: DashboardFilters = {}) {
  return useQuery({
    queryKey: ['executive-summary', filters],
    queryFn: async (): Promise<ExecutiveSummary> => {
      const params = new URLSearchParams()

      if (filters.period) params.append('period', filters.period)
      if (filters.start_date) params.append('start_date', filters.start_date)
      if (filters.end_date) params.append('end_date', filters.end_date)
      if (filters.business_unit?.length) {
        filters.business_unit.forEach(unit => params.append('business_unit[]', unit))
      }
      if (filters.process_ids?.length) {
        filters.process_ids.forEach(id => params.append('process_ids[]', id))
      }
      if (filters.control_types?.length) {
        filters.control_types.forEach(type => params.append('control_types[]', type))
      }

      const response = await fetch(`/api/dashboard/executive-summary?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch executive summary')
      }
      return response.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

export interface ComplianceHealthCheck {
  overall_score: number
  control_design_score: number
  control_execution_score: number
  issue_management_score: number
  evidence_quality_score: number

  red_flags: Array<{
    type: 'control_gap' | 'overdue_test' | 'critical_issue' | 'missing_evidence'
    title: string
    description: string
    severity: 'Critical' | 'High' | 'Medium' | 'Low'
    entity: string
    due_date?: string
    url?: string
  }>

  recommendations: Array<{
    priority: 'High' | 'Medium' | 'Low'
    category: 'Control Design' | 'Testing' | 'Issue Management' | 'Evidence'
    title: string
    description: string
    impact: string
    effort: 'Low' | 'Medium' | 'High'
  }>
}

export function useComplianceHealthCheck(filters: DashboardFilters = {}) {
  return useQuery({
    queryKey: ['compliance-health-check', filters],
    queryFn: async (): Promise<ComplianceHealthCheck> => {
      const params = new URLSearchParams()

      if (filters.period) params.append('period', filters.period)
      if (filters.start_date) params.append('start_date', filters.start_date)
      if (filters.end_date) params.append('end_date', filters.end_date)

      const response = await fetch(`/api/dashboard/compliance-health-check?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch compliance health check')
      }
      return response.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

export interface AuditReadinessReport {
  readiness_score: number
  last_assessment_date: string

  // Readiness by Area
  control_documentation_score: number
  test_execution_completeness: number
  evidence_collection_score: number
  issue_resolution_score: number

  // Action Items
  critical_action_items: Array<{
    id: string
    title: string
    description: string
    category: 'Control' | 'Testing' | 'Evidence' | 'Issue'
    priority: 'Critical' | 'High'
    assignee: string
    due_date: string
    status: 'Open' | 'In Progress' | 'Completed'
  }>

  // Coverage Analysis
  testing_coverage: {
    total_controls: number
    tested_controls: number
    coverage_percentage: number
    untested_key_controls: number
  }

  evidence_coverage: {
    total_tests: number
    tests_with_evidence: number
    coverage_percentage: number
    missing_evidence_count: number
  }

  // Timeline to Readiness
  estimated_days_to_ready: number
  workstream_progress: Array<{
    workstream: string
    completion_percentage: number
    remaining_tasks: number
    at_risk: boolean
  }>
}

export function useAuditReadinessReport(filters: DashboardFilters = {}) {
  return useQuery({
    queryKey: ['audit-readiness-report', filters],
    queryFn: async (): Promise<AuditReadinessReport> => {
      const params = new URLSearchParams()

      if (filters.period) params.append('period', filters.period)
      if (filters.start_date) params.append('start_date', filters.start_date)
      if (filters.end_date) params.append('end_date', filters.end_date)

      const response = await fetch(`/api/dashboard/audit-readiness?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch audit readiness report')
      }
      return response.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}