import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api-client'
import { useRisks } from './use-risks'

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

interface ApiRiskControlMatrixItem {
  risk_id: string
  risk_name: string
  risk_type: string
  risk_level: string
  subprocess: {
    id: string
    name: string
    process: {
      id: string
      name: string
      company: {
        id: string
        name: string
      }
    }
  }
  controls: Array<{
    control_id: string
    control_name: string
    control_business_id: string
    control_type: string
    frequency: string
    is_key_control: boolean
    effectiveness: string | null
    rationale: string | null
    last_updated: string | null
  }>
}

const effectivenessMap: Record<string, RCMNode['effectiveness']> = {
  Effective: 'Effective',
  'Partially Effective': 'Partially Effective',
  'Not Effective': 'Ineffective',
}

const normalizeRiskLevel = (riskLevel: string): 'low' | 'medium' | 'high' | 'critical' => {
  const normalized = riskLevel.toLowerCase()
  if (normalized.includes('very high')) return 'critical'
  if (normalized.includes('high')) return 'high'
  if (normalized.includes('medium')) return 'medium'
  return 'low'
}

const buildRCMMatrix = (items: ApiRiskControlMatrixItem[]): RCMMatrix => {
  const nodes: RCMNode[] = []
  const relationships: RCMRelationship[] = []

  const companyNodes = new Map<string, RCMNode>()
  const processNodes = new Map<string, RCMNode>()
  const subprocessNodes = new Map<string, RCMNode>()
  const riskNodes = new Map<string, RCMNode>()
  const controlNodes = new Map<string, RCMNode>()
  const relationshipKeys = new Set<string>()

  const uniqueControlIds = new Set<string>()
  const keyControlIds = new Set<string>()
  const effectiveControlIds = new Set<string>()
  let controlsWithoutTesting = 0

  const addNode = (map: Map<string, RCMNode>, id: string, node: RCMNode) => {
    if (!map.has(id)) {
      map.set(id, node)
      nodes.push(node)
    }
    return map.get(id)!
  }

  const addRelationship = (rel: RCMRelationship) => {
    const key = `${rel.from}::${rel.to}::${rel.type}`
    if (!relationshipKeys.has(key)) {
      relationshipKeys.add(key)
      relationships.push(rel)
    }
  }

  items.forEach(item => {
    const company = addNode(companyNodes, item.subprocess.process.company.id, {
      id: item.subprocess.process.company.id,
      type: 'company',
      name: item.subprocess.process.company.name,
    })

    const process = addNode(processNodes, item.subprocess.process.id, {
      id: item.subprocess.process.id,
      type: 'process',
      name: item.subprocess.process.name,
      parent: company.id,
    })

    addRelationship({
      from: company.id,
      to: process.id,
      type: 'owns',
    })

    const subprocess = addNode(subprocessNodes, item.subprocess.id, {
      id: item.subprocess.id,
      type: 'subprocess',
      name: item.subprocess.name,
      parent: process.id,
    })

    addRelationship({
      from: process.id,
      to: subprocess.id,
      type: 'contains',
    })

    const normalizedLevel = normalizeRiskLevel(item.risk_level)
    const likelihood =
      normalizedLevel === 'critical'
        ? 'Almost Certain'
        : normalizedLevel === 'high'
          ? 'Likely'
          : normalizedLevel === 'medium'
            ? 'Possible'
            : 'Unlikely'

    const risk = addNode(riskNodes, item.risk_id, {
      id: item.risk_id,
      type: 'risk',
      name: item.risk_name,
      parent: subprocess.id,
      metadata: {
        riskLevel: item.risk_level,
        normalizedRiskLevel: normalizedLevel,
        riskType: item.risk_type,
        impact: normalizedLevel === 'critical'
          ? 'Critical'
          : normalizedLevel === 'high'
            ? 'High'
            : normalizedLevel === 'medium'
              ? 'Medium'
              : 'Low',
        likelihood,
      },
    })

    addRelationship({
      from: subprocess.id,
      to: risk.id,
      type: 'contains',
    })

    if (item.controls.length === 0) {
      return
    }

    item.controls.forEach(control => {
      uniqueControlIds.add(control.control_id)
      if (control.is_key_control) {
        keyControlIds.add(control.control_id)
      }

      const effectiveness = control.effectiveness
        ? effectivenessMap[control.effectiveness] ?? 'Not Tested'
        : 'Not Tested'

      if (effectiveness === 'Effective') {
        effectiveControlIds.add(control.control_id)
      }

      if (effectiveness === 'Not Tested') {
        controlsWithoutTesting++
      }

      const nodeId = `${item.risk_id}:${control.control_id}`
      const controlNode = addNode(controlNodes, nodeId, {
        id: nodeId,
        type: 'control',
        name: control.control_name,
        parent: risk.id,
        status: control.effectiveness ?? undefined,
        effectiveness,
        metadata: {
          originalControlId: control.control_id,
          businessId: control.control_business_id,
          type: control.control_type,
          frequency: control.frequency,
          keyControl: control.is_key_control,
          rationale: control.rationale,
          lastUpdated: control.last_updated,
        },
      })

      addRelationship({
        from: risk.id,
        to: controlNode.id,
        type: 'mitigates',
        strength: control.is_key_control ? 'primary' : 'secondary',
      })
    })
  })

  const risksWithoutControls = items.filter(item => item.controls.length === 0).length

  const statistics = {
    totalControls: uniqueControlIds.size,
    keyControls: keyControlIds.size,
    effectiveControls: effectiveControlIds.size,
    risksWithoutControls,
    controlsWithoutTesting,
  }

  return {
    nodes,
    relationships,
    statistics,
  }
}

