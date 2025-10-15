import { useState } from 'react'
import {
  useMyAssignments,
  useOverdueAssignments,
  useCompleteAssignment,
  useDeleteAssignment,
  type Assignment
} from '@/hooks/use-notifications'
import { AssignmentForm } from './assignment-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  User,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  MoreHorizontal,
  Edit,
  Trash2,
  ExternalLink,
  Plus
} from 'lucide-react'
import { cn } from '@/lib/utils'

export function AssignmentList() {
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [assignmentToDelete, setAssignmentToDelete] = useState<Assignment | null>(null)

  const { data: myAssignments, isLoading: myAssignmentsLoading } = useMyAssignments()
  const { data: overdueAssignments, isLoading: overdueLoading } = useOverdueAssignments()
  const completeAssignment = useCompleteAssignment()
  const deleteAssignment = useDeleteAssignment()

  const handleCompleteAssignment = async (assignment: Assignment) => {
    try {
      await completeAssignment.mutateAsync(assignment.id)
    } catch (error) {
      console.error('Failed to complete assignment:', error)
    }
  }

  const handleDeleteAssignment = async () => {
    if (!assignmentToDelete) return

    try {
      await deleteAssignment.mutateAsync(assignmentToDelete.id)
      setDeleteDialogOpen(false)
      setAssignmentToDelete(null)
    } catch (error) {
      console.error('Failed to delete assignment:', error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const isOverdue = (assignment: Assignment) => {
    if (!assignment.due_date || assignment.completed_at) return false
    return new Date(assignment.due_date) < new Date()
  }

  const getDaysUntilDue = (assignment: Assignment) => {
    if (!assignment.due_date || assignment.completed_at) return null

    const dueDate = new Date(assignment.due_date)
    const today = new Date()
    const diffTime = dueDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    return diffDays
  }

  const getPriorityColor = (priority: Assignment['priority']) => {
    switch (priority) {
      case 'urgent': return 'destructive'
      case 'high': return 'default'
      case 'medium': return 'secondary'
      case 'low': return 'outline'
      default: return 'outline'
    }
  }

  const getRoleColor = (role: Assignment['role']) => {
    switch (role) {
      case 'owner': return 'bg-blue-100 text-blue-800'
      case 'reviewer': return 'bg-green-100 text-green-800'
      case 'approver': return 'bg-purple-100 text-purple-800'
      case 'collaborator': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getEntityIcon = (entityType: Assignment['entity_type']) => {
    switch (entityType) {
      case 'test': return <CheckCircle className="h-4 w-4" />
      case 'issue': return <AlertTriangle className="h-4 w-4" />
      case 'control': return <User className="h-4 w-4" />
      case 'review': return <Clock className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const renderAssignmentTable = (assignments: Assignment[], loading: boolean) => {
    if (loading) {
      return (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse p-4 border rounded-lg">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      )
    }

    if (!assignments || assignments.length === 0) {
      return (
        <div className="text-center py-8">
          <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No assignments</h3>
          <p className="text-muted-foreground">
            You don't have any assignments in this category.
          </p>
        </div>
      )
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Entity</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {assignments.map((assignment) => {
            const daysUntilDue = getDaysUntilDue(assignment)
            const overdue = isOverdue(assignment)

            return (
              <TableRow key={assignment.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    {getEntityIcon(assignment.entity_type)}
                    <div>
                      <div className="font-medium">
                        {assignment.entity?.title || `${assignment.entity_type} #${assignment.entity_id.slice(0, 8)}`}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {assignment.entity_type} • {assignment.entity?.type}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={getRoleColor(assignment.role)}>
                    {assignment.role}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={getPriorityColor(assignment.priority)}>
                    {assignment.priority}
                  </Badge>
                </TableCell>
                <TableCell>
                  {assignment.due_date ? (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className={cn(overdue && 'text-red-600 font-medium')}>
                        {formatDate(assignment.due_date)}
                      </span>
                      {daysUntilDue !== null && (
                        <Badge variant={overdue ? 'destructive' : daysUntilDue <= 3 ? 'default' : 'secondary'}>
                          {overdue
                            ? `${Math.abs(daysUntilDue)} days overdue`
                            : daysUntilDue === 0
                            ? 'Due today'
                            : `${daysUntilDue} days left`
                          }
                        </Badge>
                      )}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">No due date</span>
                  )}
                </TableCell>
                <TableCell>
                  {assignment.completed_at ? (
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Completed
                    </Badge>
                  ) : overdue ? (
                    <Badge variant="destructive">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Overdue
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <Clock className="h-3 w-3 mr-1" />
                      Pending
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      {!assignment.completed_at && (
                        <DropdownMenuItem onClick={() => handleCompleteAssignment(assignment)}>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Mark Complete
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedAssignment(assignment)
                          setFormOpen(true)
                        }}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => {
                          setAssignmentToDelete(assignment)
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
            )
          })}
        </TableBody>
      </Table>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">My Assignments</h2>
          <p className="text-muted-foreground">
            Track your assigned tasks and responsibilities
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Assignment
        </Button>
      </div>

      <Tabs defaultValue="my-assignments" className="space-y-6">
        <TabsList>
          <TabsTrigger value="my-assignments" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            My Assignments
            {myAssignments && myAssignments.length > 0 && (
              <Badge variant="secondary">{myAssignments.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="overdue" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Overdue
            {overdueAssignments && overdueAssignments.length > 0 && (
              <Badge variant="destructive">{overdueAssignments.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="my-assignments">
          <Card>
            <CardHeader>
              <CardTitle>Current Assignments</CardTitle>
              <CardDescription>
                All assignments currently assigned to you
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderAssignmentTable(myAssignments || [], myAssignmentsLoading)}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overdue">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                Overdue Assignments
              </CardTitle>
              <CardDescription>
                Assignments that have passed their due date and need immediate attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderAssignmentTable(overdueAssignments || [], overdueLoading)}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Assignment Form Modal */}
      <AssignmentForm
        assignment={selectedAssignment || undefined}
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) setSelectedAssignment(null)
        }}
        onSuccess={() => {
          setFormOpen(false)
          setSelectedAssignment(null)
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Assignment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this assignment? This action cannot be undone
              and will remove the assignment permanently.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAssignment}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Assignment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}