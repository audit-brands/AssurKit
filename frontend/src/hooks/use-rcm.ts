import { useQuery } from '@tanstack/react-query'
import { useCompanies } from './use-companies'
import { useProcesses } from './use-processes'
import { useSubprocesses } from './use-subprocesses'
import { useRisks } from './use-risks'
import { useControls } from './use-controls'

export interface RCMNode {
  id: string
  type: 'company' | 'process' | 'subprocess' | 'risk' | 'control'
  name: string
  parent?: string
  metadata?: Record<string, unknown>
  status?: string
  effectiveness?: 'Effective' | 'Partially Effective' | 'Ineffective' | 'Not Tested'
  testing?: {
    lastTested?: string
    frequency?: string
    nextDue?: string
  }
}

export interface RCMRelationship {
  from: string
  to: string
  type: 'owns' | 'contains' | 'mitigates'
  strength?: 'primary' | 'secondary'
}

export interface RCMMatrix {
  nodes: RCMNode[]
  relationships: RCMRelationship[]
  statistics: {
    totalControls: number
    keyControls: number
    effectiveControls: number
    risksWithoutControls: number
    controlsWithoutTesting: number
  }
}

// Build the complete RCM matrix from entity data
export function useRCMMatrix(companyId?: string) {
  const { data: companies } = useCompanies()
  const { data: processes } = useProcesses()
  const { data: subprocesses } = useSubprocesses()
  const { data: risks } = useRisks()
  const { data: controls } = useControls()

  return useQuery({
    queryKey: ['rcm-matrix', companyId],
    queryFn: async (): Promise<RCMMatrix> => {
      const nodes: RCMNode[] = []
      const relationships: RCMRelationship[] = []

      // Filter data by company if specified
      const filteredCompanies = companyId
        ? companies?.filter(c => c.id === companyId) || []
        : companies || []

      const companyIds = new Set(filteredCompanies.map(c => c.id))

      const filteredProcesses = processes?.filter(p =>
        companyIds.has(p.company_id)
      ) || []

      const processIds = new Set(filteredProcesses.map(p => p.id))

      const filteredSubprocesses = subprocesses?.filter(s =>
        processIds.has(s.process_id)
      ) || []

      const subprocessIds = new Set(filteredSubprocesses.map(s => s.id))

      const filteredRisks = risks?.filter(r =>
        subprocessIds.has(r.subprocess_id)
      ) || []

      const riskIds = new Set(filteredRisks.map(r => r.id))

      const filteredControls = controls?.filter(c =>
        riskIds.has(c.risk_id)
      ) || []

      // Add company nodes
      filteredCompanies.forEach(company => {
        nodes.push({
          id: company.id,
          type: 'company',
          name: company.company_name,
          status: company.status
        })
      })

      // Add process nodes and relationships
      filteredProcesses.forEach(process => {
        nodes.push({
          id: process.id,
          type: 'process',
          name: process.process_name,
          parent: process.company_id,
          status: process.status
        })

        relationships.push({
          from: process.company_id,
          to: process.id,
          type: 'owns'
        })
      })

      // Add subprocess nodes and relationships
      filteredSubprocesses.forEach(subprocess => {
        nodes.push({
          id: subprocess.id,
          type: 'subprocess',
          name: subprocess.subprocess_name,
          parent: subprocess.process_id,
          status: subprocess.status
        })

        relationships.push({
          from: subprocess.process_id,
          to: subprocess.id,
          type: 'contains'
        })
      })

      // Add risk nodes and relationships
      filteredRisks.forEach(risk => {
        nodes.push({
          id: risk.id,
          type: 'risk',
          name: risk.risk_name,
          parent: risk.subprocess_id,
          status: risk.status,
          metadata: {
            impact: risk.impact,
            likelihood: risk.likelihood,
            category: risk.risk_category,
            assertions: risk.assertions
          }
        })

        relationships.push({
          from: risk.subprocess_id,
          to: risk.id,
          type: 'contains'
        })
      })

      // Add control nodes and relationships
      filteredControls.forEach(control => {
        // Determine effectiveness based on control status and testing
        let effectiveness: RCMNode['effectiveness'] = 'Not Tested'
        if (control.status === 'Active') {
          // In a real app, this would come from test results
          effectiveness = 'Effective' // Default for demo
        }

        nodes.push({
          id: control.id,
          type: 'control',
          name: control.control_name,
          parent: control.risk_id,
          status: control.status,
          effectiveness,
          metadata: {
            type: control.control_type,
            frequency: control.frequency,
            automation: control.automation,
            keyControl: control.key_control,
            owner: control.owner
          }
        })

        relationships.push({
          from: control.risk_id,
          to: control.id,
          type: 'mitigates',
          strength: control.key_control ? 'primary' : 'secondary'
        })
      })

      // Calculate statistics
      const statistics = {
        totalControls: filteredControls.length,
        keyControls: filteredControls.filter(c => c.key_control).length,
        effectiveControls: filteredControls.filter(c => c.status === 'Active').length,
        risksWithoutControls: filteredRisks.filter(risk =>
          !filteredControls.some(control => control.risk_id === risk.id)
        ).length,
        controlsWithoutTesting: filteredControls.filter(c => c.status === 'Draft').length
      }

      return {
        nodes,
        relationships,
        statistics
      }
    },
    enabled: !!companies && !!processes && !!subprocesses && !!risks && !!controls
  })
}