export function useRCMMatrix(companyId?: string) {
  return useQuery({
    queryKey: ['rcm-matrix', companyId],
    queryFn: async (): Promise<RCMMatrix> => {
      const response = await api.get('/api/risk-control-matrix', {
        params: {
          company_id: companyId,
          limit: 1000,
        },
      })
      const items = (response.data?.data ?? []) as ApiRiskControlMatrixItem[]
      return buildRCMMatrix(items)
    }
  })
}

export function useProcessRCM(processId: string) {
  const rcmQuery = useRCMMatrix()

  const data = useMemo(() => {
    if (!processId || !rcmQuery.data) {
      return null
    }

    const processNode = rcmQuery.data.nodes.find(node => node.type === 'process' && node.id === processId)
    if (!processNode) {
      return null
    }

    const subprocesses = rcmQuery.data.nodes.filter(
      node => node.type === 'subprocess' && node.parent === processId
    )

    const subprocessIds = new Set(subprocesses.map(node => node.id))
    const risks = rcmQuery.data.nodes.filter(
      node => node.type === 'risk' && node.parent && subprocessIds.has(node.parent)
    )

    const riskIds = new Set(risks.map(risk => risk.id))
    const controls = rcmQuery.data.nodes.filter(
      node => node.type === 'control' && node.parent && riskIds.has(node.parent)
    )

    return {
      process: processNode,
      subprocesses,
      risks,
      controls,
      summary: {
        subprocessCount: subprocesses.length,
        riskCount: risks.length,
        controlCount: controls.length,
        keyControlCount: controls.filter(control => control.metadata?.keyControl === true).length,
        highRiskCount: risks.filter(risk => {
          const riskLevel = risk.metadata?.riskLevel as string | undefined
          return riskLevel === 'High' || riskLevel === 'Very High'
        }).length,
      },
    }
  }, [processId, rcmQuery.data])

  return {
    data,
    isLoading: rcmQuery.isLoading,
    error: rcmQuery.error,
  }
}

export function useControlCoverage() {
  const rcmQuery = useRCMMatrix()
  const { data: risksData } = useRisks()

  const coverage = useMemo(() => {
    if (!rcmQuery.data || !risksData) {
      return null
    }

    const riskNodes = rcmQuery.data.nodes.filter(node => node.type === 'risk')
    const controlRelationships = rcmQuery.data.relationships.filter(rel => rel.type === 'mitigates')

    const controlCountByRisk = controlRelationships.reduce<Map<string, number>>((acc, rel) => {
      const current = acc.get(rel.from) ?? 0
      acc.set(rel.from, current + 1)
      return acc
    }, new Map())

    const risksByControlCount = {
      none: 0,
      single: 0,
      multiple: 0,
    }

    const highRisksWithoutControls: typeof risksData = []

    riskNodes.forEach(riskNode => {
      const count = controlCountByRisk.get(riskNode.id) ?? 0
      if (count === 0) {
        risksByControlCount.none++
        const sourceRisk = risksData.find(risk => risk.id === riskNode.id)
        if (sourceRisk) {
          const riskLevel = riskNode.metadata?.riskLevel as string | undefined
          if (riskLevel === 'High' || riskLevel === 'Very High') {
            highRisksWithoutControls.push(sourceRisk)
          }
        }
      } else if (count === 1) {
        risksByControlCount.single++
      } else {
        risksByControlCount.multiple++
      }
    })

    return {
      totalRisks: risksData.length,
      coveredRisks: risksData.length - risksByControlCount.none,
      uncoveredRisks: risksByControlCount.none,
      coveragePercentage: risksData.length > 0
        ? ((risksData.length - risksByControlCount.none) / risksData.length) * 100
        : 0,
      risksByControlCount,
      highRisksWithoutControls,
    }
  }, [rcmQuery.data, risksData])

  return {
    data: coverage,
    isLoading: rcmQuery.isLoading,
    error: rcmQuery.error,
  }
}
