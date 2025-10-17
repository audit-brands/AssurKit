import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
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
import { useControls, useDeleteControl } from '@/hooks/use-controls'
import { useDebouncedValue } from '@/hooks/use-debounce'
import { PaginationControls } from '@/components/pagination/pagination-controls'
import { DEFAULT_PAGE_SIZE } from '@/lib/pagination'
import { Edit, Trash2, Plus, Shield, Key, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ControlTableProps {
  riskId?: string
}

const getControlTypeColor = (type: string) => {
  switch (type) {
    case 'Preventive':
      return 'bg-blue-500'
    case 'Detective':
      return 'bg-yellow-500'
    case 'Corrective':
      return 'bg-orange-500'
    default:
      return 'bg-gray-500'
  }
}

const getAutomationIcon = (automation: string) => {
  switch (automation) {
    case 'Automated':
      return '🤖'
    case 'Semi-Automated':
      return '⚙️'
    case 'Manual':
      return '👤'
    default:
      return ''
  }
}

export function ControlTable({ riskId }: ControlTableProps) {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingControlId, setEditingControlId] = useState<string | undefined>(undefined)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; controlId?: string; controlName?: string }>({
    open: false,
  })
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [search, setSearch] = useState('')
  const [showKeyOnly, setShowKeyOnly] = useState(false)

  const debouncedSearch = useDebouncedValue(search, 400)

  // Track previous riskId to reset page when it changes
  const prevRiskIdRef = useRef(riskId)
  if (prevRiskIdRef.current !== riskId) {
    prevRiskIdRef.current = riskId
    if (page !== 1) {
      setPage(1)
    }
  }

  const { data, isLoading, isFetching, error } = useControls({
    page,
    limit: pageSize,
    search: debouncedSearch || undefined,
    riskId,
    isKeyControl: showKeyOnly ? true : undefined,
  })

  const deleteControl = useDeleteControl()

  const controls = useMemo(() => data?.items ?? [], [data])
  const pagination = data?.pagination

  const handleEdit = (controlId: string) => {
    setEditingControlId(controlId)
    setIsFormOpen(true)
  }

  const handleDelete = (controlId: string, controlName: string) => {
    setDeleteDialog({ open: true, controlId, controlName })
  }

  const confirmDelete = async () => {
    if (!deleteDialog.controlId) return
    try {
      await deleteControl.mutateAsync(deleteDialog.controlId)
      setDeleteDialog({ open: false })
    } catch (err) {
      console.error('Failed to delete control:', err)
    }
  }

  const handleFormClose = () => {
    setIsFormOpen(false)
    setEditingControlId(undefined)
  }

  const handlePageChange = (newPage: number) => {
    if (!pagination) return
    if (newPage < 1 || newPage > pagination.pages) return
    setPage(newPage)
  }

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize)
    setPage(1)
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-2xl font-bold">
            <Shield className="h-6 w-6" />
            Controls
          </h2>
          <Button disabled>
            <Plus className="mr-2 h-4 w-4" />
            Add Control
          </Button>
        </div>
        <div className="flex h-32 items-center justify-center">
          <p className="text-muted-foreground">Loading controls...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-2xl font-bold">
            <Shield className="h-6 w-6" />
            Controls
          </h2>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Control
          </Button>
        </div>
        <div className="flex h-32 items-center justify-center">
          <p className="text-red-600">Error loading controls. Please try again.</p>
        </div>
      </div>
    )
  }

  const showEmptyState = !controls.length && !debouncedSearch && !showKeyOnly
  const showNoResults = !controls.length && (debouncedSearch || showKeyOnly)

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h2 className="flex items-center gap-2 text-2xl font-bold">
          <Shield className="h-6 w-6" />
          Controls
        </h2>
        <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row md:items-center">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Search controls"
              className="w-full md:w-[240px]"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <Checkbox
              checked={showKeyOnly}
              onCheckedChange={(checked) => {
                setShowKeyOnly(Boolean(checked))
                setPage(1)
              }}
            />
            Key controls only
          </label>
          <Button onClick={() => setIsFormOpen(true)} className="md:ml-2">
            <Plus className="mr-2 h-4 w-4" />
            Add Control
          </Button>
        </div>
      </div>

      {showEmptyState ? (
        <div className="flex h-32 flex-col items-center justify-center space-y-2">
          <p className="text-muted-foreground">No controls found.</p>
          <Button onClick={() => setIsFormOpen(true)} size="sm">
            Create your first control
          </Button>
        </div>
      ) : showNoResults ? (
        <div className="flex h-32 items-center justify-center">
          <p className="text-muted-foreground">No controls match your search or filters.</p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Control ID</TableHead>
                <TableHead>Control Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Automation</TableHead>
                <TableHead>Key</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Risks</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {controls.map((control) => (
                <TableRow key={control.id}>
                  <TableCell className="font-mono text-sm">{control.business_id || '—'}</TableCell>
                  <TableCell className="font-medium">{control.control_name}</TableCell>
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
                    {control.key_control && <Key className="h-4 w-4 text-yellow-600" />}
                  </TableCell>
                  <TableCell>{control.owner || '—'}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        control.status === 'Active'
                          ? 'default'
                          : control.status === 'Draft'
                            ? 'secondary'
                            : 'outline'
                      }
                    >
                      {control.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{control.risk_count}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(control.id)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(control.id, control.control_name)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <PaginationControls
            pagination={pagination}
            onPageChange={handlePageChange}
            pageSize={pageSize}
            onPageSizeChange={handlePageSizeChange}
            isLoading={isFetching}
          />
        </div>
      )}

      <ControlForm
        open={isFormOpen}
        onOpenChange={handleFormClose}
        controlId={editingControlId}
        defaultRiskId={riskId}
      />

      <AlertDialog open={deleteDialog.open} onOpenChange={(open: boolean) => setDeleteDialog({ open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Control</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteDialog.controlName
                ? `Are you sure you want to delete "${deleteDialog.controlName}"? This action cannot be undone and will remove risk associations.`
                : 'Are you sure you want to delete this control?'}
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
