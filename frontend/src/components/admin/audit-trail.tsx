import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { format } from 'date-fns'
import {
  Search,
  Download,
  RefreshCw,
  Calendar as CalendarIcon,
  Eye,
  Shield,
  AlertTriangle,
  Activity,
  Database,
  Users,
  FileText,
  Settings,
  Clock
} from 'lucide-react'

interface AuditEntry {
  id: string
  timestamp: string
  actor_user_id: string
  actor_name: string
  actor_email: string
  action: string
  entity_type: string
  entity_id: string
  entity_name?: string
  ip_address: string
  user_agent: string
  before_data?: Record<string, unknown>
  after_data?: Record<string, unknown>
  metadata?: Record<string, unknown>
  severity: 'info' | 'warning' | 'error' | 'critical'
  category: 'authentication' | 'authorization' | 'data_modification' | 'system_config' | 'user_action'
}

interface SecurityEvent {
  id: string
  timestamp: string
  event_type: 'failed_login' | 'suspicious_activity' | 'privilege_escalation' | 'data_access' | 'policy_violation'
  user_id?: string
  username?: string
  ip_address: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'open' | 'investigating' | 'resolved' | 'false_positive'
  metadata: Record<string, unknown>
}

interface SystemMetric {
  id: string
  timestamp: string
  metric_name: string
  metric_value: number
  metric_unit: string
  category: 'performance' | 'security' | 'usage' | 'error'
  threshold_status: 'normal' | 'warning' | 'critical'
}

const actionIcons = {
  'user.create': Users,
  'user.update': Users,
  'user.delete': Users,
  'role.create': Shield,
  'role.update': Shield,
  'policy.create': FileText,
  'policy.update': FileText,
  'system.config': Settings,
  'login.success': Activity,
  'login.failed': AlertTriangle,
  'data.access': Database,
  'data.modify': Database,
  default: Activity
}

const severityColors = {
  info: 'bg-blue-100 text-blue-800',
  warning: 'bg-yellow-100 text-yellow-800',
  error: 'bg-red-100 text-red-800',
  critical: 'bg-red-100 text-red-800'
}

const eventTypeColors = {
  failed_login: 'bg-red-100 text-red-800',
  suspicious_activity: 'bg-orange-100 text-orange-800',
  privilege_escalation: 'bg-red-100 text-red-800',
  data_access: 'bg-blue-100 text-blue-800',
  policy_violation: 'bg-yellow-100 text-yellow-800'
}

