import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCreateAssignment, useUpdateAssignment, type Assignment } from '@/hooks/use-notifications'
import { useUsers } from '@/hooks/use-users'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { CalendarIcon, User, Clock, AlertTriangle } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

const assignmentFormSchema = z.object({
  entity_type: z.enum(['test', 'issue', 'control', 'review']),
  entity_id: z.string().min(1, 'Entity is required'),
  assigned_to_user_id: z.string().min(1, 'Assignee is required'),
  role: z.enum(['owner', 'reviewer', 'approver', 'collaborator']),
  due_date: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  instructions: z.string().optional(),
})

type AssignmentFormValues = z.infer<typeof assignmentFormSchema>

interface AssignmentFormProps {
  assignment?: Assignment
  entityType?: 'test' | 'issue' | 'control' | 'review'
  entityId?: string
  entityTitle?: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function AssignmentForm({
  assignment,
  entityType,
  entityId,
  entityTitle,
  open,
  onOpenChange,
  onSuccess
}: AssignmentFormProps) {
  const [selectedDate, setSelectedDate] = useState<Date>()

  const { data: users } = useUsers()
  const createAssignment = useCreateAssignment()
  const updateAssignment = useUpdateAssignment()

  const form = useForm<AssignmentFormValues>({
    resolver: zodResolver(assignmentFormSchema),
    defaultValues: {
      entity_type: assignment?.entity_type || entityType || 'test',
      entity_id: assignment?.entity_id || entityId || '',
      assigned_to_user_id: assignment?.assigned_to_user_id || '',
      role: assignment?.role || 'owner',
      due_date: assignment?.due_date || '',
      priority: assignment?.priority || 'medium',
      instructions: assignment?.instructions || '',
    },
  })

  const isEditing = !!assignment

  const onSubmit = async (values: AssignmentFormValues) => {
    try {
      const assignmentData = {
        ...values,
        due_date: selectedDate ? selectedDate.toISOString().split('T')[0] : values.due_date,
        assigned_by_user_id: 'current-user', // This would come from auth context
      }

      if (isEditing) {
        await updateAssignment.mutateAsync({
          id: assignment.id,
          ...assignmentData,
        })
      } else {
        await createAssignment.mutateAsync(assignmentData as Omit<Assignment, 'id' | 'created_at' | 'updated_at'>)
      }

      onOpenChange(false)
      onSuccess?.()
      form.reset()
      setSelectedDate(undefined)
    } catch (error) {
      console.error('Failed to save assignment:', error)
    }
  }

  const handleCancel = () => {
    onOpenChange(false)
    form.reset()
    setSelectedDate(undefined)
  }

  const getRoleDescription = (role: string) => {
    switch (role) {
      case 'owner': return 'Primary responsible party for completion'
      case 'reviewer': return 'Reviews and validates work quality'
      case 'approver': return 'Final approval authority'
      case 'collaborator': return 'Supports and assists with work'
      default: return ''
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return <AlertTriangle className="h-4 w-4 text-red-600" />
      case 'high': return <AlertTriangle className="h-4 w-4 text-orange-600" />
      case 'medium': return <Clock className="h-4 w-4 text-blue-600" />
      case 'low': return <Clock className="h-4 w-4 text-gray-600" />
      default: return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {isEditing ? 'Edit Assignment' : 'Create Assignment'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update assignment details and responsibilities.'
              : 'Assign tasks and responsibilities to team members.'
            }
            {entityTitle && (
              <div className="mt-2 p-2 bg-muted rounded-md">
                <span className="text-sm font-medium">Entity: </span>
                <span className="text-sm">{entityTitle}</span>
              </div>
            )}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="entity_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Entity Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={!!entityType}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="test">Test</SelectItem>
                        <SelectItem value="issue">Issue</SelectItem>
                        <SelectItem value="control">Control</SelectItem>
                        <SelectItem value="review">Review</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="entity_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Entity ID</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Entity identifier"
                        {...field}
                        disabled={!!entityId}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="assigned_to_user_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assignee</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select assignee" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {users?.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span>{user.name}</span>
                            <span className="text-muted-foreground">({user.email})</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="owner">Owner</SelectItem>
                        <SelectItem value="reviewer">Reviewer</SelectItem>
                        <SelectItem value="approver">Approver</SelectItem>
                        <SelectItem value="collaborator">Collaborator</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {getRoleDescription(form.watch('role'))}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">
                          <div className="flex items-center gap-2">
                            {getPriorityIcon('low')}
                            Low
                          </div>
                        </SelectItem>
                        <SelectItem value="medium">
                          <div className="flex items-center gap-2">
                            {getPriorityIcon('medium')}
                            Medium
                          </div>
                        </SelectItem>
                        <SelectItem value="high">
                          <div className="flex items-center gap-2">
                            {getPriorityIcon('high')}
                            High
                          </div>
                        </SelectItem>
                        <SelectItem value="urgent">
                          <div className="flex items-center gap-2">
                            {getPriorityIcon('urgent')}
                            Urgent
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="due_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Due Date (Optional)</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !selectedDate && !field.value && 'text-muted-foreground'
                          )}
                        >
                          {selectedDate ? (
                            format(selectedDate, 'PPP')
                          ) : field.value ? (
                            format(new Date(field.value), 'PPP')
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={selectedDate || (field.value ? new Date(field.value) : undefined)}
                        onSelect={(date) => {
                          setSelectedDate(date)
                          field.onChange(date ? date.toISOString().split('T')[0] : '')
                        }}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    When should this assignment be completed?
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="instructions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Instructions (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional instructions or context for the assignee..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Provide specific guidance or context for this assignment.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createAssignment.isPending || updateAssignment.isPending}
              >
                {createAssignment.isPending || updateAssignment.isPending
                  ? 'Saving...'
                  : isEditing
                  ? 'Update Assignment'
                  : 'Create Assignment'
                }
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}