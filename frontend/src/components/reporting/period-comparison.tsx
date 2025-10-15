import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
  ComposedChart
} from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  Download,
  RefreshCw
} from 'lucide-react'

export interface PeriodMetrics {
  period: string
  period_start: string
  period_end: string

  // Test Metrics
  tests_planned: number
  tests_completed: number
  tests_passed: number
  tests_failed: number
  pass_rate: number

  // Issue Metrics
  issues_opened: number
  issues_closed: number
  issues_overdue: number
  avg_resolution_days: number

  // Control Metrics
  controls_tested: number
  control_effectiveness: number
  key_controls_tested: number

  // Evidence Metrics
  evidence_collected: number
  evidence_reviewed: number
  evidence_approved: number
}

export interface PeriodComparison {
  current_period: PeriodMetrics
  previous_period: PeriodMetrics
  variance_analysis: {
    tests_completion_change: number
    pass_rate_change: number
    issues_resolution_change: number
    control_effectiveness_change: number
  }
  trend_data: Array<{
    period: string
    tests_completed: number
    pass_rate: number
    issues_closed: number
    control_effectiveness: number
  }>
}

interface PeriodComparisonProps {
  selectedPeriods?: {
    current: string
    previous: string
  }
}

const PERIOD_OPTIONS = [
  { value: 'current-month', label: 'Current Month' },
  { value: 'last-month', label: 'Last Month' },
  { value: 'current-quarter', label: 'Current Quarter' },
  { value: 'last-quarter', label: 'Last Quarter' },
  { value: 'current-year', label: 'Current Year' },
  { value: 'last-year', label: 'Last Year' },
]

