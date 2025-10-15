import { useControlCoverage } from '@/hooks/use-rcm'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { AlertTriangle, Shield, CheckCircle, XCircle } from 'lucide-react'

export function ControlCoverage() {
  const { data: coverage, isLoading } = useControlCoverage()

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Control Coverage Analysis</CardTitle>
          <CardDescription>Loading coverage data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!coverage) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Control Coverage Analysis</CardTitle>
          <CardDescription>No coverage data available</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Overall Coverage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Risk Coverage Overview
          </CardTitle>
          <CardDescription>
            Percentage of risks with control coverage
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Coverage Rate</span>
              <span>{coverage.coveragePercentage.toFixed(1)}%</span>
            </div>
            <Progress value={coverage.coveragePercentage} className="h-2" />
          </div>

          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">{coverage.coveredRisks}</div>
              <div className="text-sm text-muted-foreground">Covered Risks</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">{coverage.uncoveredRisks}</div>
              <div className="text-sm text-muted-foreground">Uncovered Risks</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Control Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Control Distribution
          </CardTitle>
          <CardDescription>
            Number of controls per risk
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">No Controls</span>
              <div className="flex items-center gap-2">
                <Badge variant="destructive" className="text-xs">
                  {coverage.risksByControlCount.none}
                </Badge>
                <XCircle className="h-4 w-4 text-red-600" />
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm">Single Control</span>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {coverage.risksByControlCount.single}
                </Badge>
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm">Multiple Controls</span>
              <div className="flex items-center gap-2">
                <Badge className="text-xs">
                  {coverage.risksByControlCount.multiple}
                </Badge>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* High-Risk Alerts */}
      {coverage.highRisksWithoutControls.length > 0 && (
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              High-Risk Alerts
            </CardTitle>
            <CardDescription>
              High/Critical risks without adequate control coverage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {coverage.highRisksWithoutControls.slice(0, 5).map((risk) => (
                <div key={risk.id} className="flex items-center justify-between p-3 border rounded-lg bg-red-50">
                  <div>
                    <div className="font-medium">{risk.risk_name}</div>
                    <div className="text-sm text-muted-foreground">
                      Impact: {risk.impact} | Likelihood: {risk.likelihood}
                    </div>
                  </div>
                  <Badge variant="destructive">
                    No Controls
                  </Badge>
                </div>
              ))}
              {coverage.highRisksWithoutControls.length > 5 && (
                <div className="text-center text-sm text-muted-foreground">
                  +{coverage.highRisksWithoutControls.length - 5} more high-risk items
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}