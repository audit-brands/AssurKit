import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function TestCycleManager() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Test Cycle Management</CardTitle>
        <CardDescription>
          Manage testing cycles and periods
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Test cycle management interface will be implemented in the next phase.
        </p>
      </CardContent>
    </Card>
  )
}