export function PeriodComparison({ selectedPeriods }: PeriodComparisonProps) {
  const [currentPeriod, setCurrentPeriod] = useState(
    selectedPeriods?.current || 'current-month'
  )
  const [previousPeriod, setPreviousPeriod] = useState(
    selectedPeriods?.previous || 'last-month'
  )

  const { data: comparison, isLoading, refetch } = useQuery({
    queryKey: ['period-comparison', currentPeriod, previousPeriod],
    queryFn: async (): Promise<PeriodComparison> => {
      const response = await fetch(
        `/api/reporting/period-comparison?current=${currentPeriod}&previous=${previousPeriod}`
      )
      if (!response.ok) {
        throw new Error('Failed to fetch period comparison')
      }
      return response.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  })

  const getVarianceIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-600" />
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-600" />
    return <Minus className="h-4 w-4 text-gray-500" />
  }

  const getVarianceColor = (change: number) => {
    if (change > 0) return 'text-green-600'
    if (change < 0) return 'text-red-600'
    return 'text-gray-500'
  }

  const formatChange = (change: number, suffix = '%') => {
    const sign = change > 0 ? '+' : ''
    return `${sign}${change.toFixed(1)}${suffix}`
  }

  const exportData = () => {
    if (!comparison) return

    // Convert to CSV format
    const csvData = [
      ['Metric', 'Current Period', 'Previous Period', 'Change'],
      ['Tests Completed', comparison.current_period.tests_completed, comparison.previous_period.tests_completed, formatChange(comparison.variance_analysis.tests_completion_change)],
      ['Pass Rate', `${comparison.current_period.pass_rate}%`, `${comparison.previous_period.pass_rate}%`, formatChange(comparison.variance_analysis.pass_rate_change)],
      ['Issues Closed', comparison.current_period.issues_closed, comparison.previous_period.issues_closed, formatChange(comparison.variance_analysis.issues_resolution_change)],
      ['Control Effectiveness', `${comparison.current_period.control_effectiveness}%`, `${comparison.previous_period.control_effectiveness}%`, formatChange(comparison.variance_analysis.control_effectiveness_change)],
    ]

    const csvContent = csvData.map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `period-comparison-${currentPeriod}-vs-${previousPeriod}.csv`
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
            <div className="h-8 bg-gray-200 rounded w-32 animate-pulse"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!comparison) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Failed to load period comparison data</p>
          <Button onClick={() => refetch()} className="mt-2">
            <RefreshCw className="h-4 w-4 mr-2" />
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
          <Calendar className="h-5 w-5" />
          <h2 className="text-2xl font-bold">Period Comparison</h2>
        </div>
        <div className="flex items-center gap-2">
          <Select value={currentPeriod} onValueChange={setCurrentPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Current period" />
            </SelectTrigger>
            <SelectContent>
              {PERIOD_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <span className="text-muted-foreground">vs</span>

          <Select value={previousPeriod} onValueChange={setPreviousPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Previous period" />
            </SelectTrigger>
            <SelectContent>
              {PERIOD_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button onClick={exportData} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tests Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{comparison.current_period.tests_completed}</div>
            <div className="flex items-center gap-1 text-sm">
              {getVarianceIcon(comparison.variance_analysis.tests_completion_change)}
              <span className={getVarianceColor(comparison.variance_analysis.tests_completion_change)}>
                {formatChange(comparison.variance_analysis.tests_completion_change)}
              </span>
              <span className="text-muted-foreground">vs {comparison.previous_period.tests_completed}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{comparison.current_period.pass_rate}%</div>
            <div className="flex items-center gap-1 text-sm">
              {getVarianceIcon(comparison.variance_analysis.pass_rate_change)}
              <span className={getVarianceColor(comparison.variance_analysis.pass_rate_change)}>
                {formatChange(comparison.variance_analysis.pass_rate_change)}
              </span>
              <span className="text-muted-foreground">vs {comparison.previous_period.pass_rate}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Issues Resolved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{comparison.current_period.issues_closed}</div>
            <div className="flex items-center gap-1 text-sm">
              {getVarianceIcon(comparison.variance_analysis.issues_resolution_change)}
              <span className={getVarianceColor(comparison.variance_analysis.issues_resolution_change)}>
                {formatChange(comparison.variance_analysis.issues_resolution_change)}
              </span>
              <span className="text-muted-foreground">vs {comparison.previous_period.issues_closed}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Control Effectiveness</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{comparison.current_period.control_effectiveness}%</div>
            <div className="flex items-center gap-1 text-sm">
              {getVarianceIcon(comparison.variance_analysis.control_effectiveness_change)}
              <span className={getVarianceColor(comparison.variance_analysis.control_effectiveness_change)}>
                {formatChange(comparison.variance_analysis.control_effectiveness_change)}
              </span>
              <span className="text-muted-foreground">vs {comparison.previous_period.control_effectiveness}%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trend Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Testing Performance Trends</CardTitle>
            <CardDescription>Test completion and pass rates over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={comparison.trend_data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip
                  formatter={(value, name) => [
                    typeof value === 'number' ? value.toLocaleString() : value,
                    name === 'pass_rate' ? 'Pass Rate (%)' : 'Tests Completed'
                  ]}
                />
                <Bar yAxisId="left" dataKey="tests_completed" fill="#3b82f6" name="Tests Completed" />
                <Line yAxisId="right" type="monotone" dataKey="pass_rate" stroke="#10b981" strokeWidth={2} name="Pass Rate %" />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Control & Issue Trends</CardTitle>
            <CardDescription>Control effectiveness and issue resolution</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={comparison.trend_data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip
                  formatter={(value, name) => [
                    typeof value === 'number' ? value.toLocaleString() : value,
                    name === 'control_effectiveness' ? 'Control Effectiveness (%)' : 'Issues Closed'
                  ]}
                />
                <Bar yAxisId="left" dataKey="issues_closed" fill="#f59e0b" name="Issues Closed" />
                <Line yAxisId="right" type="monotone" dataKey="control_effectiveness" stroke="#8b5cf6" strokeWidth={2} name="Control Effectiveness %" />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}