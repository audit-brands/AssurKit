import { useExecutiveSummary, type DashboardFilters } from '@/hooks/use-dashboard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts'
import {
  Shield,
  CheckCircle,
  AlertTriangle,
  Clock,
  TrendingUp,
  FileText,
  Target,
  Activity
} from 'lucide-react'

interface ExecutiveOverviewProps {
  filters: DashboardFilters
}

export function ExecutiveOverview({ filters }: ExecutiveOverviewProps) {
  const { data: summary, isLoading, error } = useExecutiveSummary(filters)

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
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

  if (error || !summary) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-red-600">Failed to load executive summary. Please try again.</p>
        </CardContent>
      </Card>
    )
  }

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4']

  // Calculate derived metrics
  const testCompletionRate = summary.total_tests > 0
    ? (summary.tests_completed / summary.total_tests) * 100
    : 0

  const issueResolutionRate = summary.total_issues > 0
    ? ((summary.total_issues - summary.open_issues) / summary.total_issues) * 100
    : 0

  const keyControlCoverage = summary.key_controls > 0
    ? (summary.tests_completed / summary.key_controls) * 100
    : 0

  // Prepare chart data
  const controlTypeData = Object.entries(summary.controls_by_type).map(([type, count]) => ({
    type,
    count,
    percentage: Math.round((count / summary.total_controls) * 100)
  }))

  const testStatusData = Object.entries(summary.tests_by_status).map(([status, count]) => ({
    status,
    count,
    percentage: Math.round((count / summary.total_tests) * 100)
  }))

  const monthlyTestData = summary.monthly_test_trends.map((item: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
    month: formatMonth(item.month),
    planned: item.tests_planned,
    completed: item.tests_completed,
    passRate: item.pass_rate
  }))

  const complianceScoreData = summary.quarterly_compliance_score.map((item: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
    quarter: item.quarter,
    compliance: item.compliance_score,
    completion: item.test_completion_rate,
    resolution: item.issue_resolution_rate
  }))

  function formatMonth(monthString: string) {
    const date = new Date(monthString + '-01')
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  }

  function getStatusIcon(type: 'success' | 'warning' | 'danger' | 'info') {
    switch (type) {
      case 'success': return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'warning': return <AlertTriangle className="h-5 w-5 text-orange-600" />
      case 'danger': return <AlertTriangle className="h-5 w-5 text-red-600" />
      case 'info': return <Activity className="h-5 w-5 text-blue-600" />
    }
  }

  function getMetricStatus(value: number, thresholds: { good: number; warning: number }) {
    if (value >= thresholds.good) return 'success'
    if (value >= thresholds.warning) return 'warning'
    return 'danger'
  }

  return (
    <div className="space-y-6">
      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Controls</p>
                <p className="text-2xl font-bold">{summary.total_controls.toLocaleString()}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">
                    {summary.key_controls} Key
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {summary.automated_controls} Auto
                  </Badge>
                </div>
              </div>
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Test Completion</p>
                <p className="text-2xl font-bold">{testCompletionRate.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">
                  {summary.tests_completed} of {summary.total_tests} tests
                </p>
              </div>
              <div className="flex items-center">
                {getStatusIcon(getMetricStatus(testCompletionRate, { good: 90, warning: 75 }))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Test Pass Rate</p>
                <p className="text-2xl font-bold">{summary.test_pass_rate.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">
                  Quality of executed tests
                </p>
              </div>
              <div className="flex items-center">
                {getStatusIcon(getMetricStatus(summary.test_pass_rate, { good: 95, warning: 85 }))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Open Issues</p>
                <p className="text-2xl font-bold text-red-600">{summary.open_issues}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="destructive" className="text-xs">
                    {summary.critical_issues} Critical
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {summary.overdue_issues} Overdue
                  </Badge>
                </div>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Key Control Coverage</p>
                <p className="text-2xl font-bold">{keyControlCoverage.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">
                  Testing of key controls
                </p>
              </div>
              <Target className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Resolution Time</p>
                <p className="text-2xl font-bold">{summary.avg_resolution_time_days.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">days</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Evidence Files</p>
                <p className="text-2xl font-bold">{summary.total_evidence_files.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">
                  {summary.total_evidence_size_gb.toFixed(2)} GB total
                </p>
              </div>
              <FileText className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Issue Resolution</p>
                <p className="text-2xl font-bold">{issueResolutionRate.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">
                  Closed vs total issues
                </p>
              </div>
              <div className="flex items-center">
                {getStatusIcon(getMetricStatus(issueResolutionRate, { good: 80, warning: 60 }))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Control Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Control Distribution</CardTitle>
            <CardDescription>
              Breakdown of controls by type and automation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={controlTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ type, percentage }) => `${type} ${percentage}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {controlTypeData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [value, 'Controls']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Test Execution Status */}
        <Card>
          <CardHeader>
            <CardTitle>Test Execution Status</CardTitle>
            <CardDescription>
              Current state of test execution activities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={testStatusData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="status" />
                  <YAxis />
                  <Tooltip />
                  <Bar
                    dataKey="count"
                    fill="#3B82F6"
                    radius={[4, 4, 0, 0]}
                  >
                    {testStatusData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trend Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Test Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Monthly Test Execution
            </CardTitle>
            <CardDescription>
              Test planning vs completion trends
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyTestData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip
                    formatter={(value, name) => [
                      value,
                      name === 'planned' ? 'Planned' : 'Completed'
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="planned"
                    stackId="1"
                    stroke="#3B82F6"
                    fill="#3B82F6"
                    fillOpacity={0.6}
                  />
                  <Area
                    type="monotone"
                    dataKey="completed"
                    stackId="1"
                    stroke="#10B981"
                    fill="#10B981"
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Quarterly Compliance Score */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Quarterly Compliance Trends
            </CardTitle>
            <CardDescription>
              Overall compliance performance over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={complianceScoreData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="quarter" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip
                    formatter={(value, name) => [
                      `${value}%`,
                      name === 'compliance' ? 'Compliance Score'
                        : name === 'completion' ? 'Test Completion'
                        : 'Issue Resolution'
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey="compliance"
                    stroke="#3B82F6"
                    strokeWidth={3}
                    dot={{ fill: '#3B82F6', strokeWidth: 2, r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="completion"
                    stroke="#10B981"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                  />
                  <Line
                    type="monotone"
                    dataKey="resolution"
                    stroke="#F59E0B"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Risk Areas and Top Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Risk Areas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Top Risk Areas
            </CardTitle>
            <CardDescription>
              Areas requiring immediate attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {summary.top_risk_areas.slice(0, 5).map((area: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                <div key={`${area.process_name}-${area.subprocess_name}`} className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{area.process_name}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {area.subprocess_name}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={area.risk_score > 80 ? "destructive" : area.risk_score > 60 ? "default" : "secondary"}
                    >
                      Risk: {area.risk_score}
                    </Badge>
                    <div className="text-sm text-right">
                      <div className="text-red-600">{area.open_issues} issues</div>
                      <div className="text-orange-600">{area.overdue_tests} overdue</div>
                    </div>
                  </div>
                </div>
              ))}
              {summary.top_risk_areas.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  No high-risk areas identified
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Control Effectiveness */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Control Effectiveness
            </CardTitle>
            <CardDescription>
              Controls with lowest effectiveness scores
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {summary.control_effectiveness
                .sort((a: any, b: any) => a.effectiveness_score - b.effectiveness_score) // eslint-disable-line @typescript-eslint/no-explicit-any
                .slice(0, 5)
                .map((control: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                <div key={control.control_id} className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{control.control_name}</p>
                    <p className="text-sm text-muted-foreground font-mono">
                      #{control.control_id.slice(0, 8)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={control.effectiveness_score > 80 ? "default" : control.effectiveness_score > 60 ? "secondary" : "destructive"}
                    >
                      {control.effectiveness_score}%
                    </Badge>
                    <div className="text-sm text-right">
                      <div>{control.pass_rate.toFixed(1)}% pass</div>
                      <div className="text-muted-foreground">{control.test_count} tests</div>
                    </div>
                  </div>
                </div>
              ))}
              {summary.control_effectiveness.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  No control effectiveness data available
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}