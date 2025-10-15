import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import {
  Users,
  Activity,
  AlertTriangle,
  CheckCircle,
  Server,
  RefreshCw
} from 'lucide-react'

interface SystemStats {
  users: {
    total: number
    active: number
    pending: number
    suspended: number
  }
  permissions: {
    roles: number
    custom_permissions: number
  }
  activity: {
    daily_logins: number
    active_sessions: number
    recent_actions: number
  }
  system: {
    uptime: string
    database_size: string
    storage_used: number
    storage_total: number
    last_backup: string
  }
  security: {
    failed_logins: number
    suspicious_activity: number
    policy_violations: number
  }
}

interface ActivityData {
  date: string
  logins: number
  actions: number
  errors: number
}

interface UserDistribution {
  role: string
  count: number
  percentage: number
  [key: string]: string | number
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

export function AdminDashboard() {
  const { data: stats, isLoading, refetch } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async (): Promise<SystemStats> => {
      const response = await fetch('/api/admin/stats')
      if (!response.ok) {
        throw new Error('Failed to fetch admin statistics')
      }
      return response.json()
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  })

  const { data: activityData = [] } = useQuery({
    queryKey: ['admin-activity-chart'],
    queryFn: async (): Promise<ActivityData[]> => {
      const response = await fetch('/api/admin/activity-chart')
      if (!response.ok) {
        throw new Error('Failed to fetch activity data')
      }
      return response.json()
    },
    staleTime: 5 * 60 * 1000,
  })

  const { data: userDistribution = [] } = useQuery({
    queryKey: ['admin-user-distribution'],
    queryFn: async (): Promise<UserDistribution[]> => {
      const response = await fetch('/api/admin/user-distribution')
      if (!response.ok) {
        throw new Error('Failed to fetch user distribution')
      }
      return response.json()
    },
    staleTime: 10 * 60 * 1000,
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
          <div className="h-8 bg-gray-200 rounded w-24 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertTriangle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground">Failed to load admin statistics</p>
          <Button onClick={() => refetch()} className="mt-2">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  const storagePercentage = (stats.system.storage_used / stats.system.storage_total) * 100

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">System overview and health metrics</p>
        </div>
        <Button onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.users.total}</div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline" className="text-green-600">
                {stats.users.active} active
              </Badge>
              <Badge variant="outline" className="text-yellow-600">
                {stats.users.pending} pending
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activity.active_sessions}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activity.daily_logins} logins today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.system.uptime}</div>
            <p className="text-xs text-muted-foreground">
              Last backup: {stats.system.last_backup}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Status</CardTitle>
            {stats.security.failed_logins > 10 ? (
              <AlertTriangle className="h-4 w-4 text-red-500" />
            ) : (
              <CheckCircle className="h-4 w-4 text-green-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.security.failed_logins > 10 ? 'Alert' : 'Normal'}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.security.failed_logins} failed logins
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Details */}
      <Tabs defaultValue="activity" className="space-y-6">
        <TabsList>
          <TabsTrigger value="activity">System Activity</TabsTrigger>
          <TabsTrigger value="users">User Analytics</TabsTrigger>
          <TabsTrigger value="system">System Health</TabsTrigger>
        </TabsList>

        <TabsContent value="activity" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Activity Trends</CardTitle>
                <CardDescription>Daily logins and user actions over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={activityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="logins" stroke="#3b82f6" strokeWidth={2} name="Logins" />
                    <Line type="monotone" dataKey="actions" stroke="#10b981" strokeWidth={2} name="Actions" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest system actions and events</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">User login successful</p>
                      <p className="text-xs text-muted-foreground">john.doe@company.com • 2 min ago</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">System configuration updated</p>
                      <p className="text-xs text-muted-foreground">admin@company.com • 15 min ago</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">New user pending approval</p>
                      <p className="text-xs text-muted-foreground">jane.smith@company.com • 1 hour ago</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>User Distribution by Role</CardTitle>
                <CardDescription>Breakdown of users across different roles</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={userDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ role, percentage }) => `${role} (${percentage}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {userDistribution.map((_, index) => (
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
                <CardTitle>User Status Overview</CardTitle>
                <CardDescription>Current status of all users in the system</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Active Users</span>
                  <Badge className="bg-green-100 text-green-800">
                    {stats.users.active} of {stats.users.total}
                  </Badge>
                </div>
                <Progress value={(stats.users.active / stats.users.total) * 100} className="h-2" />

                <div className="flex items-center justify-between">
                  <span className="text-sm">Pending Approval</span>
                  <Badge variant="outline" className="text-yellow-600">
                    {stats.users.pending}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm">Suspended</span>
                  <Badge variant="outline" className="text-red-600">
                    {stats.users.suspended}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Storage Usage</CardTitle>
                <CardDescription>Database and file storage consumption</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Database Size</span>
                  <Badge variant="outline">{stats.system.database_size}</Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Storage Used</span>
                    <span className="text-sm text-muted-foreground">
                      {Math.round(storagePercentage)}% used
                    </span>
                  </div>
                  <Progress value={storagePercentage} className="h-2" />
                  <div className="text-xs text-muted-foreground">
                    {stats.system.storage_used}GB of {stats.system.storage_total}GB
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Security Monitoring</CardTitle>
                <CardDescription>Security events and policy compliance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Failed Login Attempts</span>
                  <Badge variant={stats.security.failed_logins > 10 ? "destructive" : "outline"}>
                    {stats.security.failed_logins}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm">Suspicious Activities</span>
                  <Badge variant={stats.security.suspicious_activity > 0 ? "destructive" : "outline"}>
                    {stats.security.suspicious_activity}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm">Policy Violations</span>
                  <Badge variant={stats.security.policy_violations > 0 ? "destructive" : "outline"}>
                    {stats.security.policy_violations}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}