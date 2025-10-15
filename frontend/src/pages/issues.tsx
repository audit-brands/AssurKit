import { useState } from 'react'
import { IssueList } from '@/components/issues/issue-list'
import { IssueForm } from '@/components/issues/issue-form'
import { IssueStatistics } from '@/components/issues/issue-statistics'
import { IssueSearch } from '@/components/issues/issue-search'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  AlertTriangle,
  BarChart3,
  Plus
} from 'lucide-react'

type IssueView = 'list' | 'statistics'

export function IssuesPage() {
  const [activeView, setActiveView] = useState<IssueView>('list')
  const [showNewIssueDialog, setShowNewIssueDialog] = useState(false)
  const [searchFilters, setSearchFilters] = useState({})

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Issue Management</h1>
          <p className="text-muted-foreground">
            Track and manage control testing exceptions and remediation activities
          </p>
        </div>
        <Button
          onClick={() => setShowNewIssueDialog(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          New Issue
        </Button>
      </div>

      <Tabs value={activeView} onValueChange={(value) => setActiveView(value as IssueView)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Issues
          </TabsTrigger>
          <TabsTrigger value="statistics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-6">
          <IssueSearch onFiltersChange={setSearchFilters} />
          <IssueList filters={searchFilters} />
        </TabsContent>

        <TabsContent value="statistics" className="space-y-6">
          <IssueStatistics />
        </TabsContent>
      </Tabs>

      <IssueForm
        open={showNewIssueDialog}
        onOpenChange={setShowNewIssueDialog}
      />
    </div>
  )
}