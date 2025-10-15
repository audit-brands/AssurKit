import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  Cell
} from 'recharts'
import {
  AlertTriangle,
  TrendingUp,
  Calendar,
  Download,
  Filter,
  BarChart3
} from 'lucide-react'

export interface ExceptionData {
  process_name: string
  control_name: string
  test_name: string
  exception_type: 'test_failure' | 'control_deficiency' | 'missing_evidence' | 'overdue_remediation'
  severity: 'low' | 'medium' | 'high' | 'critical'
  date: string
  month: string
  week: string
  count: number
  impact_score: number
  resolution_days?: number
}

export interface HeatmapData {
  exceptions_by_process: Array<{
    process: string
    total_exceptions: number
    critical_count: number
    high_count: number
    medium_count: number
    low_count: number
    trend_direction: 'up' | 'down' | 'stable'
    trend_percentage: number
  }>

  exceptions_by_month: Array<{
    month: string
    total_exceptions: number
    by_severity: Record<string, number>
    by_type: Record<string, number>
  }>

  exceptions_by_control_type: Array<{
    control_type: string
    automation_level: 'manual' | 'automated' | 'hybrid'
    exception_rate: number
    total_tests: number
    failed_tests: number
  }>

  resolution_patterns: Array<{
    exception_type: string
    avg_resolution_days: number
    min_days: number
    max_days: number
    count: number
  }>

  hot_spots: Array<{
    entity: string
    entity_type: 'process' | 'control' | 'test'
    exception_density: number
    risk_score: number
    last_exception_date: string
  }>
}

interface ExceptionHeatmapProps {
  timeRange?: string
  processFilter?: string[]
}

const TIME_RANGE_OPTIONS = [
  { value: 'last-3-months', label: 'Last 3 Months' },
  { value: 'last-6-months', label: 'Last 6 Months' },
  { value: 'current-year', label: 'Current Year' },
  { value: 'last-year', label: 'Last Year' },
]

const SEVERITY_COLORS = {
  critical: '#dc2626',
  high: '#ea580c',
  medium: '#d97706',
  low: '#65a30d'
}

const TREND_COLORS = {
  up: '#dc2626',
  down: '#16a34a',
  stable: '#6b7280'
}

