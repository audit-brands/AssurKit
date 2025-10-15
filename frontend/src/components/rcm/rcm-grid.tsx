import { useState, useMemo } from 'react'
import { useRCMMatrix, type RCMNode } from '@/hooks/use-rcm'
import { EffectivenessIndicator, type EffectivenessLevel } from './effectiveness-indicator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import {
  ChevronRight,
  ChevronDown,
  Shield,
  Download,
  Filter
} from 'lucide-react'

interface RCMGridProps {
  companyId?: string
}

interface TreeNode extends RCMNode {
  children: TreeNode[]
}

type ViewLevel = 'process' | 'subprocess' | 'risk'
type EffectivenessFilter = 'all' | 'effective' | 'partially-effective' | 'ineffective' | 'not-tested'
type RiskLevelFilter = 'all' | 'high' | 'medium' | 'low'

export function RCMGrid({ companyId }: RCMGridProps) {
  const { data: rcmData, isLoading } = useRCMMatrix(companyId)
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  const [viewLevel, setViewLevel] = useState<ViewLevel>('subprocess')
  const [filterEffectiveness, setFilterEffectiveness] = useState<EffectivenessFilter>('all')
  const [riskLevelFilter, setRiskLevelFilter] = useState<RiskLevelFilter>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showOnlyUncovered, setShowOnlyUncovered] = useState(false)

  // Build hierarchical tree structure
  const treeData = useMemo(() => {
    if (!rcmData) return []

    const tree: TreeNode[] = []
    const nodeMap = new Map()

    // Create node map
    rcmData.nodes.forEach(node => {
      nodeMap.set(node.id, { ...node, children: [] })
    })

    // Build relationships
    rcmData.relationships.forEach(rel => {
      const parent = nodeMap.get(rel.from)
      const child = nodeMap.get(rel.to)
      if (parent && child) {
        parent.children.push(child)
      }
    })

    // Get root nodes (companies)
    rcmData.nodes
      .filter(n => n.type === 'company')
      .forEach(company => {
        tree.push(nodeMap.get(company.id))
      })

    return tree
  }, [rcmData])

  // Apply filters to tree data
  const filteredTreeData = useMemo(() => {
    if (!treeData.length) return []

    const filterNode = (node: TreeNode): TreeNode | null => {
      // Search filter
      if (searchTerm && !node.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        return null
      }

      // Effectiveness filter
      if (filterEffectiveness !== 'all') {
        if (node.type === 'control' && node.effectiveness) {
          const normalizedEffectiveness = node.effectiveness.toLowerCase().replace(/ /g, '-')
          if (normalizedEffectiveness !== filterEffectiveness) {
            return null
          }
        } else if (node.type === 'control' && filterEffectiveness === 'not-tested') {
          // Include controls without effectiveness data when filtering for "not-tested"
          if (node.effectiveness) {
            return null
          }
        } else if (node.type === 'control') {
          // Exclude controls without effectiveness data for other filters
          return null
        }
      }

      // Risk level filter
      if (riskLevelFilter !== 'all') {
        if (node.type === 'risk') {
          const riskLevel = node.metadata?.impact as string
          if (riskLevel?.toLowerCase() !== riskLevelFilter) {
            return null
          }
        }
      }

      // Uncovered risks filter
      if (showOnlyUncovered && node.type === 'risk') {
        const hasControls = node.children.some(child => child.type === 'control')
        if (hasControls) {
          return null
        }
      }

      // View level filter
      if (viewLevel === 'process' && !['company', 'process'].includes(node.type)) {
        return null
      }
      if (viewLevel === 'subprocess' && !['company', 'process', 'subprocess'].includes(node.type)) {
        return null
      }

      // Filter children recursively
      const filteredChildren = node.children
        .map(child => filterNode(child))
        .filter((child): child is TreeNode => child !== null)

      return {
        ...node,
        children: filteredChildren
      }
    }

    return treeData
      .map(node => filterNode(node))
      .filter((node): node is TreeNode => node !== null)
  }, [treeData, searchTerm, filterEffectiveness, riskLevelFilter, showOnlyUncovered, viewLevel])

  const toggleExpand = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes)
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId)
    } else {
      newExpanded.add(nodeId)
    }
    setExpandedNodes(newExpanded)
  }

  const getEffectivenessLevel = (effectiveness?: string): EffectivenessLevel => {
    if (!effectiveness) return 'not-tested'
    const normalized = effectiveness.toLowerCase().replace(/ /g, '-')
    switch (normalized) {
      case 'effective':
        return 'effective'
      case 'partially-effective':
      case 'partial':
        return 'partially-effective'
      case 'ineffective':
        return 'ineffective'
      case 'not-tested':
        return 'not-tested'
      case 'pending':
        return 'pending'
      default:
        return 'not-tested'
    }
  }

  const getEffectivenessScore = (effectiveness?: string): number => {
    switch (getEffectivenessLevel(effectiveness)) {
      case 'effective':
        return 90
      case 'partially-effective':
        return 60
      case 'ineffective':
        return 30
      case 'pending':
        return 0
      case 'not-tested':
      default:
        return 0
    }
  }


  const getControlTypeColor = (type?: string) => {
    switch (type) {
      case 'Preventive':
        return 'bg-blue-100 text-blue-800'
      case 'Detective':
        return 'bg-yellow-100 text-yellow-800'
      case 'Corrective':
        return 'bg-orange-100 text-orange-800'
      case 'Compensating':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getRiskScoreColor = (impact?: string, likelihood?: string) => {
    if (!impact || !likelihood) return 'bg-gray-100 text-gray-800'

    const impactScore = { Low: 1, Medium: 2, High: 3, Critical: 4 }[impact] || 0
    const likelihoodScore = { Rare: 1, Unlikely: 2, Possible: 3, Likely: 4, 'Almost Certain': 5 }[likelihood] || 0
    const score = impactScore * likelihoodScore

    if (score >= 15) return 'bg-red-100 text-red-800'
    if (score >= 10) return 'bg-orange-100 text-orange-800'
    if (score >= 5) return 'bg-yellow-100 text-yellow-800'
    return 'bg-green-100 text-green-800'
  }

  const renderNode = (node: TreeNode, level: number = 0): React.ReactNode => {
    const isExpanded = expandedNodes.has(node.id)
    const hasChildren = node.children && node.children.length > 0
    const indent = level * 24

    // Filter based on view level
    if (viewLevel === 'process' && level > 1) return null
    if (viewLevel === 'subprocess' && level > 2) return null

    // Filter based on effectiveness
    if (filterEffectiveness !== 'all' && node.type === 'control') {
      if (node.effectiveness) {
        const normalizedEffectiveness = node.effectiveness.toLowerCase().replace(/ /g, '-')
        if (normalizedEffectiveness !== filterEffectiveness) return null
      } else if (filterEffectiveness !== 'not-tested') {
        return null
      }
    }

    return (
      <>
        <TableRow key={node.id} className="hover:bg-gray-50">
          <TableCell className="font-medium">
            <div
              className="flex items-center gap-2"
              style={{ paddingLeft: `${indent}px` }}
            >
              {hasChildren && (
                <button
                  onClick={() => toggleExpand(node.id)}
                  className="p-0.5 hover:bg-gray-200 rounded"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
              )}
              {!hasChildren && <div className="w-5" />}
              <span className="text-sm">{node.name}</span>
            </div>
          </TableCell>
          <TableCell>
            <Badge variant="outline" className="text-xs">
              {node.type.charAt(0).toUpperCase() + node.type.slice(1)}
            </Badge>
          </TableCell>
          <TableCell>
            {node.type === 'risk' && node.metadata?.impact ? (
              <Badge className={cn('text-xs', getRiskScoreColor(node.metadata.impact as string, node.metadata.likelihood as string))}>
                {String(node.metadata.impact)}/{String(node.metadata.likelihood)}
              </Badge>
            ) : null}
            {node.type === 'control' && node.metadata?.type ? (
              <Badge className={cn('text-xs', getControlTypeColor(node.metadata.type as string))}>
                {String(node.metadata.type)}
              </Badge>
            ) : null}
          </TableCell>
          <TableCell>
            {node.type === 'control' ? (
              <EffectivenessIndicator
                effectiveness={{
                  level: getEffectivenessLevel(node.effectiveness),
                  score: getEffectivenessScore(node.effectiveness),
                  trend: node.metadata?.trend as ('improving' | 'declining' | 'stable' | null),
                  lastTested: node.metadata?.lastTested ? new Date(node.metadata.lastTested as string) : undefined,
                  testCount: node.metadata?.testCount as number,
                  passRate: node.metadata?.passRate as number
                }}
                size="sm"
                showDetails={false}
              />
            ) : null}
            {node.type === 'risk' && node.metadata?.assertions ? (
              <div className="flex flex-wrap gap-1">
                {(node.metadata.assertions as string[]).slice(0, 2).map((assertion, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {assertion}
                  </Badge>
                ))}
              </div>
            ) : null}
          </TableCell>
          <TableCell>
            {node.type === 'control' && node.metadata?.frequency ? (
              <span className="text-sm text-gray-600">{String(node.metadata.frequency)}</span>
            ) : null}
            {node.type === 'control' && node.metadata?.automation ? (
              <Badge variant="secondary" className="ml-2 text-xs">
                {String(node.metadata.automation)}
              </Badge>
            ) : null}
          </TableCell>
          <TableCell>
            {node.type === 'control' && node.metadata?.keyControl ? (
              <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                Key Control
              </Badge>
            ) : null}
            {node.status === 'Inactive' ? (
              <Badge variant="secondary" className="text-xs">
                Inactive
              </Badge>
            ) : null}
          </TableCell>
        </TableRow>
        {isExpanded && hasChildren && node.children.map((child: TreeNode) =>
          renderNode(child, level + 1)
        )}
      </>
    )
  }

  const exportRCM = () => {
    if (!rcmData) return

    // Prepare CSV data
    const headers = ['Type', 'Name', 'Parent', 'Status', 'Effectiveness', 'Risk Level', 'Control Type', 'Frequency', 'Automation', 'Key Control']
    const rows: string[][] = []

    // Flatten the tree structure for CSV export
    const flattenNode = (node: RCMNode, parentName = '') => {
      const row = [
        node.type,
        node.name,
        parentName,
        node.status || '',
        node.effectiveness || '',
        node.type === 'risk' ? `${node.metadata?.impact || ''}/${node.metadata?.likelihood || ''}` : '',
        node.type === 'control' ? String(node.metadata?.type || '') : '',
        node.type === 'control' ? String(node.metadata?.frequency || '') : '',
        node.type === 'control' ? String(node.metadata?.automation || '') : '',
        node.type === 'control' && node.metadata?.keyControl ? 'Yes' : ''
      ]
      rows.push(row)
    }

    // Process all nodes
    rcmData.nodes.forEach(node => {
      flattenNode(node, node.parent || '')
    })

    // Convert to CSV format
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
    ].join('\n')

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `rcm-export-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Risk Control Matrix</CardTitle>
          <CardDescription>Loading RCM data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!rcmData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Risk Control Matrix</CardTitle>
          <CardDescription>No data available</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Controls</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rcmData.statistics.totalControls}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Key Controls</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {rcmData.statistics.keyControls}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Effective Controls</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {rcmData.statistics.effectiveControls}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Risks Without Controls</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {rcmData.statistics.risksWithoutControls}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Untested Controls</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {rcmData.statistics.controlsWithoutTesting}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main RCM Grid */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Risk Control Matrix
              </CardTitle>
              <CardDescription>
                Hierarchical view of entities, risks, and controls
              </CardDescription>
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 flex-wrap">
                <Select value={viewLevel} onValueChange={(value: ViewLevel) => setViewLevel(value)}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="process">Process Level</SelectItem>
                    <SelectItem value="subprocess">Subprocess Level</SelectItem>
                    <SelectItem value="risk">Full Detail</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={exportRCM} size="sm" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Input
                  placeholder="Search by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-48"
                />
                <Select value={filterEffectiveness} onValueChange={(value: EffectivenessFilter) => setFilterEffectiveness(value)}>
                  <SelectTrigger className="w-40">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Effectiveness" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Controls</SelectItem>
                    <SelectItem value="effective">Effective</SelectItem>
                    <SelectItem value="partially-effective">Partial</SelectItem>
                    <SelectItem value="ineffective">Ineffective</SelectItem>
                    <SelectItem value="not-tested">Not Tested</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={riskLevelFilter} onValueChange={(value: RiskLevelFilter) => setRiskLevelFilter(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Risk Level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Risks</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="uncovered"
                    checked={showOnlyUncovered}
                    onCheckedChange={(checked) => setShowOnlyUncovered(checked === true)}
                  />
                  <label htmlFor="uncovered" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Uncovered Risks Only
                  </label>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[250px]">Entity / Risk / Control</TableHead>
                  <TableHead className="min-w-[100px]">Type</TableHead>
                  <TableHead className="min-w-[150px]">Risk/Control Type</TableHead>
                  <TableHead className="min-w-[150px]">Effectiveness</TableHead>
                  <TableHead className="min-w-[150px]">Frequency</TableHead>
                  <TableHead className="min-w-[100px]">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {treeData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No RCM data available. Start by creating companies, processes, risks, and controls.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTreeData.map(node => renderNode(node))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}