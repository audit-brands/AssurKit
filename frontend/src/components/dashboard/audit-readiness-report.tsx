import { useAuditReadinessReport, type DashboardFilters } from '@/hooks/use-dashboard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar
} from 'recharts'
import {
  ClipboardCheck,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  TrendingUp,
  User,
  FileText
} from 'lucide-react'

interface AuditReadinessReportProps {
  filters: DashboardFilters
}

export function AuditReadinessReport({ filters }: AuditReadinessReportProps) {
  const { data: readiness, isLoading, error } = useAuditReadinessReport(filters)

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

  if (error || !readiness) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-red-600">Failed to load audit readiness report. Please try again.</p>
        </CardContent>
      </Card>
    )
  }

  // Prepare data for charts
  const readinessData = [
    {
      name: 'Overall Readiness',
      value: readiness.readiness_score,
      fill: getReadinessColor(readiness.readiness_score)
    }
  ]

  const workstreamData = readiness.workstream_progress.map((item: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
    workstream: item.workstream,
    completion: item.completion_percentage,
    remaining: item.remaining_tasks,
    atRisk: item.at_risk
  }))

  function getReadinessColor(score: number): string {
    if (score >= 95) return '#10B981' // Green
    if (score >= 85) return '#3B82F6' // Blue
    if (score >= 70) return '#F59E0B' // Orange
    return '#EF4444' // Red
  }

  function getReadinessStatus(score: number): string {
    if (score >= 95) return 'Audit Ready'
    if (score >= 85) return 'Nearly Ready'
    if (score >= 70) return 'Preparation Needed'
    return 'Significant Work Required'
  }

  function getPriorityIcon(priority: string) {
    switch (priority) {
      case 'Critical': return <AlertTriangle className="h-4 w-4 text-red-600" />
      case 'High': return <AlertTriangle className="h-4 w-4 text-orange-600" />
      default: return <Clock className="h-4 w-4 text-blue-600" />
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'Completed': return 'default'
      case 'In Progress': return 'secondary'
      case 'Open': return 'destructive'
      default: return 'outline'
    }
  }

  function getCategoryIcon(category: string) {
    switch (category) {
      case 'Control': return <Target className="h-4 w-4" />
      case 'Testing': return <ClipboardCheck className="h-4 w-4" />
      case 'Evidence': return <FileText className="h-4 w-4" />
      case 'Issue': return <AlertTriangle className="h-4 w-4" />
      default: return <CheckCircle className="h-4 w-4" />
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const daysUntilReady = readiness.estimated_days_to_ready
  const readyByDate = new Date()
  readyByDate.setDate(readyByDate.getDate() + daysUntilReady)

  return (
    <div className="space-y-6">
      {/* Readiness Score Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-6 w-6" />
            Audit Readiness Assessment
          </CardTitle>
          <CardDescription>
            Overall preparedness for external audit based on {formatDate(readiness.last_assessment_date)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Readiness Score */}
            <div className="flex flex-col items-center">
              <div className="h-32 w-32">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart
                    cx="50%"
                    cy="50%"
                    innerRadius="60%"
                    outerRadius="90%"
                    data={readinessData}
                    startAngle={90}
                    endAngle={-270}
                  >
                    <RadialBar
                      dataKey="value"
                      cornerRadius={10}
                      fill={readinessData[0].fill}
                    />
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{readiness.readiness_score}%</div>
                <div className="text-sm text-muted-foreground">
                  {getReadinessStatus(readiness.readiness_score)}
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium">Estimated Timeline</p>
                  <p className="text-sm text-muted-foreground">
                    {daysUntilReady} days until audit ready
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium">Target Date</p>
                  <p className="text-sm text-muted-foreground">
                    {readyByDate.toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="font-medium">Last Assessment</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(readiness.last_assessment_date)}
                  </p>
                </div>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">Control Documentation</span>
                  <span className="text-sm font-bold">{readiness.control_documentation_score}%</span>
                </div>
                <Progress value={readiness.control_documentation_score} className="h-2" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">Test Execution</span>
                  <span className="text-sm font-bold">{readiness.test_execution_completeness}%</span>
                </div>
                <Progress value={readiness.test_execution_completeness} className="h-2" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">Evidence Collection</span>
                  <span className="text-sm font-bold">{readiness.evidence_collection_score}%</span>
                </div>
                <Progress value={readiness.evidence_collection_score} className="h-2" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">Issue Resolution</span>
                  <span className="text-sm font-bold">{readiness.issue_resolution_score}%</span>
                </div>
                <Progress value={readiness.issue_resolution_score} className="h-2" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Coverage Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Testing Coverage</CardTitle>
            <CardDescription>
              Control testing completion status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Tested Controls</span>
                <span className="text-lg font-bold">
                  {readiness.testing_coverage.tested_controls} / {readiness.testing_coverage.total_controls}
                </span>
              </div>
              <Progress value={readiness.testing_coverage.coverage_percentage} className="h-3" />
              <div className="text-center">
                <span className="text-2xl font-bold">{readiness.testing_coverage.coverage_percentage}%</span>
                <p className="text-sm text-muted-foreground">Coverage</p>
              </div>
              {readiness.testing_coverage.untested_key_controls > 0 && (
                <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="text-sm text-red-800">
                    {readiness.testing_coverage.untested_key_controls} key controls not tested
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Evidence Coverage</CardTitle>
            <CardDescription>
              Evidence collection completeness
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Tests with Evidence</span>
                <span className="text-lg font-bold">
                  {readiness.evidence_coverage.tests_with_evidence} / {readiness.evidence_coverage.total_tests}
                </span>
              </div>
              <Progress value={readiness.evidence_coverage.coverage_percentage} className="h-3" />
              <div className="text-center">
                <span className="text-2xl font-bold">{readiness.evidence_coverage.coverage_percentage}%</span>
                <p className="text-sm text-muted-foreground">Coverage</p>
              </div>
              {readiness.evidence_coverage.missing_evidence_count > 0 && (
                <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg">
                  <FileText className="h-4 w-4 text-orange-600" />
                  <span className="text-sm text-orange-800">
                    {readiness.evidence_coverage.missing_evidence_count} tests missing evidence
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Workstream Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6" />
            Workstream Progress
          </CardTitle>
          <CardDescription>
            Progress across key audit preparation workstreams
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={workstreamData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="workstream"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis domain={[0, 100]} />
                <Tooltip
                  formatter={(value) => [
                    `${value}%`,
                    'Completion'
                  ]}
                  labelFormatter={(label) => `Workstream: ${label}`}
                />
                <Bar
                  dataKey="completion"
                  fill="#3B82F6"
                  radius={[4, 4, 0, 0]}
                >
                  {workstreamData.map((entry, index) => (
                    <Bar
                      key={`cell-${index}`}
                      fill={entry.atRisk ? '#EF4444' : '#3B82F6'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            {workstreamData.map((workstream) => (
              <div key={workstream.workstream} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{workstream.workstream}</span>
                  {workstream.atRisk && (
                    <Badge variant="destructive" className="text-xs">At Risk</Badge>
                  )}
                </div>
                <div className="text-lg font-bold">{workstream.completion}%</div>
                <div className="text-xs text-muted-foreground">
                  {workstream.remaining} tasks remaining
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Critical Action Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-red-600" />
            Critical Action Items
          </CardTitle>
          <CardDescription>
            High-priority items that must be addressed before audit
          </CardDescription>
        </CardHeader>
        <CardContent>
          {readiness.critical_action_items.length > 0 ? (
            <div className="space-y-4">
              {readiness.critical_action_items.map((item) => (
                <div key={item.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      {getCategoryIcon(item.category)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium">{item.title}</h4>
                          <Badge variant="outline" className="text-xs">
                            {item.category}
                          </Badge>
                          {getPriorityIcon(item.priority)}
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {item.description}
                        </p>
                        <div className="flex items-center gap-4 text-xs">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span>{item.assignee}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>Due: {formatDate(item.due_date)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={item.priority === 'Critical' ? 'destructive' : 'default'}
                      >
                        {item.priority}
                      </Badge>
                      <Badge variant={getStatusColor(item.status)}>
                        {item.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 mx-auto text-green-600 mb-4" />
              <h3 className="text-lg font-medium">No Critical Action Items</h3>
              <p className="text-muted-foreground">
                All critical preparation items have been completed.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}