export function ExceptionHeatmap({ timeRange = 'last-3-months', processFilter }: ExceptionHeatmapProps) {
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange)
  const [selectedView, setSelectedView] = useState('overview')

  const { data: heatmapData, isLoading, refetch } = useQuery({
    queryKey: ['exception-heatmap', selectedTimeRange, processFilter],
    queryFn: async (): Promise<HeatmapData> => {
      const params = new URLSearchParams({
        time_range: selectedTimeRange,
        ...(processFilter?.length && { processes: processFilter.join(',') })
      })

      const response = await fetch(`/api/reporting/exception-heatmap?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch exception heatmap data')
      }
      return response.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  })

  const getSeverityColor = (severity: string) => {
    return SEVERITY_COLORS[severity as keyof typeof SEVERITY_COLORS] || '#6b7280'
  }

  const getTrendIcon = (direction: string) => {
    return direction === 'up' ? '↗' : direction === 'down' ? '↘' : '→'
  }

  const exportHeatmapData = () => {
    if (!heatmapData) return

    const csvData = [
      ['Process', 'Total Exceptions', 'Critical', 'High', 'Medium', 'Low', 'Trend'],
      ...heatmapData.exceptions_by_process.map(item => [
        item.process,
        item.total_exceptions,
        item.critical_count,
        item.high_count,
        item.medium_count,
        item.low_count,
        `${item.trend_direction} ${item.trend_percentage}%`
      ])
    ]

    const csvContent = csvData.map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `exception-heatmap-${selectedTimeRange}.csv`
    link.click()
    window.URL.revokeObjectURL(url)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
          <div className="flex gap-2">
            <div className="h-8 bg-gray-200 rounded w-32 animate-pulse"></div>
            <div className="h-8 bg-gray-200 rounded w-24 animate-pulse"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-64 bg-gray-200 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!heatmapData) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertTriangle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground">Failed to load exception heatmap data</p>
          <Button onClick={() => refetch()} className="mt-2">
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          <h2 className="text-2xl font-bold">Exception Analysis & Heatmap</h2>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIME_RANGE_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button onClick={exportHeatmapData} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Tabs value={selectedView} onValueChange={setSelectedView}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="hotspots">Hot Spots</TabsTrigger>
          <TabsTrigger value="resolution">Resolution</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Process Exception Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Exceptions by Process</CardTitle>
              <CardDescription>
                Exception distribution across business processes with severity breakdown
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {heatmapData.exceptions_by_process.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">{item.process}</span>
                        <Badge variant="outline">
                          {getTrendIcon(item.trend_direction)} {Math.abs(item.trend_percentage)}%
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        {item.critical_count > 0 && (
                          <Badge style={{ backgroundColor: SEVERITY_COLORS.critical, color: 'white' }}>
                            Critical: {item.critical_count}
                          </Badge>
                        )}
                        {item.high_count > 0 && (
                          <Badge style={{ backgroundColor: SEVERITY_COLORS.high, color: 'white' }}>
                            High: {item.high_count}
                          </Badge>
                        )}
                        {item.medium_count > 0 && (
                          <Badge style={{ backgroundColor: SEVERITY_COLORS.medium, color: 'white' }}>
                            Medium: {item.medium_count}
                          </Badge>
                        )}
                        {item.low_count > 0 && (
                          <Badge style={{ backgroundColor: SEVERITY_COLORS.low, color: 'white' }}>
                            Low: {item.low_count}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{item.total_exceptions}</div>
                      <div className="text-sm text-muted-foreground">Total Exceptions</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Monthly Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Exception Trends</CardTitle>
              <CardDescription>Exception volume and patterns over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={heatmapData.exceptions_by_month}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="total_exceptions" fill="#3b82f6" name="Total Exceptions" />
                  <Line type="monotone" dataKey="total_exceptions" stroke="#dc2626" strokeWidth={2} />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Control Type Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>Exception Rate by Control Type</CardTitle>
                <CardDescription>Failure rates across different control types</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {heatmapData.exceptions_by_control_type.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <div className="font-medium">{item.control_type}</div>
                        <div className="text-sm text-muted-foreground capitalize">
                          {item.automation_level}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-red-600">
                          {item.exception_rate.toFixed(1)}%
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {item.failed_tests}/{item.total_tests} tests
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Monthly Severity Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Severity Distribution Over Time</CardTitle>
                <CardDescription>Exception severity patterns by month</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={heatmapData.exceptions_by_month}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="by_severity.critical" stackId="severity" fill={SEVERITY_COLORS.critical} name="Critical" />
                    <Bar dataKey="by_severity.high" stackId="severity" fill={SEVERITY_COLORS.high} name="High" />
                    <Bar dataKey="by_severity.medium" stackId="severity" fill={SEVERITY_COLORS.medium} name="Medium" />
                    <Bar dataKey="by_severity.low" stackId="severity" fill={SEVERITY_COLORS.low} name="Low" />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="hotspots" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Exception Hot Spots</CardTitle>
              <CardDescription>
                Areas with highest exception density and risk scores
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {heatmapData.hot_spots.map((hotspot, index) => (
                  <Card key={index} className="border-l-4" style={{ borderLeftColor: hotspot.risk_score > 80 ? SEVERITY_COLORS.critical : hotspot.risk_score > 60 ? SEVERITY_COLORS.high : SEVERITY_COLORS.medium }}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className="capitalize">
                          {hotspot.entity_type}
                        </Badge>
                        <span className="text-sm font-bold">{hotspot.risk_score}/100</span>
                      </div>
                      <div className="font-medium mb-2">{hotspot.entity}</div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div>Density: {hotspot.exception_density.toFixed(2)}</div>
                        <div>Last Exception: {hotspot.last_exception_date}</div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resolution" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Resolution Time Patterns</CardTitle>
              <CardDescription>
                Average resolution times by exception type
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={heatmapData.resolution_patterns}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="exception_type" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip
                    formatter={(value, name) => [
                      `${value} days`,
                      name === 'avg_resolution_days' ? 'Average' :
                      name === 'min_days' ? 'Minimum' : 'Maximum'
                    ]}
                  />
                  <Bar dataKey="avg_resolution_days" fill="#3b82f6" name="Average Resolution Days" />
                  <Bar dataKey="min_days" fill="#10b981" name="Min Days" />
                  <Bar dataKey="max_days" fill="#f59e0b" name="Max Days" />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}