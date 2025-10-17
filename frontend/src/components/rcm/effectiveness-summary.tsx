import { useControls, type ControlSummary } from '@/hooks/use-controls'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EffectivenessMatrix, type EffectivenessLevel, type TrendDirection } from './effectiveness-indicator'
import { TrendingUp, Shield, AlertTriangle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export function EffectivenessSummary() {
  const { data, isLoading } = useControls({ limit: 100 })
  const controls = data?.items ?? []

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Control Effectiveness Overview</CardTitle>
          <CardDescription>Loading effectiveness data...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (controls.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Control Effectiveness Overview</CardTitle>
          <CardDescription>No control data available</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  // Transform controls data for the effectiveness matrix
  const controlsWithEffectiveness = controls.map(control => ({
    id: control.id,
    name: control.control_name,
    effectiveness: {
      level: getEffectivenessLevel(control.status),
      score: getEffectivenessScore(control.status),
      trend: getControlTrend(control),
      lastTested: undefined, // This would come from test history
      testCount: 0, // This would come from test history
      passRate: 0 // This would come from test history
    },
    keyControl: control.key_control === true
  }))

  // Calculate statistics
  const stats = {
    totalControls: controls.length,
    keyControls: controls.filter(c => c.key_control).length,
    automatedControls: controls.filter(c => c.automation === 'Automated').length,
    needsTesting: controls.filter(c => c.status === 'Draft' || c.status === 'Retired').length, // Simplified for now
    criticalIssues: controls.filter(c => c.status === 'Retired' && c.key_control).length
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Control Health Score
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {calculateHealthScore(controls)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Based on effectiveness and testing
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Key Controls at Risk
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.criticalIssues}
            </div>
            <p className="text-xs text-muted-foreground">
              Require immediate attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Automation Rate
            </CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round((stats.automatedControls / stats.totalControls) * 100)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.automatedControls} of {stats.totalControls} controls
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Effectiveness Matrix */}
      <Card>
        <CardHeader>
          <CardTitle>Effectiveness Distribution</CardTitle>
          <CardDescription>
            Control effectiveness breakdown across all controls
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EffectivenessMatrix controls={controlsWithEffectiveness} />
        </CardContent>
      </Card>

      {/* Testing Alerts */}
      {stats.needsTesting > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-yellow-800">Testing Required</CardTitle>
              <Badge variant="secondary" className="bg-yellow-100">
                {stats.needsTesting} Controls
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-yellow-700">
              {stats.needsTesting} control{stats.needsTesting > 1 ? 's' : ''} need testing based on their configured frequency.
              Regular testing ensures control effectiveness and compliance.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Helper functions
function getEffectivenessLevel(status?: string): EffectivenessLevel {
  if (!status) return 'not-tested'
  const normalized = status.toLowerCase()
  switch (normalized) {
    case 'effective':
      return 'effective'
    case 'partially effective':
    case 'partial':
      return 'partially-effective'
    case 'ineffective':
      return 'ineffective'
    case 'not tested':
      return 'not-tested'
    case 'pending':
      return 'pending'
    default:
      return 'not-tested'
  }
}

function getEffectivenessScore(status?: string): number {
  const level = getEffectivenessLevel(status)
  switch (level) {
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

function getControlTrend(_control: ControlSummary): TrendDirection {
  // This would typically come from historical data
  // For now, return stable for all
  return 'stable'
}


function calculateHealthScore(controls: ControlSummary[]): number {
  if (controls.length === 0) return 0

  const scores = controls.map(control => {
    let score = getEffectivenessScore(control.status)

    // Bonus for automated controls
    if (control.automation === 'Automated') {
      score += 10
    }

    // Penalty for retired controls
    if (control.status === 'Retired') {
      score -= 20
    }

    // Weight key controls more heavily
    if (control.key_control) {
      score *= 1.5
    }

    return Math.min(100, Math.max(0, score))
  })

  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
}
