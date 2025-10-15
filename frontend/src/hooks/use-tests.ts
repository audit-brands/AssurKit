import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api-client'

export interface TestPlan {
  id: string
  control_id: string
  test_name: string
  test_description: string
  testing_procedures: string
  sample_size: number
  sample_selection_method: 'Random' | 'Risk-based' | 'Judgmental' | 'Complete'
  frequency: 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly' | 'Annual' | 'Ad-hoc'
  testing_approach: 'Inquiry' | 'Observation' | 'Inspection' | 'Reperformance' | 'Analytical'
  expected_results: string
  population_size?: number
  testing_period_start: string
  testing_period_end: string
  assigned_tester: string
  reviewer: string
  status: 'Draft' | 'Approved' | 'In Progress' | 'Submitted' | 'Under Review' | 'Concluded'
  created_at: string
  updated_at: string
  metadata?: Record<string, unknown>
}

export interface TestExecution {
  id: string
  test_plan_id: string
  execution_date: string
  tester: string
  sample_items: TestSampleItem[]
  testing_notes: string
  exceptions_identified: TestException[]
  conclusion: 'Pass' | 'Pass with Exceptions' | 'Fail'
  overall_assessment: string
  recommendations?: string
  status: 'In Progress' | 'Complete' | 'Under Review' | 'Approved'
  evidence_files: string[]
  created_at: string
  updated_at: string
}

export interface TestSampleItem {
  id: string
  item_description: string
  item_reference: string
  test_result: 'Pass' | 'Fail' | 'N/A'
  notes?: string
  evidence_reference?: string
}

export interface TestException {
  id: string
  exception_type: 'Design' | 'Operating' | 'Sample'
  description: string
  impact: 'Low' | 'Medium' | 'High' | 'Critical'
  root_cause?: string
  management_response?: string
  remediation_plan?: string
  target_date?: string
  status: 'Open' | 'In Remediation' | 'Ready for Retest' | 'Closed'
}

export interface TestCycle {
  id: string
  cycle_name: string
  period_start: string
  period_end: string
  description?: string
  status: 'Planning' | 'In Progress' | 'Review' | 'Complete'
  created_at: string
  updated_at: string
}

// Test Plans
export function useTestPlans(controlId?: string) {
  return useQuery({
    queryKey: ['test-plans', controlId],
    queryFn: async () => {
      const params = controlId ? `?control_id=${controlId}` : ''
      const response = await api.get(`/test-plans${params}`)
      return response.data as TestPlan[]
    }
  })
}

export function useTestPlan(id: string) {
  return useQuery({
    queryKey: ['test-plan', id],
    queryFn: async () => {
      const response = await api.get(`/test-plans/${id}`)
      return response.data as TestPlan
    },
    enabled: !!id
  })
}

export function useCreateTestPlan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (testPlan: Omit<TestPlan, 'id' | 'created_at' | 'updated_at'>) => {
      const response = await api.post('/test-plans', testPlan)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['test-plans'] })
    }
  })
}

export function useUpdateTestPlan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...testPlan }: Partial<TestPlan> & { id: string }) => {
      const response = await api.put(`/test-plans/${id}`, testPlan)
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['test-plans'] })
      queryClient.invalidateQueries({ queryKey: ['test-plan', variables.id] })
    }
  })
}

export function useDeleteTestPlan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/test-plans/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['test-plans'] })
    }
  })
}

// Test Executions
export function useTestExecutions(testPlanId?: string) {
  return useQuery({
    queryKey: ['test-executions', testPlanId],
    queryFn: async () => {
      const params = testPlanId ? `?test_plan_id=${testPlanId}` : ''
      const response = await api.get(`/test-executions${params}`)
      return response.data as TestExecution[]
    }
  })
}

export function useTestExecution(id: string) {
  return useQuery({
    queryKey: ['test-execution', id],
    queryFn: async () => {
      const response = await api.get(`/test-executions/${id}`)
      return response.data as TestExecution
    },
    enabled: !!id
  })
}

export function useCreateTestExecution() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (execution: Omit<TestExecution, 'id' | 'created_at' | 'updated_at'>) => {
      const response = await api.post('/test-executions', execution)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['test-executions'] })
    }
  })
}

export function useUpdateTestExecution() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...execution }: Partial<TestExecution> & { id: string }) => {
      const response = await api.put(`/test-executions/${id}`, execution)
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['test-executions'] })
      queryClient.invalidateQueries({ queryKey: ['test-execution', variables.id] })
    }
  })
}

// Test Cycles
export function useTestCycles() {
  return useQuery({
    queryKey: ['test-cycles'],
    queryFn: async () => {
      const response = await api.get('/test-cycles')
      return response.data as TestCycle[]
    }
  })
}

export function useTestCycle(id: string) {
  return useQuery({
    queryKey: ['test-cycle', id],
    queryFn: async () => {
      const response = await api.get(`/test-cycles/${id}`)
      return response.data as TestCycle
    },
    enabled: !!id
  })
}

export function useCreateTestCycle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (cycle: Omit<TestCycle, 'id' | 'created_at' | 'updated_at'>) => {
      const response = await api.post('/test-cycles', cycle)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['test-cycles'] })
    }
  })
}

// Test Statistics
export function useTestStatistics(cycleId?: string) {
  return useQuery({
    queryKey: ['test-statistics', cycleId],
    queryFn: async () => {
      const params = cycleId ? `?cycle_id=${cycleId}` : ''
      const response = await api.get(`/test-statistics${params}`)
      return response.data as {
        totalTests: number
        completedTests: number
        passedTests: number
        failedTests: number
        exceptionsCount: number
        overduTests: number
        testingProgress: number
        testsByStatus: Record<string, number>
        testsByControl: Array<{
          control_id: string
          control_name: string
          test_count: number
          passed: number
          failed: number
          status: string
        }>
      }
    }
  })
}