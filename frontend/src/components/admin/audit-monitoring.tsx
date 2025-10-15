import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import {
  Activity,
  Shield,
  AlertTriangle,
  CheckCircle,
  Eye,
  Search,
  Download,
  RefreshCw,
  Server,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react'
import { format } from 'date-fns'

interface AuditEntry {
  id: string
  timestamp: string
  user_id: string
  user_email: string
  user_name: string
  action: string
  resource_type: string
  resource_id: string
  resource_name?: string
  ip_address: string
  user_agent: string
  details: Record<string, unknown>
  status: 'success' | 'failure' | 'warning'
  session_id: string
}

interface SystemMetric {
  id: string
  name: string
  value: number
  unit: string
  status: 'healthy' | 'warning' | 'critical'
  threshold_warning: number
  threshold_critical: number
  last_updated: string
  trend: 'up' | 'down' | 'stable'
  trend_percentage: number
}

interface SecurityEvent {
  id: string
  timestamp: string
  event_type: 'failed_login' | 'suspicious_activity' | 'privilege_escalation' | 'data_access' | 'configuration_change'
  severity: 'low' | 'medium' | 'high' | 'critical'
  source_ip: string
  user_id?: string
  user_email?: string
  description: string
  details: Record<string, unknown>
  status: 'open' | 'investigating' | 'resolved' | 'false_positive'
  resolved_by?: string
  resolved_at?: string
}

interface PerformanceData {
  timestamp: string
  cpu_usage: number
  memory_usage: number
  disk_usage: number
  network_io: number
  database_connections: number
  response_time: number
  active_users: number
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

export function AuditMonitoring() {
  const [auditSearchTerm, setAuditSearchTerm] = useState('')
  const [auditDateRange, setAuditDateRange] = useState('7d')
  const [auditAction, setAuditAction] = useState('all')
  const [securityDateRange, setSecurityDateRange] = useState('24h')
  const [securitySeverity, setSecuritySeverity] = useState('all')
  const [performancePeriod, setPerformancePeriod] = useState('24h')

  const { data: auditEntries = [], isLoading: auditLoading } = useQuery({
    queryKey: ['audit-entries', auditDateRange, auditAction, auditSearchTerm],
    queryFn: async (): Promise<AuditEntry[]> => {
      const params = new URLSearchParams({
        range: auditDateRange,
        ...(auditAction !== 'all' && { action: auditAction }),
        ...(auditSearchTerm && { search: auditSearchTerm })
      })
      const response = await fetch(`/api/admin/audit?${params}`)
      if (!response.ok) throw new Error('Failed to fetch audit entries')
      return response.json()
    },
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000
  })

  const { data: systemMetrics = [], isLoading: metricsLoading } = useQuery({
    queryKey: ['system-metrics'],
    queryFn: async (): Promise<SystemMetric[]> => {
      const response = await fetch('/api/admin/metrics')
      if (!response.ok) throw new Error('Failed to fetch system metrics')
      return response.json()
    },
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000
  })

  const { data: securityEvents = [], isLoading: securityLoading } = useQuery({
    queryKey: ['security-events', securityDateRange, securitySeverity],
    queryFn: async (): Promise<SecurityEvent[]> => {
      const params = new URLSearchParams({
        range: securityDateRange,
        ...(securitySeverity !== 'all' && { severity: securitySeverity })
      })
      const response = await fetch(`/api/admin/security-events?${params}`)
      if (!response.ok) throw new Error('Failed to fetch security events')
      return response.json()
    },
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000
  })

  const { data: performanceData = [] } = useQuery({
    queryKey: ['performance-data', performancePeriod],
    queryFn: async (): Promise<PerformanceData[]> => {
      const response = await fetch(`/api/admin/performance?range=${performancePeriod}`)
      if (!response.ok) throw new Error('Failed to fetch performance data')
      return response.json()
    },
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000
  })

  const filteredAuditEntries = auditEntries.filter(entry => {
    if (auditSearchTerm) {
      const searchLower = auditSearchTerm.toLowerCase()
      return (
        entry.user_email.toLowerCase().includes(searchLower) ||
        entry.action.toLowerCase().includes(searchLower) ||
        entry.resource_type.toLowerCase().includes(searchLower) ||
        entry.resource_name?.toLowerCase().includes(searchLower)
      )
    }
    return true
  })

  const auditActionCounts = auditEntries.reduce((acc, entry) => {
    acc[entry.action] = (acc[entry.action] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const auditChartData = Object.entries(auditActionCounts).map(([action, count]) => ({
    action,
    count
  }))

  const securityEventsBySeverity = securityEvents.reduce((acc, event) => {
    acc[event.severity] = (acc[event.severity] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const securityChartData = Object.entries(securityEventsBySeverity).map(([severity, count]) => ({
    severity,
    count
  }))

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'success':
      case 'resolved':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'warning':
      case 'investigating':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'critical':
      case 'failure':
      case 'open':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getTrendIcon = (trend: string, percentage: number) => {
    if (trend === 'up') {
      return <TrendingUp className={`h-4 w-4 ${percentage > 10 ? 'text-red-500' : 'text-green-500'}`} />
    } else if (trend === 'down') {
      return <TrendingDown className={`h-4 w-4 ${percentage > 10 ? 'text-green-500' : 'text-red-500'}`} />
    }
    return <Minus className="h-4 w-4 text-muted-foreground" />
  }

  const exportAuditData = () => {
    const csvContent = [
      ['Timestamp', 'User', 'Action', 'Resource Type', 'Resource ID', 'Status', 'IP Address'].join(','),
      ...filteredAuditEntries.map(entry => [
        entry.timestamp,
        entry.user_email,
        entry.action,
        entry.resource_type,
        entry.resource_id,
        entry.status,
        entry.ip_address
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `audit-log-${format(new Date(), 'yyyy-MM-dd')}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  if (auditLoading || metricsLoading || securityLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit & Monitoring</h1>
          <p className="text-muted-foreground">
            Monitor system activity, security events, and performance metrics
          </p>
        </div>
      </div>

      <Tabs defaultValue="audit" className="space-y-4">
        <TabsList>
          <TabsTrigger value="audit">Audit Trail</TabsTrigger>
          <TabsTrigger value="security">Security Events</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="system">System Health</TabsTrigger>
        </TabsList>

        <TabsContent value="audit" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Eye className="h-5 w-5" />
              <h2 className="text-xl font-semibold">Audit Trail</h2>
            </div>
            <Button onClick={exportAuditData}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Events</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{auditEntries.length}</div>
                <p className="text-xs text-muted-foreground">Last {auditDateRange}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Unique Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Set(auditEntries.map(e => e.user_id)).size}
                </div>
                <p className="text-xs text-muted-foreground">Active users</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Failed Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-500">
                  {auditEntries.filter(e => e.status === 'failure').length}
                </div>
                <p className="text-xs text-muted-foreground">Errors detected</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Most Active Resource</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm font-bold">
                  {Object.entries(auditEntries.reduce((acc, e) => {
                    acc[e.resource_type] = (acc[e.resource_type] || 0) + 1
                    return acc
                  }, {} as Record<string, number>)).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground">Resource type</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Activity by Action Type</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={auditChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="action" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Activity Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="active_users" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Audit Filters</CardTitle>
              <div className="flex space-x-4">
                <div className="flex items-center space-x-2">
                  <Search className="h-4 w-4" />
                  <Input
                    placeholder="Search events..."
                    value={auditSearchTerm}
                    onChange={(e) => setAuditSearchTerm(e.target.value)}
                    className="max-w-sm"
                  />
                </div>
                <Select value={auditDateRange} onValueChange={setAuditDateRange}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1h">Last Hour</SelectItem>
                    <SelectItem value="24h">Last 24h</SelectItem>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={auditAction} onValueChange={setAuditAction}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    <SelectItem value="create">Create</SelectItem>
                    <SelectItem value="read">Read</SelectItem>
                    <SelectItem value="update">Update</SelectItem>
                    <SelectItem value="delete">Delete</SelectItem>
                    <SelectItem value="login">Login</SelectItem>
                    <SelectItem value="logout">Logout</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Resource</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>IP Address</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAuditEntries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="font-mono text-xs">
                          {format(new Date(entry.timestamp), 'MMM dd, HH:mm:ss')}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{entry.user_name}</div>
                            <div className="text-sm text-muted-foreground">{entry.user_email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{entry.action}</Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{entry.resource_type}</div>
                            {entry.resource_name && (
                              <div className="text-sm text-muted-foreground">{entry.resource_name}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(entry.status)}
                            <span className="capitalize">{entry.status}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{entry.ip_address}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <h2 className="text-xl font-semibold">Security Events</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Events</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{securityEvents.length}</div>
                <p className="text-xs text-muted-foreground">Last {securityDateRange}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Critical Events</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-500">
                  {securityEvents.filter(e => e.severity === 'critical').length}
                </div>
                <p className="text-xs text-muted-foreground">Immediate attention</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Open Events</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-500">
                  {securityEvents.filter(e => e.status === 'open').length}
                </div>
                <p className="text-xs text-muted-foreground">Pending review</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Resolution Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500">
                  {securityEvents.length > 0
                    ? Math.round((securityEvents.filter(e => e.status === 'resolved').length / securityEvents.length) * 100)
                    : 0}%
                </div>
                <p className="text-xs text-muted-foreground">Resolved events</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Events by Severity</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={securityChartData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                      label={({ severity, count }) => `${severity}: ${count}`}
                    >
                      {securityChartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Security Events</CardTitle>
                <div className="flex space-x-2">
                  <Select value={securityDateRange} onValueChange={setSecurityDateRange}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1h">Last Hour</SelectItem>
                      <SelectItem value="24h">Last 24h</SelectItem>
                      <SelectItem value="7d">Last 7 days</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={securitySeverity} onValueChange={setSecuritySeverity}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Severity</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-2">
                    {securityEvents.slice(0, 10).map((event) => (
                      <div key={event.id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div>
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(event.severity)}
                            <span className="font-medium">{event.event_type.replace('_', ' ')}</span>
                            <Badge variant={
                              event.severity === 'critical' ? 'destructive' :
                              event.severity === 'high' ? 'destructive' :
                              event.severity === 'medium' ? 'secondary' : 'outline'
                            }>
                              {event.severity}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(event.timestamp), 'MMM dd, HH:mm')} • {event.source_ip}
                          </p>
                        </div>
                        <Badge variant={
                          event.status === 'resolved' ? 'default' :
                          event.status === 'investigating' ? 'secondary' : 'destructive'
                        }>
                          {event.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <h2 className="text-xl font-semibold">Performance Metrics</h2>
            </div>
            <Select value={performancePeriod} onValueChange={setPerformancePeriod}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">Last Hour</SelectItem>
                <SelectItem value="24h">Last 24h</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {performanceData.length > 0
                    ? Math.round(performanceData.reduce((sum, d) => sum + d.response_time, 0) / performanceData.length)
                    : 0}ms
                </div>
                <p className="text-xs text-muted-foreground">API response time</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {performanceData[performanceData.length - 1]?.active_users || 0}
                </div>
                <p className="text-xs text-muted-foreground">Currently online</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">DB Connections</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {performanceData[performanceData.length - 1]?.database_connections || 0}
                </div>
                <p className="text-xs text-muted-foreground">Active connections</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Network I/O</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {performanceData[performanceData.length - 1]?.network_io || 0}MB/s
                </div>
                <p className="text-xs text-muted-foreground">Network throughput</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Resource Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="cpu_usage" stroke="#3b82f6" name="CPU %" />
                    <Line type="monotone" dataKey="memory_usage" stroke="#10b981" name="Memory %" />
                    <Line type="monotone" dataKey="disk_usage" stroke="#f59e0b" name="Disk %" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Response Time & Users</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="response_time"
                      stroke="#ef4444"
                      name="Response Time (ms)"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="active_users"
                      stroke="#8b5cf6"
                      name="Active Users"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <div className="flex items-center space-x-2">
            <Server className="h-5 w-5" />
            <h2 className="text-xl font-semibold">System Health</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {systemMetrics.map((metric) => (
              <Card key={metric.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">{metric.name}</CardTitle>
                    {getStatusIcon(metric.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold">
                        {metric.value}{metric.unit}
                      </span>
                      <div className="flex items-center space-x-1">
                        {getTrendIcon(metric.trend, metric.trend_percentage)}
                        <span className="text-sm text-muted-foreground">
                          {metric.trend_percentage}%
                        </span>
                      </div>
                    </div>
                    <Progress
                      value={Math.min((metric.value / metric.threshold_critical) * 100, 100)}
                      className="h-2"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Warning: {metric.threshold_warning}{metric.unit}</span>
                      <span>Critical: {metric.threshold_critical}{metric.unit}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Last updated: {format(new Date(metric.last_updated), 'MMM dd, HH:mm:ss')}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}