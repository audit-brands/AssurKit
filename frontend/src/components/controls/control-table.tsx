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
import { ControlForm } from './control-form'
import { useControls, useDeleteControl, type Control } from '@/hooks/use-controls'
import { useRisks } from '@/hooks/use-risks'
import { useSubprocesses } from '@/hooks/use-subprocesses'
import { Edit, Trash2, Plus, Shield, Key } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ControlTableProps {
  riskId?: string
}

export function ControlTable({ riskId }: ControlTableProps) {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingControl, setEditingControl] = useState<Control | undefined>()
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; control?: Control }>({
    open: false,
    control: undefined
  })

  const { data: controls, isLoading, error } = useControls()
  const { data: risks } = useRisks()
  const { data: subprocesses } = useSubprocesses()
  const deleteControl = useDeleteControl()

  // Filter controls by risk if riskId is provided
  const filteredControls = controls?.filter(control =>
    riskId ? control.risk_id === riskId : true
  )

  // Get risk and subprocess names
  const getRiskName = (riskId: string) => {
    return risks?.find(risk => risk.id === riskId)?.risk_name || 'Unknown Risk'
  }

  const getSubprocessName = (riskId: string) => {
    const risk = risks?.find(r => r.id === riskId)
    if (!risk) return 'Unknown Subprocess'
    return subprocesses?.find(subprocess => subprocess.id === risk.subprocess_id)?.subprocess_name || 'Unknown Subprocess'
  }

  const handleEdit = (control: Control) => {
    setEditingControl(control)
    setIsFormOpen(true)
  }

  const handleDelete = (control: Control) => {
    setDeleteDialog({ open: true, control })
  }

  const confirmDelete = async () => {
    if (deleteDialog.control) {
      try {
        await deleteControl.mutateAsync(deleteDialog.control.id)
        setDeleteDialog({ open: false, control: undefined })
      } catch (error) {
        console.error('Failed to delete control:', error)
      }
    }
  }

  const handleFormClose = () => {
    setIsFormOpen(false)
    setEditingControl(undefined)
  }

  // Get control type color
  const getControlTypeColor = (type: string) => {
    switch (type) {
      case 'Preventive': return 'bg-blue-500'
      case 'Detective': return 'bg-yellow-500'
      case 'Corrective': return 'bg-orange-500'
      case 'Compensating': return 'bg-purple-500'
      default: return 'bg-gray-500'
    }
  }

  // Get automation icon
  const getAutomationIcon = (automation: string) => {
    switch (automation) {
      case 'Automated': return '🤖'
      case 'Semi-Automated': return '⚙️'
      case 'Manual': return '👤'
      default: return ''
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Controls
          </h2>
          <Button disabled>
            <Plus className="mr-2 h-4 w-4" />
            Add Control
          </Button>
        </div>
        <div className="flex items-center justify-center h-32">
          <p className="text-muted-foreground">Loading controls...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Controls
          </h2>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Control
          </Button>
        </div>
        <div className="flex items-center justify-center h-32">
          <p className="text-red-600">Error loading controls. Please try again.</p>
        </div>
      </div>
    )
  }

  if (!filteredControls || filteredControls.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Controls
          </h2>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Control
          </Button>
        </div>
        <div className="flex flex-col items-center justify-center h-32 space-y-2">
          <p className="text-muted-foreground">No controls found.</p>
          <Button onClick={() => setIsFormOpen(true)} size="sm">
            Create your first control
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="h-6 w-6" />
          Controls
        </h2>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Control
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Control Name</TableHead>
              {!riskId && <TableHead>Risk</TableHead>}
              {!riskId && <TableHead>Subprocess</TableHead>}
              <TableHead>Type</TableHead>
              <TableHead>Frequency</TableHead>
              <TableHead>Automation</TableHead>
              <TableHead>Key</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredControls.map((control) => (
              <TableRow key={control.id}>
                <TableCell className="font-medium">{control.control_name}</TableCell>
                {!riskId && (
                  <TableCell>{getRiskName(control.risk_id)}</TableCell>
                )}
                {!riskId && (
                  <TableCell>{getSubprocessName(control.risk_id)}</TableCell>
                )}
                <TableCell>
                  <Badge className={cn('text-white', getControlTypeColor(control.control_type))}>
                    {control.control_type}
                  </Badge>
                </TableCell>
                <TableCell>{control.frequency}</TableCell>
                <TableCell>
                  <span className="mr-1">{getAutomationIcon(control.automation)}</span>
                  {control.automation}
                </TableCell>
                <TableCell>
                  {control.key_control && (
                    <Key className="h-4 w-4 text-yellow-600" />
                  )}
                </TableCell>
                <TableCell>{control.owner || '-'}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      control.status === 'Active' ? 'default' :
                      control.status === 'Draft' ? 'secondary' :
                      'outline'
                    }
                  >
                    {control.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(control)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(control)}
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

      <ControlForm
        open={isFormOpen}
        onOpenChange={handleFormClose}
        control={editingControl}
        defaultRiskId={riskId}
      />

      <AlertDialog open={deleteDialog.open} onOpenChange={(open: boolean) => setDeleteDialog({ open, control: undefined })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Control</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteDialog.control?.control_name}"? This action cannot be undone and may affect related tests and evidence.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteControl.isPending}
            >
              {deleteControl.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}