export function AuditTrail() {
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedAction, setSelectedAction] = useState<string>('all')
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all')
  const [activeTab, setActiveTab] = useState('audit')

  const { data: auditEntries = [], isLoading: auditLoading, refetch: refetchAudit } = useQuery({
    queryKey: ['admin-audit-trail', { searchTerm, selectedAction, selectedSeverity, selectedDate }],
    queryFn: async (): Promise<AuditEntry[]> => {
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (selectedAction !== 'all') params.append('action', selectedAction)
      if (selectedSeverity !== 'all') params.append('severity', selectedSeverity)
      if (selectedDate) params.append('date', selectedDate.toISOString().split('T')[0])

      const response = await fetch(`/api/admin/audit-trail?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch audit trail')
      }
      return response.json()
    },
    staleTime: 1 * 60 * 1000 // 1 minute
  })

  const { data: securityEvents = [], isLoading: securityLoading } = useQuery({
    queryKey: ['admin-security-events'],
    queryFn: async (): Promise<SecurityEvent[]> => {
      const response = await fetch('/api/admin/security-events')
      if (!response.ok) {
        throw new Error('Failed to fetch security events')
      }
      return response.json()
    },
    staleTime: 30 * 1000 // 30 seconds
  })

  const { data: systemMetrics = [], isLoading: metricsLoading } = useQuery({
    queryKey: ['admin-system-metrics'],
    queryFn: async (): Promise<SystemMetric[]> => {
      const response = await fetch('/api/admin/system-metrics')
      if (!response.ok) {
        throw new Error('Failed to fetch system metrics')
      }
      return response.json()
    },
    staleTime: 1 * 60 * 1000
  })

  const exportAuditTrail = async () => {
    const params = new URLSearchParams()
    if (searchTerm) params.append('search', searchTerm)
    if (selectedAction !== 'all') params.append('action', selectedAction)
    if (selectedSeverity !== 'all') params.append('severity', selectedSeverity)
    if (selectedDate) params.append('date', selectedDate.toISOString().split('T')[0])

    const response = await fetch(`/api/admin/audit-trail/export?${params}`)
    if (response.ok) {
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `audit-trail-${format(new Date(), 'yyyy-MM-dd')}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
    }
  }

  const getActionIcon = (action: string) => {
    const Icon = actionIcons[action as keyof typeof actionIcons] || actionIcons.default
    return <Icon className="h-4 w-4" />
  }

  const formatChanges = (before: Record<string, unknown> | undefined, after: Record<string, unknown> | undefined) => {
    if (!before || !after) return null

    const changes = []
    for (const key in after) {
      if (before[key] !== after[key]) {
        changes.push({
          field: key,
          from: before[key],
          to: after[key]
        })
      }
    }

    return changes
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Audit & Monitoring</h1>
          <p className="text-muted-foreground">System activity, security events, and performance monitoring</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportAuditTrail}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" onClick={() => refetchAudit()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="audit">
            <Eye className="h-4 w-4 mr-2" />
            Audit Trail
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="h-4 w-4 mr-2" />
            Security Events
          </TabsTrigger>
          <TabsTrigger value="metrics">
            <Activity className="h-4 w-4 mr-2" />
            System Metrics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="audit" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filter Audit Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="search">Search</Label>
                  <div className="relative mt-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="search"
                      placeholder="Search by user, action, or entity..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="action">Action Type</Label>
                  <Select value={selectedAction} onValueChange={setSelectedAction}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="All actions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Actions</SelectItem>
                      <SelectItem value="user.create">User Create</SelectItem>
                      <SelectItem value="user.update">User Update</SelectItem>
                      <SelectItem value="role.create">Role Create</SelectItem>
                      <SelectItem value="policy.update">Policy Update</SelectItem>
                      <SelectItem value="system.config">System Config</SelectItem>
                      <SelectItem value="login.success">Login Success</SelectItem>
                      <SelectItem value="login.failed">Login Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="severity">Severity</Label>
                  <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="All severities" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Severities</SelectItem>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Date Filter</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full mt-1 justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? format(selectedDate, 'PPP') : 'Select date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Audit Trail Table */}
          <Card>
            <CardHeader>
              <CardTitle>Audit Trail</CardTitle>
              <CardDescription>
                Detailed log of all system activities and user actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {auditLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Actor</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Entity</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Changes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditEntries.map((entry) => {
                      const changes = formatChanges(entry.before_data, entry.after_data)
                      return (
                        <TableRow key={entry.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs">
                                {format(new Date(entry.timestamp), 'MMM dd, yyyy HH:mm:ss')}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium text-sm">{entry.actor_name}</div>
                              <div className="text-xs text-muted-foreground">{entry.actor_email}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getActionIcon(entry.action)}
                              <span className="text-sm">{entry.action}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="text-sm font-medium">{entry.entity_type}</div>
                              {entry.entity_name && (
                                <div className="text-xs text-muted-foreground">{entry.entity_name}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={severityColors[entry.severity]}
                              variant="secondary"
                            >
                              {entry.severity}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs font-mono">{entry.ip_address}</span>
                          </TableCell>
                          <TableCell>
                            {changes && changes.length > 0 ? (
                              <div className="text-xs">
                                {changes.slice(0, 2).map((change, index) => (
                                  <div key={index} className="text-muted-foreground">
                                    <span className="font-medium">{change.field}:</span> {String(change.from)} → {String(change.to)}
                                  </div>
                                ))}
                                {changes.length > 2 && (
                                  <div className="text-muted-foreground">
                                    +{changes.length - 2} more
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">No changes tracked</span>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Events</CardTitle>
              <CardDescription>
                Security incidents, failed logins, and suspicious activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              {securityLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Event Type</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>IP Address</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {securityEvents.map((event) => (
                      <TableRow key={event.id}>
                        <TableCell>
                          <span className="text-xs">
                            {format(new Date(event.timestamp), 'MMM dd, yyyy HH:mm:ss')}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={eventTypeColors[event.event_type]}
                            variant="secondary"
                          >
                            {event.event_type.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{event.username || 'Unknown'}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{event.description}</span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={event.severity === 'critical' || event.severity === 'high' ? 'destructive' : 'outline'}
                          >
                            {event.severity}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={event.status === 'resolved' ? 'default' : 'secondary'}
                          >
                            {event.status.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs font-mono">{event.ip_address}</span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Metrics</CardTitle>
              <CardDescription>
                Performance indicators and system health metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              {metricsLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Metric</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {systemMetrics.map((metric) => (
                      <TableRow key={metric.id}>
                        <TableCell>
                          <span className="text-xs">
                            {format(new Date(metric.timestamp), 'MMM dd, yyyy HH:mm:ss')}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm font-medium">{metric.metric_name}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {metric.metric_value} {metric.metric_unit}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {metric.category}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              metric.threshold_status === 'critical'
                                ? 'destructive'
                                : metric.threshold_status === 'warning'
                                ? 'secondary'
                                : 'default'
                            }
                          >
                            {metric.threshold_status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}