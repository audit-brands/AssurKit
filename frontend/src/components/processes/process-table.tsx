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
import { ProcessForm } from './process-form'
import { useProcesses, useDeleteProcess, type Process } from '@/hooks/use-processes'
import { useCompanies } from '@/hooks/use-companies'
import { Edit, Trash2, Plus } from 'lucide-react'

interface ProcessTableProps {
  companyId?: string
}

export function ProcessTable({ companyId }: ProcessTableProps) {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingProcess, setEditingProcess] = useState<Process | undefined>()
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; process?: Process }>({
    open: false,
    process: undefined
  })

  const { data: processes, isLoading, error } = useProcesses()
  const { data: companies } = useCompanies()
  const deleteProcess = useDeleteProcess()

  // Filter processes by company if companyId is provided
  const filteredProcesses = processes?.filter(process =>
    companyId ? process.company_id === companyId : true
  )

  // Get company name helper function
  const getCompanyName = (companyId: string) => {
    return companies?.find(company => company.id === companyId)?.company_name || 'Unknown Company'
  }

  const handleEdit = (process: Process) => {
    setEditingProcess(process)
    setIsFormOpen(true)
  }

  const handleDelete = (process: Process) => {
    setDeleteDialog({ open: true, process })
  }

  const confirmDelete = async () => {
    if (deleteDialog.process) {
      try {
        await deleteProcess.mutateAsync(deleteDialog.process.id)
        setDeleteDialog({ open: false, process: undefined })
      } catch (error) {
        console.error('Failed to delete process:', error)
      }
    }
  }

  const handleFormClose = () => {
    setIsFormOpen(false)
    setEditingProcess(undefined)
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Processes</h2>
          <Button disabled>
            <Plus className="mr-2 h-4 w-4" />
            Add Process
          </Button>
        </div>
        <div className="flex items-center justify-center h-32">
          <p className="text-muted-foreground">Loading processes...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Processes</h2>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Process
          </Button>
        </div>
        <div className="flex items-center justify-center h-32">
          <p className="text-red-600">Error loading processes. Please try again.</p>
        </div>
      </div>
    )
  }

  if (!filteredProcesses || filteredProcesses.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Processes</h2>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Process
          </Button>
        </div>
        <div className="flex flex-col items-center justify-center h-32 space-y-2">
          <p className="text-muted-foreground">No processes found.</p>
          <Button onClick={() => setIsFormOpen(true)} size="sm">
            Create your first process
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Processes</h2>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Process
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Process Name</TableHead>
              {!companyId && <TableHead>Company</TableHead>}
              <TableHead>Owner</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProcesses.map((process) => (
              <TableRow key={process.id}>
                <TableCell className="font-medium">{process.process_name}</TableCell>
                {!companyId && (
                  <TableCell>{getCompanyName(process.company_id)}</TableCell>
                )}
                <TableCell>{process.owner || '-'}</TableCell>
                <TableCell className="max-w-xs truncate">
                  {process.description || '-'}
                </TableCell>
                <TableCell>
                  <Badge variant={process.status === 'Active' ? 'default' : 'secondary'}>
                    {process.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {new Date(process.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(process)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(process)}
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

      <ProcessForm
        open={isFormOpen}
        onOpenChange={handleFormClose}
        process={editingProcess}
        defaultCompanyId={companyId}
      />

      <AlertDialog open={deleteDialog.open} onOpenChange={(open: boolean) => setDeleteDialog({ open, process: undefined })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Process</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteDialog.process?.process_name}"? This action cannot be undone and may affect related subprocesses, risks, and controls.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteProcess.isPending}
            >
              {deleteProcess.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}