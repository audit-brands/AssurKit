import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCreateReview, useUpdateReview, type Review } from '@/hooks/use-reviews'
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
import { CalendarIcon, Plus, X, ClipboardCheck, User } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

const reviewFormSchema = z.object({
  entity_type: z.enum(['test', 'issue', 'control', 'evidence']),
  entity_id: z.string().min(1, 'Entity is required'),
  review_type: z.enum(['approval', 'validation', 'quality_check', 'compliance_review']),
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  assigned_to_user_id: z.string().min(1, 'Reviewer is required'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  required_approval_level: z.number().min(1).max(5),
  due_date: z.string().optional(),
  review_criteria: z.array(z.string()).min(1, 'At least one criterion is required'),
})

type ReviewFormValues = z.infer<typeof reviewFormSchema>

interface ReviewFormProps {
  review?: Review
  entityType?: 'test' | 'issue' | 'control' | 'evidence'
  entityId?: string
  entityTitle?: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function ReviewForm({
  review,
  entityType,
  entityId,
  entityTitle,
  open,
  onOpenChange,
  onSuccess
}: ReviewFormProps) {
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [newCriterion, setNewCriterion] = useState('')

  const { data: users } = useUsers()
  const createReview = useCreateReview()
  const updateReview = useUpdateReview()

  const form = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: {
      entity_type: review?.entity_type || entityType || 'test',
      entity_id: review?.entity_id || entityId || '',
      review_type: review?.review_type || 'approval',
      title: review?.title || '',
      description: review?.description || '',
      assigned_to_user_id: review?.assigned_to_user_id || '',
      priority: review?.priority || 'medium',
      required_approval_level: review?.required_approval_level || 1,
      due_date: review?.due_date || '',
      review_criteria: review?.review_criteria || [],
    },
  })

  const isEditing = !!review
  const watchedCriteria = form.watch('review_criteria')

  const onSubmit = async (values: ReviewFormValues) => {
    try {
      const reviewData = {
        ...values,
        due_date: selectedDate ? selectedDate.toISOString().split('T')[0] : values.due_date || null,
        requested_by_user_id: 'current-user', // This would come from auth context
        approval_level: 0,
        approval_chain: [], // Will be set up by backend based on required_approval_level
        comments: [],
        attachments: [],
        decision: null,
        decision_reason: null,
        requested_at: new Date().toISOString(),
        reviewed_at: null,
        completed_at: null,
        reviewed_by_user_id: null,
        status: 'pending' as const,
      }

      if (isEditing) {
        await updateReview.mutateAsync({
          id: review.id,
          ...reviewData,
        })
      } else {
        await createReview.mutateAsync(reviewData)
      }

      onOpenChange(false)
      onSuccess?.()
      form.reset()
      setSelectedDate(undefined)
      setNewCriterion('')
    } catch (error) {
      console.error('Failed to save review:', error)
    }
  }

  const handleCancel = () => {
    onOpenChange(false)
    form.reset()
    setSelectedDate(undefined)
    setNewCriterion('')
  }

  const handleAddCriterion = () => {
    if (newCriterion.trim()) {
      const currentCriteria = form.getValues('review_criteria')
      form.setValue('review_criteria', [...currentCriteria, newCriterion.trim()])
      setNewCriterion('')
    }
  }

  const handleRemoveCriterion = (index: number) => {
    const currentCriteria = form.getValues('review_criteria')
    form.setValue('review_criteria', currentCriteria.filter((_, i) => i !== index))
  }

  const getReviewTypeDescription = (type: string) => {
    switch (type) {
      case 'approval': return 'Requires formal approval before proceeding'
      case 'validation': return 'Validates accuracy and completeness'
      case 'quality_check': return 'Reviews for quality standards compliance'
      case 'compliance_review': return 'Ensures regulatory compliance requirements'
      default: return ''
    }
  }


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5" />
            {isEditing ? 'Edit Review' : 'Create Review'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update review details and requirements.'
              : 'Set up a new review and approval process.'
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
                        <SelectItem value="evidence">Evidence</SelectItem>
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
              name="review_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Review Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select review type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="approval">Approval</SelectItem>
                      <SelectItem value="validation">Validation</SelectItem>
                      <SelectItem value="quality_check">Quality Check</SelectItem>
                      <SelectItem value="compliance_review">Compliance Review</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {getReviewTypeDescription(form.watch('review_type'))}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Review Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter review title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe what needs to be reviewed and any specific requirements..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="assigned_to_user_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reviewer</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select reviewer" />
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

            <div className="grid grid-cols-3 gap-4">
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
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="required_approval_level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Approval Levels</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select levels" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1">1 Level</SelectItem>
                        <SelectItem value="2">2 Levels</SelectItem>
                        <SelectItem value="3">3 Levels</SelectItem>
                        <SelectItem value="4">4 Levels</SelectItem>
                        <SelectItem value="5">5 Levels</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Number of approval levels required
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="due_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Due Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'pl-3 text-left font-normal',
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
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="review_criteria"
              render={() => (
                <FormItem>
                  <FormLabel>Review Criteria</FormLabel>
                  <FormDescription>
                    Define specific criteria that must be evaluated during the review
                  </FormDescription>

                  <div className="space-y-3">
                    {/* Add new criterion */}
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add review criterion..."
                        value={newCriterion}
                        onChange={(e) => setNewCriterion(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleAddCriterion()
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAddCriterion}
                        disabled={!newCriterion.trim()}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Display criteria */}
                    {watchedCriteria.length > 0 && (
                      <div className="space-y-2">
                        {watchedCriteria.map((criterion, index) => (
                          <div key={index} className="flex items-center justify-between p-2 border rounded-md">
                            <span className="text-sm">{criterion}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveCriterion(index)}
                              className="h-6 w-6 p-0"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

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
                disabled={createReview.isPending || updateReview.isPending}
              >
                {createReview.isPending || updateReview.isPending
                  ? 'Saving...'
                  : isEditing
                  ? 'Update Review'
                  : 'Create Review'
                }
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}