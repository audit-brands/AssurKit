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
import { SubprocessForm } from './subprocess-form'
import { useSubprocesses, useDeleteSubprocess, type Subprocess } from '@/hooks/use-subprocesses'
import { useProcesses } from '@/hooks/use-processes'
import { useCompanies } from '@/hooks/use-companies'
import { Edit, Trash2, Plus } from 'lucide-react'

interface SubprocessTableProps {
  processId?: string
}

export function SubprocessTable({ processId }: SubprocessTableProps) {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingSubprocess, setEditingSubprocess] = useState<Subprocess | undefined>()
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; subprocess?: Subprocess }>({
    open: false,
    subprocess: undefined
  })

  const { data: subprocesses, isLoading, error } = useSubprocesses()
  const { data: processes } = useProcesses()
  const { data: companies } = useCompanies()
  const deleteSubprocess = useDeleteSubprocess()

  // Filter subprocesses by process if processId is provided
  const filteredSubprocesses = subprocesses?.filter(subprocess =>
    processId ? subprocess.process_id === processId : true
  )

  // Get process and company name helper functions
  const getProcessName = (processId: string) => {
    return processes?.find(process => process.id === processId)?.process_name || 'Unknown Process'
  }

  const getCompanyName = (processId: string) => {
    const process = processes?.find(p => p.id === processId)
    if (!process) return 'Unknown Company'
    return companies?.find(company => company.id === process.company_id)?.company_name || 'Unknown Company'
  }

  const handleEdit = (subprocess: Subprocess) => {
    setEditingSubprocess(subprocess)
    setIsFormOpen(true)
  }

  const handleDelete = (subprocess: Subprocess) => {
    setDeleteDialog({ open: true, subprocess })
  }

  const confirmDelete = async () => {
    if (deleteDialog.subprocess) {
      try {
        await deleteSubprocess.mutateAsync(deleteDialog.subprocess.id)
        setDeleteDialog({ open: false, subprocess: undefined })
      } catch (error) {
        console.error('Failed to delete subprocess:', error)
      }
    }
  }

  const handleFormClose = () => {
    setIsFormOpen(false)
    setEditingSubprocess(undefined)
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Subprocesses</h2>
          <Button disabled>
            <Plus className="mr-2 h-4 w-4" />
            Add Subprocess
          </Button>
        </div>
        <div className="flex items-center justify-center h-32">
          <p className="text-muted-foreground">Loading subprocesses...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Subprocesses</h2>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Subprocess
          </Button>
        </div>
        <div className="flex items-center justify-center h-32">
          <p className="text-red-600">Error loading subprocesses. Please try again.</p>
        </div>
      </div>
    )
  }

  if (!filteredSubprocesses || filteredSubprocesses.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Subprocesses</h2>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Subprocess
          </Button>
        </div>
        <div className="flex flex-col items-center justify-center h-32 space-y-2">
          <p className="text-muted-foreground">No subprocesses found.</p>
          <Button onClick={() => setIsFormOpen(true)} size="sm">
            Create your first subprocess
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Subprocesses</h2>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Subprocess
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Subprocess Name</TableHead>
              {!processId && <TableHead>Process</TableHead>}
              {!processId && <TableHead>Company</TableHead>}
              <TableHead>Owner</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSubprocesses.map((subprocess) => (
              <TableRow key={subprocess.id}>
                <TableCell className="font-medium">{subprocess.subprocess_name}</TableCell>
                {!processId && (
                  <TableCell>{getProcessName(subprocess.process_id)}</TableCell>
                )}
                {!processId && (
                  <TableCell>{getCompanyName(subprocess.process_id)}</TableCell>
                )}
                <TableCell>{subprocess.owner || '-'}</TableCell>
                <TableCell className="max-w-xs truncate">
                  {subprocess.description || '-'}
                </TableCell>
                <TableCell>
                  <Badge variant={subprocess.status === 'Active' ? 'default' : 'secondary'}>
                    {subprocess.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {new Date(subprocess.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(subprocess)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(subprocess)}
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

      <SubprocessForm
        open={isFormOpen}
        onOpenChange={handleFormClose}
        subprocess={editingSubprocess}
        defaultProcessId={processId}
      />

      <AlertDialog open={deleteDialog.open} onOpenChange={(open: boolean) => setDeleteDialog({ open, subprocess: undefined })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Subprocess</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteDialog.subprocess?.subprocess_name}"? This action cannot be undone and may affect related risks and controls.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteSubprocess.isPending}
            >
              {deleteSubprocess.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}