// Get RCM data for a specific process
export function useProcessRCM(processId: string) {
  const { data: processes } = useProcesses()
  const { data: subprocesses } = useSubprocesses()
  const { data: risks } = useRisks()
  const { data: controls } = useControls()

  return useQuery({
    queryKey: ['process-rcm', processId],
    queryFn: async () => {
      const process = processes?.find(p => p.id === processId)
      if (!process) return null

      const processSubprocesses = subprocesses?.filter(s => s.process_id === processId) || []
      const subprocessIds = new Set(processSubprocesses.map(s => s.id))

      const processRisks = risks?.filter(r => subprocessIds.has(r.subprocess_id)) || []
      const riskIds = new Set(processRisks.map(r => r.id))

      const processControls = controls?.filter(c => riskIds.has(c.risk_id)) || []

      return {
        process,
        subprocesses: processSubprocesses,
        risks: processRisks,
        controls: processControls,
        summary: {
          subprocessCount: processSubprocesses.length,
          riskCount: processRisks.length,
          controlCount: processControls.length,
          keyControlCount: processControls.filter(c => c.key_control).length,
          highRiskCount: processRisks.filter(r => r.impact === 'High' || r.impact === 'Critical').length
        }
      }
    },
    enabled: !!processId && !!processes && !!subprocesses && !!risks && !!controls
  })
}

// Get control coverage metrics
export function useControlCoverage() {
  const { data: risks } = useRisks()
  const { data: controls } = useControls()

  return useQuery({
    queryKey: ['control-coverage'],
    queryFn: async () => {
      if (!risks || !controls) return null

      const riskControlMap = new Map<string, number>()

      controls.forEach(control => {
        const count = riskControlMap.get(control.risk_id) || 0
        riskControlMap.set(control.risk_id, count + 1)
      })

      const coverage = {
        totalRisks: risks.length,
        coveredRisks: riskControlMap.size,
        uncoveredRisks: risks.length - riskControlMap.size,
        coveragePercentage: (riskControlMap.size / risks.length) * 100,
        risksByControlCount: {
          none: 0,
          single: 0,
          multiple: 0
        },
        highRisksWithoutControls: [] as typeof risks
      }

      risks.forEach(risk => {
        const controlCount = riskControlMap.get(risk.id) || 0
        if (controlCount === 0) {
          coverage.risksByControlCount.none++
          if (risk.impact === 'High' || risk.impact === 'Critical') {
            coverage.highRisksWithoutControls.push(risk)
          }
        } else if (controlCount === 1) {
          coverage.risksByControlCount.single++
        } else {
          coverage.risksByControlCount.multiple++
        }
      })

      return coverage
    },
    enabled: !!risks && !!controls
  })
}