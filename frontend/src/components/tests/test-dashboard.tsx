import { useTestStatistics } from '@/hooks/use-tests'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
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
  Legend
} from 'recharts'
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Target,
  TrendingUp
} from 'lucide-react'

const COLORS = {
  pass: '#22c55e',
  fail: '#ef4444',
  pending: '#f59e0b',
  overdue: '#dc2626'
}

export function TestDashboard() {
  const { data: stats, isLoading } = useTestStatistics()

  if (isLoading) {
    return (
      <div className="grid gap-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded animate-pulse mb-2" />
                <div className="h-3 bg-gray-200 rounded animate-pulse" />
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
        <CardHeader>
          <CardTitle>Test Statistics</CardTitle>
          <CardDescription>No test data available</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const completionRate = stats.totalTests > 0 ? (stats.completedTests / stats.totalTests) * 100 : 0
  const passRate = stats.completedTests > 0 ? (stats.passedTests / stats.completedTests) * 100 : 0

  const statusData = Object.entries(stats.testsByStatus).map(([status, count]) => ({
    name: status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
    value: count,
    fill: status.includes('pass') ? COLORS.pass :
          status.includes('fail') ? COLORS.fail :
          status.includes('progress') ? COLORS.pending : COLORS.overdue
  }))

  const controlTestData = stats.testsByControl.slice(0, 10).map(control => ({
    name: control.control_name.length > 20
      ? control.control_name.substring(0, 20) + '...'
      : control.control_name,
    passed: control.passed,
    failed: control.failed,
    total: control.test_count
  }))

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTests}</div>
            <p className="text-xs text-muted-foreground">
              {stats.completedTests} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionRate.toFixed(1)}%</div>
            <Progress value={completionRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{passRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.passedTests} of {stats.completedTests} tests
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Exceptions</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.exceptionsCount}</div>
            {stats.overduTests > 0 && (
              <p className="text-xs text-red-600">
                {stats.overduTests} overdue
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Test Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Test Status Distribution</CardTitle>
            <CardDescription>
              Current status of all test plans
            </CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${((percent as number) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Tests by Control */}
        <Card>
          <CardHeader>
            <CardTitle>Tests by Control (Top 10)</CardTitle>
            <CardDescription>
              Pass/fail rates for controls with most tests
            </CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={controlTestData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  fontSize={12}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="passed" fill={COLORS.pass} name="Passed" />
                <Bar dataKey="failed" fill={COLORS.fail} name="Failed" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Alerts and Action Items */}
      {(stats.overduTests > 0 || stats.exceptionsCount > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {stats.overduTests > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-red-800">Overdue Tests</CardTitle>
                  <Badge variant="destructive">{stats.overduTests}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-2">
                  <Clock className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-red-700">
                      {stats.overduTests} test{stats.overduTests > 1 ? 's are' : ' is'} overdue and require immediate attention.
                    </p>
                    <p className="text-xs text-red-600 mt-1">
                      Review testing schedules and assign resources to complete overdue tests.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {stats.exceptionsCount > 0 && (
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-orange-800">Active Exceptions</CardTitle>
                  <Badge className="bg-orange-100 text-orange-800">{stats.exceptionsCount}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-orange-700">
                      {stats.exceptionsCount} exception{stats.exceptionsCount > 1 ? 's' : ''} identified during testing.
                    </p>
                    <p className="text-xs text-orange-600 mt-1">
                      Review exceptions and ensure proper remediation plans are in place.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}