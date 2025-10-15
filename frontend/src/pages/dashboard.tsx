import { useState } from 'react'
import { type DashboardFilters } from '@/hooks/use-dashboard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { ExecutiveOverview } from '@/components/dashboard/executive-overview'
import { ComplianceHealthCheck } from '@/components/dashboard/compliance-health-check'
import { AuditReadinessReport } from '@/components/dashboard/audit-readiness-report'
import { DashboardFilters as DashboardFiltersComponent } from '@/components/dashboard/dashboard-filters'
import {
  BarChart3,
  Shield,
  ClipboardCheck,
  Download,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  Target
} from 'lucide-react'

export function DashboardPage() {
  const [filters, setFilters] = useState<DashboardFilters>({
    period: 'current'
  })

  const [lastRefresh, setLastRefresh] = useState(new Date())
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    // Simulate refresh delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    setLastRefresh(new Date())
    setIsRefreshing(false)
  }

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Export dashboard data with filters:', filters)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Executive Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive view of SOX compliance status and metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-sm text-muted-foreground">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <DashboardFiltersComponent
        filters={filters}
        onFiltersChange={setFilters}
      />

      {/* Key Metrics Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Compliance Health</p>
                <p className="text-2xl font-bold text-green-600">Good</p>
                <p className="text-xs text-muted-foreground">
                  87% overall score
                </p>
              </div>
              <Shield className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Test Completion</p>
                <p className="text-2xl font-bold text-blue-600">92%</p>
                <p className="text-xs text-muted-foreground">
                  On track for period
                </p>
              </div>
              <Target className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Audit Readiness</p>
                <p className="text-2xl font-bold text-orange-600">78%</p>
                <p className="text-xs text-muted-foreground">
                  Preparation needed
                </p>
              </div>
              <ClipboardCheck className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Executive Overview
          </TabsTrigger>
          <TabsTrigger value="health-check" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Health Check
          </TabsTrigger>
          <TabsTrigger value="audit-readiness" className="flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4" />
            Audit Readiness
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-6 w-6" />
                Executive Overview
              </CardTitle>
              <CardDescription>
                Comprehensive metrics and key performance indicators for SOX compliance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ExecutiveOverview filters={filters} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="health-check" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-6 w-6" />
                Compliance Health Check
              </CardTitle>
              <CardDescription>
                Assessment of compliance program effectiveness and risk indicators
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ComplianceHealthCheck filters={filters} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit-readiness" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardCheck className="h-6 w-6" />
                Audit Readiness Assessment
              </CardTitle>
              <CardDescription>
                Evaluation of preparedness for external audit and remaining action items
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AuditReadinessReport filters={filters} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks and navigation shortcuts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
              <BarChart3 className="h-6 w-6" />
              <span>View Reports</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
              <AlertTriangle className="h-6 w-6" />
              <span>Review Issues</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
              <ClipboardCheck className="h-6 w-6" />
              <span>Pending Tests</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
              <Shield className="h-6 w-6" />
              <span>Control Review</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}