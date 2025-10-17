import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCreateIssue, useUpdateIssue, type Issue, type IssueCreate, type IssueUpdate } from '@/hooks/use-issues'
import { useControls } from '@/hooks/use-controls'
import { useTestExecutions } from '@/hooks/use-tests'
import { useUsers } from '@/hooks/use-users'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
  AlertTriangle,
  Tag
} from 'lucide-react'

const issueSchema = z.object({
  control_id: z.string().min(1, 'Control is required'),
  test_execution_id: z.string().optional(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  severity: z.enum(['Low', 'Medium', 'High', 'Critical']),
  issue_type: z.enum(['Exception', 'Deficiency', 'Observation', 'Recommendation']),
  root_cause: z.string().optional(),
  business_impact: z.string().optional(),
  remediation_plan: z.string().optional(),
  remediation_owner: z.string().optional(),
  target_resolution_date: z.string().optional(),
  retest_required: z.boolean().default(false),
  assigned_to: z.string().optional(),
  tags: z.array(z.string()).default([])
})

type IssueFormData = z.infer<typeof issueSchema>

interface IssueFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  issue?: Issue
  preselectedControlId?: string
  preselectedTestExecutionId?: string
}

export function IssueForm({
  open,
  onOpenChange,
  issue,
  preselectedControlId,
  preselectedTestExecutionId
}: IssueFormProps) {
  const [tagInput, setTagInput] = useState('')
  const isEditing = !!issue

  const { data: controlsData } = useControls({ limit: 100 })
  const controls = controlsData?.items ?? []
  const { data: testExecutions } = useTestExecutions()
  const { data: users } = useUsers()

  const createIssue = useCreateIssue()
  const updateIssue = useUpdateIssue()

  const form = useForm<IssueFormData>({
    resolver: zodResolver(issueSchema),
    defaultValues: {
      control_id: preselectedControlId || '',
      test_execution_id: preselectedTestExecutionId || '',
      title: '',
      description: '',
      severity: 'Medium',
      issue_type: 'Exception',
      root_cause: '',
      business_impact: '',
      remediation_plan: '',
      remediation_owner: '',
      target_resolution_date: '',
      retest_required: false,
      assigned_to: '',
      tags: []
    }
  })

  // Update form when issue prop changes
  useEffect(() => {
    if (issue) {
      form.reset({
        control_id: issue.control_id,
        test_execution_id: issue.test_execution_id || '',
        title: issue.title,
        description: issue.description,
        severity: issue.severity,
        issue_type: issue.issue_type,
        root_cause: issue.root_cause || '',
        business_impact: issue.business_impact || '',
        remediation_plan: issue.remediation_plan || '',
        remediation_owner: issue.remediation_owner || '',
        target_resolution_date: issue.target_resolution_date ?
          new Date(issue.target_resolution_date).toISOString().split('T')[0] : '',
        retest_required: issue.retest_required,
        assigned_to: issue.assigned_to || '',
        tags: issue.tags
      })
    } else {
      form.reset({
        control_id: preselectedControlId || '',
        test_execution_id: preselectedTestExecutionId || '',
        title: '',
        description: '',
        severity: 'Medium',
        issue_type: 'Exception',
        root_cause: '',
        business_impact: '',
        remediation_plan: '',
        remediation_owner: '',
        target_resolution_date: '',
        retest_required: false,
        assigned_to: '',
        tags: []
      })
    }
  }, [issue, preselectedControlId, preselectedTestExecutionId, form])

  const onSubmit = async (data: IssueFormData) => {
    try {
      if (isEditing && issue) {
        const updateData: IssueUpdate = {
          title: data.title,
          description: data.description,
          severity: data.severity,
          issue_type: data.issue_type,
          root_cause: data.root_cause || undefined,
          business_impact: data.business_impact || undefined,
          remediation_plan: data.remediation_plan || undefined,
          remediation_owner: data.remediation_owner || undefined,
          target_resolution_date: data.target_resolution_date || undefined,
          retest_required: data.retest_required,
          assigned_to: data.assigned_to || undefined,
          tags: data.tags
        }
        await updateIssue.mutateAsync({ id: issue.id, ...updateData })
      } else {
        const createData: IssueCreate = {
          control_id: data.control_id,
          test_execution_id: data.test_execution_id || undefined,
          title: data.title,
          description: data.description,
          severity: data.severity,
          issue_type: data.issue_type,
          root_cause: data.root_cause || undefined,
          business_impact: data.business_impact || undefined,
          remediation_plan: data.remediation_plan || undefined,
          remediation_owner: data.remediation_owner || undefined,
          target_resolution_date: data.target_resolution_date || undefined,
          retest_required: data.retest_required,
          assigned_to: data.assigned_to || undefined,
          tags: data.tags
        }
        await createIssue.mutateAsync(createData)
      }
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to save issue:', error)
    }
  }

  const addTag = () => {
    if (tagInput.trim() && !form.getValues('tags').includes(tagInput.trim())) {
      const currentTags = form.getValues('tags')
      form.setValue('tags', [...currentTags, tagInput.trim()])
      setTagInput('')
    }
  }

  const removeTag = (tag: string) => {
    const currentTags = form.getValues('tags')
    form.setValue('tags', currentTags.filter(t => t !== tag))
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Critical': return 'text-red-600'
      case 'High': return 'text-orange-600'
      case 'Medium': return 'text-yellow-600'
      case 'Low': return 'text-blue-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            {isEditing ? 'Edit Issue' : 'Create New Issue'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update issue details and remediation plan.'
              : 'Document a new control testing exception or deficiency.'
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="control_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Control *</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange} disabled={isEditing}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select control" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {controls?.map(control => (
                            <SelectItem key={control.id} value={control.id}>
                              {control.control_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="test_execution_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Test Execution</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select test execution" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">None</SelectItem>
                          {testExecutions?.map(execution => (
                            <SelectItem key={execution.id} value={execution.id}>
                              Test #{execution.id.slice(0, 8)} - {execution.tester}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title *</FormLabel>
                      <FormControl>
                        <Input placeholder="Brief description of the issue" {...field} />
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
                      <FormLabel>Description *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Detailed description of the issue"
                          rows={4}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="severity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Severity</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Low">
                              <span className={getSeverityColor('Low')}>Low</span>
                            </SelectItem>
                            <SelectItem value="Medium">
                              <span className={getSeverityColor('Medium')}>Medium</span>
                            </SelectItem>
                            <SelectItem value="High">
                              <span className={getSeverityColor('High')}>High</span>
                            </SelectItem>
                            <SelectItem value="Critical">
                              <span className={getSeverityColor('Critical')}>Critical</span>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="issue_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Exception">Exception</SelectItem>
                            <SelectItem value="Deficiency">Deficiency</SelectItem>
                            <SelectItem value="Observation">Observation</SelectItem>
                            <SelectItem value="Recommendation">Recommendation</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="root_cause"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Root Cause</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Identify the root cause of the issue"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="business_impact"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Impact</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe the potential business impact"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="remediation_plan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Remediation Plan</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Outline the plan to address this issue"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="remediation_owner"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Remediation Owner</FormLabel>
                        <FormControl>
                          <Input placeholder="Person responsible for remediation" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="assigned_to"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assigned To</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select assignee" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">Unassigned</SelectItem>
                            {users?.map(user => (
                              <SelectItem key={user.id} value={user.id}>
                                {user.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="target_resolution_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Resolution Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="retest_required"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Retest Required</FormLabel>
                        <FormDescription>
                          Check if retesting is required after remediation
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                {/* Tags */}
                <div>
                  <Label htmlFor="tags">Tags</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="tags"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      placeholder="Add tag"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    />
                    <Button type="button" onClick={addTag} variant="outline" size="sm">
                      <Tag className="h-4 w-4" />
                    </Button>
                  </div>
                  {form.watch('tags').length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {form.watch('tags').map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="ml-1 hover:text-red-600"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={createIssue.isPending || updateIssue.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createIssue.isPending || updateIssue.isPending}
              >
                {createIssue.isPending || updateIssue.isPending
                  ? 'Saving...'
                  : isEditing
                  ? 'Update Issue'
                  : 'Create Issue'
                }
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
