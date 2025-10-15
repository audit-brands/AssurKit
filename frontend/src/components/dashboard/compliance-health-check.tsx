import { useComplianceHealthCheck, type DashboardFilters } from '@/hooks/use-dashboard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
} from 'recharts'
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  ExternalLink,
  FileX,
  AlertCircle,
  Target,
  Lightbulb
} from 'lucide-react'

interface ComplianceHealthCheckProps {
  filters: DashboardFilters
}

export function ComplianceHealthCheck({ filters }: ComplianceHealthCheckProps) {
  const { data: healthCheck, isLoading, error } = useComplianceHealthCheck(filters)

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map(i => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error || !healthCheck) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-red-600">Failed to load compliance health check. Please try again.</p>
        </CardContent>
      </Card>
    )
  }

  // Prepare data for radial chart
  const healthScoreData = [
    {
      name: 'Overall',
      value: healthCheck.overall_score,
      fill: getScoreColor(healthCheck.overall_score)
    }
  ]

  const componentScores = [
    { name: 'Control Design', value: healthCheck.control_design_score, color: '#3B82F6' },
    { name: 'Control Execution', value: healthCheck.control_execution_score, color: '#10B981' },
    { name: 'Issue Management', value: healthCheck.issue_management_score, color: '#F59E0B' },
    { name: 'Evidence Quality', value: healthCheck.evidence_quality_score, color: '#8B5CF6' }
  ]

  function getScoreColor(score: number): string {
    if (score >= 90) return '#10B981' // Green
    if (score >= 80) return '#3B82F6' // Blue
    if (score >= 70) return '#F59E0B' // Orange
    return '#EF4444' // Red
  }

  function getScoreStatus(score: number): 'excellent' | 'good' | 'warning' | 'poor' {
    if (score >= 90) return 'excellent'
    if (score >= 80) return 'good'
    if (score >= 70) return 'warning'
    return 'poor'
  }

  function getSeverityIcon(severity: string) {
    switch (severity) {
      case 'Critical': return <AlertCircle className="h-4 w-4 text-red-600" />
      case 'High': return <AlertTriangle className="h-4 w-4 text-orange-600" />
      case 'Medium': return <Clock className="h-4 w-4 text-yellow-600" />
      case 'Low': return <CheckCircle className="h-4 w-4 text-green-600" />
      default: return <AlertTriangle className="h-4 w-4 text-gray-600" />
    }
  }

  function getRedFlagIcon(type: string) {
    switch (type) {
      case 'control_gap': return <Shield className="h-4 w-4 text-red-600" />
      case 'overdue_test': return <Clock className="h-4 w-4 text-orange-600" />
      case 'critical_issue': return <AlertTriangle className="h-4 w-4 text-red-600" />
      case 'missing_evidence': return <FileX className="h-4 w-4 text-orange-600" />
      default: return <AlertTriangle className="h-4 w-4 text-gray-600" />
    }
  }

  function getPriorityColor(priority: string) {
    switch (priority) {
      case 'High': return 'destructive'
      case 'Medium': return 'default'
      case 'Low': return 'secondary'
      default: return 'outline'
    }
  }

  function getEffortColor(effort: string) {
    switch (effort) {
      case 'Low': return 'bg-green-100 text-green-800'
      case 'Medium': return 'bg-yellow-100 text-yellow-800'
      case 'High': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Overall Health Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Compliance Health Score
          </CardTitle>
          <CardDescription>
            Overall assessment of SOX compliance readiness
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Overall Score Radial Chart */}
            <div className="flex flex-col items-center">
              <div className="h-48 w-48">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart
                    cx="50%"
                    cy="50%"
                    innerRadius="60%"
                    outerRadius="90%"
                    data={healthScoreData}
                    startAngle={90}
                    endAngle={-270}
                  >
                    <RadialBar
                      dataKey="value"
                      cornerRadius={10}
                      fill={healthScoreData[0].fill}
                    />
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{healthCheck.overall_score}%</div>
                <Badge
                  variant={getScoreStatus(healthCheck.overall_score) === 'excellent' ? 'default' :
                    getScoreStatus(healthCheck.overall_score) === 'good' ? 'secondary' :
                    getScoreStatus(healthCheck.overall_score) === 'warning' ? 'destructive' : 'destructive'}
                  className="mt-2"
                >
                  {getScoreStatus(healthCheck.overall_score).toUpperCase()}
                </Badge>
              </div>
            </div>

            {/* Component Scores */}
            <div className="space-y-4">
              {componentScores.map((component) => (
                <div key={component.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{component.name}</span>
                    <span className="text-sm font-bold">{component.value}%</span>
                  </div>
                  <Progress
                    value={component.value}
                    className="h-2"
                    style={{
                      '--progress-background': component.color
                    } as React.CSSProperties}
                  />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Red Flags */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-red-600" />
            Red Flags & Critical Issues
          </CardTitle>
          <CardDescription>
            Issues requiring immediate attention
          </CardDescription>
        </CardHeader>
        <CardContent>
          {healthCheck.red_flags.length > 0 ? (
            <div className="space-y-4">
              {healthCheck.red_flags.map((flag, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      {getRedFlagIcon(flag.type)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium">{flag.title}</h4>
                          <Badge variant="outline" className="text-xs">
                            {flag.entity}
                          </Badge>
                          {getSeverityIcon(flag.severity)}
                        </div>
                        <p className="text-sm text-muted-foreground">{flag.description}</p>
                        {flag.due_date && (
                          <div className="flex items-center gap-1 mt-2 text-xs text-orange-600">
                            <Clock className="h-3 w-3" />
                            Due: {new Date(flag.due_date).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={flag.severity === 'Critical' ? 'destructive' :
                          flag.severity === 'High' ? 'default' : 'secondary'}
                      >
                        {flag.severity}
                      </Badge>
                      {flag.url && (
                        <Button variant="ghost" size="sm" asChild>
                          <a href={flag.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 mx-auto text-green-600 mb-4" />
              <h3 className="text-lg font-medium">No Critical Issues</h3>
              <p className="text-muted-foreground">
                No red flags identified in the current assessment period.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-6 w-6 text-blue-600" />
            Improvement Recommendations
          </CardTitle>
          <CardDescription>
            Strategic recommendations to enhance compliance posture
          </CardDescription>
        </CardHeader>
        <CardContent>
          {healthCheck.recommendations.length > 0 ? (
            <div className="space-y-4">
              {healthCheck.recommendations.map((recommendation, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium">{recommendation.title}</h4>
                        <Badge variant="outline" className="text-xs">
                          {recommendation.category}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {recommendation.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-1">
                          <Target className="h-3 w-3" />
                          <span className="font-medium">Impact:</span>
                          <span>{recommendation.impact}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          <span className="font-medium">Effort:</span>
                          <Badge className={`text-xs ${getEffortColor(recommendation.effort)}`}>
                            {recommendation.effort}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div>
                      <Badge variant={getPriorityColor(recommendation.priority)}>
                        {recommendation.priority} Priority
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <TrendingUp className="h-12 w-12 mx-auto text-green-600 mb-4" />
              <h3 className="text-lg font-medium">No Recommendations</h3>
              <p className="text-muted-foreground">
                Your compliance program is performing well. Continue current practices.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Component Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Control Design</p>
                <p className="text-2xl font-bold">{healthCheck.control_design_score}%</p>
                <p className="text-xs text-muted-foreground">
                  Design effectiveness
                </p>
              </div>
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Control Execution</p>
                <p className="text-2xl font-bold">{healthCheck.control_execution_score}%</p>
                <p className="text-xs text-muted-foreground">
                  Operational effectiveness
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Issue Management</p>
                <p className="text-2xl font-bold">{healthCheck.issue_management_score}%</p>
                <p className="text-xs text-muted-foreground">
                  Resolution efficiency
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Evidence Quality</p>
                <p className="text-2xl font-bold">{healthCheck.evidence_quality_score}%</p>
                <p className="text-xs text-muted-foreground">
                  Documentation quality
                </p>
              </div>
              <FileX className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}