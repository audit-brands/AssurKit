import { useState } from 'react'
import { useIssues, useDeleteIssue, useBulkDeleteIssues, useBulkUpdateIssues, useResolveIssue, type Issue, getIssueSeverityColor, getIssueStatusColor, getIssueTypeColor, isIssueOverdue } from '@/hooks/use-issues'
import { IssueForm } from './issue-form'
import { IssueDetails } from './issue-details'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import {
  AlertTriangle,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  Calendar,
  User,
  Clock,
  CheckCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface IssueListProps {
  filters: {
    control_id?: string
    test_execution_id?: string
    severity?: string
    status?: string
    issue_type?: string
    assigned_to?: string
    created_by?: string
    tags?: string[]
    search?: string
    overdue_only?: boolean
  }
}

export function IssueList({ filters }: IssueListProps) {
  const [page, setPage] = useState(1)
  const [selectedIssues, setSelectedIssues] = useState<string[]>([])
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [issueToDelete, setIssueToDelete] = useState<string | null>(null)
  const [bulkAction, setBulkAction] = useState<'delete' | 'update' | null>(null)
  const [bulkUpdateData, setBulkUpdateData] = useState({
    status: '',
    severity: '',
    assigned_to: ''
  })
  const [editingIssue, setEditingIssue] = useState<Issue | null>(null)
  const [viewingIssue, setViewingIssue] = useState<Issue | null>(null)
  const [editFormOpen, setEditFormOpen] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)

  const limit = 20
  const { data: issuesData, isLoading, error } = useIssues(page, limit, filters)
  const deleteIssue = useDeleteIssue()
  const bulkDeleteIssues = useBulkDeleteIssues()
  const bulkUpdateIssues = useBulkUpdateIssues()
  const resolveIssue = useResolveIssue()

  const issues = issuesData?.items || []
  const totalPages = issuesData?.total_pages || 1

  const handleSelectIssue = (issueId: string, checked: boolean) => {
    if (checked) {
      setSelectedIssues(prev => [...prev, issueId])
    } else {
      setSelectedIssues(prev => prev.filter(id => id !== issueId))
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIssues(issues.map(i => i.id))
    } else {
      setSelectedIssues([])
    }
  }

  const handleDeleteIssue = async (id: string) => {
    try {
      await deleteIssue.mutateAsync(id)
      setIssueToDelete(null)
      setDeleteDialogOpen(false)
    } catch (error) {
      console.error('Failed to delete issue:', error)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIssues.length === 0) return

    try {
      await bulkDeleteIssues.mutateAsync(selectedIssues)
      setSelectedIssues([])
      setBulkAction(null)
    } catch (error) {
      console.error('Failed to bulk delete issues:', error)
    }
  }

  const handleBulkUpdate = async () => {
    if (selectedIssues.length === 0) return

    try {
      const updates: Partial<Pick<Issue, 'status' | 'severity' | 'assigned_to'>> = {}
      if (bulkUpdateData.status) {
        updates.status = bulkUpdateData.status as Issue['status']
      }
      if (bulkUpdateData.severity) {
        updates.severity = bulkUpdateData.severity as Issue['severity']
      }
      if (bulkUpdateData.assigned_to) {
        updates.assigned_to = bulkUpdateData.assigned_to
      }

      await bulkUpdateIssues.mutateAsync({
        issue_ids: selectedIssues,
        updates
      })
      setSelectedIssues([])
      setBulkAction(null)
      setBulkUpdateData({ status: '', severity: '', assigned_to: '' })
    } catch (error) {
      console.error('Failed to bulk update issues:', error)
    }
  }

  const handleResolveIssue = async (issue: Issue) => {
    try {
      await resolveIssue.mutateAsync({
        id: issue.id,
        actual_resolution_date: new Date().toISOString()
      })
    } catch (error) {
      console.error('Failed to resolve issue:', error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getOverdueIndicator = (issue: Issue) => {
    if (isIssueOverdue(issue)) {
      return (
        <Badge variant="destructive" className="text-xs">
          <Clock className="h-3 w-3 mr-1" />
          Overdue
        </Badge>
      )
    }
    return null
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-red-600">Failed to load issues. Please try again.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Bulk Actions */}
      {selectedIssues.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {selectedIssues.length} issue{selectedIssues.length !== 1 ? 's' : ''} selected
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setBulkAction('update')}
                >
                  Bulk Update
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setBulkAction('delete')}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Selected
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedIssues([])}
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Issues Table */}
      <Card>
        <CardHeader>
          <CardTitle>Issues</CardTitle>
          <CardDescription>
            Manage control testing exceptions and remediation activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedIssues.length === issues.length && issues.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Issue</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {issues.map((issue) => (
                <TableRow key={issue.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIssues.includes(issue.id)}
                      onCheckedChange={(checked) => handleSelectIssue(issue.id, checked as boolean)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setViewingIssue(issue)
                            setDetailsOpen(true)
                          }}
                          className="font-medium hover:underline text-left"
                        >
                          {issue.title}
                        </button>
                        {getOverdueIndicator(issue)}
                      </div>
                      <p className="text-xs text-muted-foreground truncate max-w-md">
                        {issue.description}
                      </p>
                      {issue.tags.length > 0 && (
                        <div className="flex gap-1">
                          {issue.tags.slice(0, 2).map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {issue.tags.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{issue.tags.length - 2}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn('text-xs', getIssueSeverityColor(issue.severity))}>
                      {issue.severity}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn('text-xs', getIssueTypeColor(issue.issue_type))}>
                      {issue.issue_type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn('text-xs', getIssueStatusColor(issue.status))}>
                      {issue.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {issue.assigned_to ? (
                      <div className="flex items-center gap-1 text-sm">
                        <User className="h-3 w-3" />
                        {issue.assigned_to}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {issue.target_resolution_date ? (
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3" />
                        {formatDate(issue.target_resolution_date)}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">No due date</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => {
                            setViewingIssue(issue)
                            setDetailsOpen(true)
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setEditingIssue(issue)
                            setEditFormOpen(true)
                          }}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        {issue.status !== 'Closed' && (
                          <DropdownMenuItem
                            onClick={() => handleResolveIssue(issue)}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Mark Resolved
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => {
                            setIssueToDelete(issue.id)
                            setDeleteDialogOpen(true)
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {issues.length === 0 && (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No issues found</h3>
              <p className="text-muted-foreground">
                {Object.keys(filters).length > 0
                  ? 'No issues match your current filters.'
                  : 'No issues have been reported yet.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages} ({issuesData?.total || 0} total items)
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Issue</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this issue? This action cannot be undone
              and will permanently remove the issue and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => issueToDelete && handleDeleteIssue(issueToDelete)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Dialog */}
      <AlertDialog open={bulkAction === 'delete'} onOpenChange={() => setBulkAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Selected Issues</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedIssues.length} issue
              {selectedIssues.length !== 1 ? 's' : ''}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Update Dialog */}
      <AlertDialog open={bulkAction === 'update'} onOpenChange={() => setBulkAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Update Selected Issues</AlertDialogTitle>
            <AlertDialogDescription>
              Update properties for {selectedIssues.length} selected issue
              {selectedIssues.length !== 1 ? 's' : ''}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Status</label>
              <Select
                value={bulkUpdateData.status}
                onValueChange={(value) => setBulkUpdateData(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No change</SelectItem>
                  <SelectItem value="Open">Open</SelectItem>
                  <SelectItem value="In Remediation">In Remediation</SelectItem>
                  <SelectItem value="Ready for Retest">Ready for Retest</SelectItem>
                  <SelectItem value="Closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Severity</label>
              <Select
                value={bulkUpdateData.severity}
                onValueChange={(value) => setBulkUpdateData(prev => ({ ...prev, severity: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No change</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkUpdate}>
              Update All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Issue Form */}
      <IssueForm
        open={editFormOpen}
        onOpenChange={(open) => {
          setEditFormOpen(open)
          if (!open) setEditingIssue(null)
        }}
        issue={editingIssue || undefined}
      />

      {/* Issue Details Modal */}
      <IssueDetails
        open={detailsOpen}
        onOpenChange={(open) => {
          setDetailsOpen(open)
          if (!open) setViewingIssue(null)
        }}
        issue={viewingIssue}
      />
    </div>
  )
}