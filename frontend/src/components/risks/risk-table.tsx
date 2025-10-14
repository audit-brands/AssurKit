import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { RiskForm } from './risk-form'
import { useRisks, useDeleteRisk, type Risk } from '@/hooks/use-risks'
import { useSubprocesses } from '@/hooks/use-subprocesses'
import { useProcesses } from '@/hooks/use-processes'
import { Edit, Trash2, Plus, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RiskTableProps {
  subprocessId?: string
}

// Risk scoring matrix colors
const getRiskScoreColor = (impact?: string, likelihood?: string) => {
  if (!impact || !likelihood) return 'bg-gray-100'

  const impactScore = { Low: 1, Medium: 2, High: 3, Critical: 4 }[impact] || 0
  const likelihoodScore = { Rare: 1, Unlikely: 2, Possible: 3, Likely: 4, 'Almost Certain': 5 }[likelihood] || 0
  const riskScore = impactScore * likelihoodScore

  if (riskScore >= 15) return 'bg-red-500 text-white'
  if (riskScore >= 10) return 'bg-orange-500 text-white'
  if (riskScore >= 5) return 'bg-yellow-500 text-white'
  return 'bg-green-500 text-white'
}

const getRiskScoreLabel = (impact?: string, likelihood?: string) => {
  if (!impact || !likelihood) return '-'

  const impactScore = { Low: 1, Medium: 2, High: 3, Critical: 4 }[impact] || 0
  const likelihoodScore = { Rare: 1, Unlikely: 2, Possible: 3, Likely: 4, 'Almost Certain': 5 }[likelihood] || 0
  const riskScore = impactScore * likelihoodScore

  if (riskScore >= 15) return 'Critical'
  if (riskScore >= 10) return 'High'
  if (riskScore >= 5) return 'Medium'
  return 'Low'
}

export function RiskTable({ subprocessId }: RiskTableProps) {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingRisk, setEditingRisk] = useState<Risk | undefined>()
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; risk?: Risk }>({
    open: false,
    risk: undefined
  })

  const { data: risks, isLoading, error } = useRisks()
  const { data: subprocesses } = useSubprocesses()
  const { data: processes } = useProcesses()
  const deleteRisk = useDeleteRisk()

  // Filter risks by subprocess if subprocessId is provided
  const filteredRisks = risks?.filter(risk =>
    subprocessId ? risk.subprocess_id === subprocessId : true
  )

  // Get subprocess and process names
  const getSubprocessName = (subprocessId: string) => {
    return subprocesses?.find(subprocess => subprocess.id === subprocessId)?.subprocess_name || 'Unknown Subprocess'
  }

  const getProcessName = (subprocessId: string) => {
    const subprocess = subprocesses?.find(s => s.id === subprocessId)
    if (!subprocess) return 'Unknown Process'
    return processes?.find(process => process.id === subprocess.process_id)?.process_name || 'Unknown Process'
  }

  const handleEdit = (risk: Risk) => {
    setEditingRisk(risk)
    setIsFormOpen(true)
  }

  const handleDelete = (risk: Risk) => {
    setDeleteDialog({ open: true, risk })
  }

  const confirmDelete = async () => {
    if (deleteDialog.risk) {
      try {
        await deleteRisk.mutateAsync(deleteDialog.risk.id)
        setDeleteDialog({ open: false, risk: undefined })
      } catch (error) {
        console.error('Failed to delete risk:', error)
      }
    }
  }

  const handleFormClose = () => {
    setIsFormOpen(false)
    setEditingRisk(undefined)
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <AlertTriangle className="h-6 w-6" />
            Risks
          </h2>
          <Button disabled>
            <Plus className="mr-2 h-4 w-4" />
            Add Risk
          </Button>
        </div>
        <div className="flex items-center justify-center h-32">
          <p className="text-muted-foreground">Loading risks...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <AlertTriangle className="h-6 w-6" />
            Risks
          </h2>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Risk
          </Button>
        </div>
        <div className="flex items-center justify-center h-32">
          <p className="text-red-600">Error loading risks. Please try again.</p>
        </div>
      </div>
    )
  }

  if (!filteredRisks || filteredRisks.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <AlertTriangle className="h-6 w-6" />
            Risks
          </h2>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Risk
          </Button>
        </div>
        <div className="flex flex-col items-center justify-center h-32 space-y-2">
          <p className="text-muted-foreground">No risks found.</p>
          <Button onClick={() => setIsFormOpen(true)} size="sm">
            Create your first risk
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <AlertTriangle className="h-6 w-6" />
          Risks
        </h2>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Risk
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Risk Name</TableHead>
              {!subprocessId && <TableHead>Process</TableHead>}
              {!subprocessId && <TableHead>Subprocess</TableHead>}
              <TableHead>Category</TableHead>
              <TableHead>Impact</TableHead>
              <TableHead>Likelihood</TableHead>
              <TableHead>Risk Score</TableHead>
              <TableHead>Assertions</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRisks.map((risk) => (
              <TableRow key={risk.id}>
                <TableCell className="font-medium">{risk.risk_name}</TableCell>
                {!subprocessId && (
                  <TableCell>{getProcessName(risk.subprocess_id)}</TableCell>
                )}
                {!subprocessId && (
                  <TableCell>{getSubprocessName(risk.subprocess_id)}</TableCell>
                )}
                <TableCell>{risk.risk_category || '-'}</TableCell>
                <TableCell>
                  <Badge variant={risk.impact === 'Critical' || risk.impact === 'High' ? 'destructive' : 'secondary'}>
                    {risk.impact || '-'}
                  </Badge>
                </TableCell>
                <TableCell>{risk.likelihood || '-'}</TableCell>
                <TableCell>
                  <Badge className={cn('font-semibold', getRiskScoreColor(risk.impact, risk.likelihood))}>
                    {getRiskScoreLabel(risk.impact, risk.likelihood)}
                  </Badge>
                </TableCell>
                <TableCell>
                  {risk.assertions && risk.assertions.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {risk.assertions.slice(0, 2).map((assertion, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {assertion}
                        </Badge>
                      ))}
                      {risk.assertions.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{risk.assertions.length - 2}
                        </Badge>
                      )}
                    </div>
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={risk.status === 'Active' ? 'default' : 'secondary'}>
                    {risk.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(risk)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(risk)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <RiskForm
        open={isFormOpen}
        onOpenChange={handleFormClose}
        risk={editingRisk}
        defaultSubprocessId={subprocessId}
      />

      <AlertDialog open={deleteDialog.open} onOpenChange={(open: boolean) => setDeleteDialog({ open, risk: undefined })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Risk</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteDialog.risk?.risk_name}"? This action cannot be undone and may affect related controls and tests.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteRisk.isPending}
            >
              {deleteRisk.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}