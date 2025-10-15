import { useState } from 'react'
import { TestPlanningView } from '@/components/tests/test-planning-view'
import { TestExecutionView } from '@/components/tests/test-execution-view'
import { TestDashboard } from '@/components/tests/test-dashboard'
import { TestCycleManager } from '@/components/tests/test-cycle-manager'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ClipboardList,
  PlayCircle,
  BarChart3,
  Calendar,
  Plus
} from 'lucide-react'

type TestView = 'dashboard' | 'planning' | 'execution' | 'cycles'

export function TestsPage() {
  const [activeView, setActiveView] = useState<TestView>('dashboard')
  const [showNewTestDialog, setShowNewTestDialog] = useState(false)

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Control Testing</h1>
          <p className="text-muted-foreground">
            Plan, execute, and track control testing activities
          </p>
        </div>
        <Button
          onClick={() => setShowNewTestDialog(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          New Test Plan
        </Button>
      </div>

      <Tabs value={activeView} onValueChange={(value) => setActiveView(value as TestView)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="planning" className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            Planning
          </TabsTrigger>
          <TabsTrigger value="execution" className="flex items-center gap-2">
            <PlayCircle className="h-4 w-4" />
            Execution
          </TabsTrigger>
          <TabsTrigger value="cycles" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Test Cycles
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <TestDashboard />
        </TabsContent>

        <TabsContent value="planning" className="space-y-6">
          <TestPlanningView
            showNewDialog={showNewTestDialog}
            onCloseNewDialog={() => setShowNewTestDialog(false)}
          />
        </TabsContent>

        <TabsContent value="execution" className="space-y-6">
          <TestExecutionView />
        </TabsContent>

        <TabsContent value="cycles" className="space-y-6">
          <TestCycleManager />
        </TabsContent>
      </Tabs>
    </div>
  )
}