import { useIssueStatistics } from '@/hooks/use-issues'
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
  Line,
  Area,
  AreaChart
} from 'recharts'
import {
  AlertTriangle,
  TrendingUp,
  Clock,
  CheckCircle,
  Target,
  Users,
  BarChart3
} from 'lucide-react'

export function IssueStatistics() {
  const { data: stats, isLoading, error } = useIssueStatistics()

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

  if (error || !stats) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-red-600">Failed to load issue statistics. Please try again.</p>
        </CardContent>
      </Card>
    )
  }

  // Prepare data for charts
  const statusData = Object.entries(stats.by_status).map(([status, count]) => ({
    status,
    count,
    percentage: Math.round((count / stats.total_issues) * 100)
  }))

  const severityData = Object.entries(stats.by_severity).map(([severity, count]) => ({
    severity,
    count,
    percentage: Math.round((count / stats.total_issues) * 100)
  }))

  const typeData = Object.entries(stats.by_type).map(([type, count]) => ({
    type,
    count,
    percentage: Math.round((count / stats.total_issues) * 100)
  }))

  const monthlyData = stats.issues_by_month.map(item => ({
    month: formatMonth(item.month),
    opened: item.count,
    resolved: item.resolved,
    net: item.count - item.resolved
  }))


  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4']

  function formatMonth(monthString: string) {
    const date = new Date(monthString + '-01')
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  }


  function getStatusColor(status: string) {
    switch (status) {
      case 'Open': return '#EF4444'
      case 'In Remediation': return '#F59E0B'
      case 'Ready for Retest': return '#3B82F6'
      case 'Closed': return '#10B981'
      default: return '#6B7280'
    }
  }

  function getSeverityColor(severity: string) {
    switch (severity) {
      case 'Critical': return '#EF4444'
      case 'High': return '#F59E0B'
      case 'Medium': return '#3B82F6'
      case 'Low': return '#10B981'
      default: return '#6B7280'
    }
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Issues</p>
                <p className="text-2xl font-bold">{stats.total_issues.toLocaleString()}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overdue Issues</p>
                <p className="text-2xl font-bold text-red-600">{stats.overdue_count}</p>
                <p className="text-xs text-muted-foreground">
                  {stats.total_issues > 0 ? ((stats.overdue_count / stats.total_issues) * 100).toFixed(1) : 0}% of total
                </p>
              </div>
              <Clock className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Resolution Time</p>
                <p className="text-2xl font-bold">{stats.avg_resolution_time_days.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">days</p>
              </div>
              <Target className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Closed Issues</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.by_status['Closed'] || 0}
                </p>
                <p className="text-xs text-muted-foreground">
                  {stats.total_issues > 0 ? (((stats.by_status['Closed'] || 0) / stats.total_issues) * 100).toFixed(1) : 0}% of total
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Issues by Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Issues by Status
            </CardTitle>
            <CardDescription>
              Current distribution of issues by status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ status, percentage }) => `${status} ${percentage}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getStatusColor(entry.status)} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [value, 'Issues']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Issues by Severity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Issues by Severity
            </CardTitle>
            <CardDescription>
              Distribution of issues by severity level
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={severityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="severity" />
                  <YAxis />
                  <Tooltip />
                  <Bar
                    dataKey="count"
                    fill="#3B82F6"
                    radius={[4, 4, 0, 0]}
                  >
                    {severityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getSeverityColor(entry.severity)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Monthly Issue Trends
          </CardTitle>
          <CardDescription>
            Issues opened and resolved by month
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  formatter={(value, name) => [
                    value,
                    name === 'opened' ? 'Opened' : name === 'resolved' ? 'Resolved' : 'Net Change'
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="opened"
                  stackId="1"
                  stroke="#EF4444"
                  fill="#EF4444"
                  fillOpacity={0.6}
                />
                <Area
                  type="monotone"
                  dataKey="resolved"
                  stackId="1"
                  stroke="#10B981"
                  fill="#10B981"
                  fillOpacity={0.6}
                />
                <Line
                  type="monotone"
                  dataKey="net"
                  stroke="#3B82F6"
                  strokeWidth={3}
                  dot={{ fill: '#3B82F6', strokeWidth: 2, r: 6 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Issue Types and Top Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Issue Types */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Issues by Type
            </CardTitle>
            <CardDescription>
              Distribution by issue classification
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {typeData.map((item, index) => (
                <div key={item.type} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="font-medium">{item.type}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{item.count}</Badge>
                    <span className="text-sm text-muted-foreground">{item.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Controls with Issues */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Top Controls with Issues
            </CardTitle>
            <CardDescription>
              Controls with the most reported issues
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.top_controls_with_issues.slice(0, 5).map((control) => (
                <div key={control.control_id} className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{control.control_name}</p>
                    <p className="text-sm text-muted-foreground font-mono">
                      #{control.control_id.slice(0, 8)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={control.issue_count > 5 ? "destructive" : control.issue_count > 2 ? "default" : "secondary"}
                    >
                      {control.issue_count} issues
                    </Badge>
                  </div>
                </div>
              ))}
              {stats.top_controls_with_issues.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  No issues reported yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statusData.map((status) => (
          <Card key={status.status}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{status.status}</p>
                  <p className="text-2xl font-bold">{status.count}</p>
                  <p className="text-xs text-muted-foreground">
                    {status.percentage}% of total
                  </p>
                </div>
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: getStatusColor(status.status) + '20' }}
                >
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: getStatusColor(status.status) }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}