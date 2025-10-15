import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function TestExecutionView() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Test Execution</CardTitle>
        <CardDescription>
          Execute test plans and record results
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Test execution interface will be implemented in the next phase.
        </p>
      </CardContent>
    </Card>
  )
}