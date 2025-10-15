import { useState } from 'react'
import { EvidenceList } from '@/components/evidence/evidence-list'
import { EvidenceUpload } from '@/components/evidence/evidence-upload'
import { EvidenceStatistics } from '@/components/evidence/evidence-statistics'
import { EvidenceSearch } from '@/components/evidence/evidence-search'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Upload,
  Files,
  BarChart3
} from 'lucide-react'

type EvidenceView = 'list' | 'statistics'

export function EvidencePage() {
  const [activeView, setActiveView] = useState<EvidenceView>('list')
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [searchFilters, setSearchFilters] = useState({})

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Evidence Management</h1>
          <p className="text-muted-foreground">
            Secure storage and management of audit evidence with integrity verification
          </p>
        </div>
        <Button
          onClick={() => setShowUploadDialog(true)}
          className="flex items-center gap-2"
        >
          <Upload className="h-4 w-4" />
          Upload Evidence
        </Button>
      </div>

      <Tabs value={activeView} onValueChange={(value) => setActiveView(value as EvidenceView)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list" className="flex items-center gap-2">
            <Files className="h-4 w-4" />
            Evidence Files
          </TabsTrigger>
          <TabsTrigger value="statistics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Statistics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-6">
          <EvidenceSearch onFiltersChange={setSearchFilters} />
          <EvidenceList filters={searchFilters} />
        </TabsContent>

        <TabsContent value="statistics" className="space-y-6">
          <EvidenceStatistics />
        </TabsContent>
      </Tabs>

      <EvidenceUpload
        open={showUploadDialog}
        onOpenChange={setShowUploadDialog}
      />
    </div>
  )
}