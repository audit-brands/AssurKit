import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Workflow,
  Plus,
  Edit,
  Save,
  RefreshCw,
  ArrowRight,
  Play,
  Circle,
  Users,
  Bell,
  Shield,
  AlertTriangle,
  FileText
} from 'lucide-react'

interface WorkflowState {
  id: string
  name: string
  display_name: string
  is_initial: boolean
  is_final: boolean
  required_permissions: string[]
  auto_actions: string[]
  color: string
}

interface WorkflowTransition {
  id: string
  from_state: string
  to_state: string
  trigger: 'manual' | 'automatic' | 'scheduled'
  conditions: string[]
  required_role: string
  required_permissions: string[]
  label: string
}

interface WorkflowConfiguration {
  id: string
  name: string
  description: string
  entity_type: 'test' | 'control' | 'issue' | 'evidence'
  states: WorkflowState[]
  transitions: WorkflowTransition[]
  is_active: boolean
  created_at: string
  updated_at: string
}

interface AutoAssignment {
  id: string
  workflow_id: string
  trigger: string
  assignee_type: 'user' | 'role' | 'group'
  assignee_id: string
  conditions: string[]
}

interface NotificationRule {
  id: string
  workflow_id: string
  trigger: string
  recipients: string[]
  template: string
  delay_minutes: number
  conditions: string[]
}

const workflowSchema = z.object({
  name: z.string().min(1, 'Workflow name is required'),
  description: z.string().min(1, 'Description is required'),
  entity_type: z.enum(['test', 'control', 'issue', 'evidence']),
  is_active: z.boolean()
})

const stateSchema = z.object({
  name: z.string().min(1, 'State name is required'),
  display_name: z.string().min(1, 'Display name is required'),
  is_initial: z.boolean(),
  is_final: z.boolean(),
  color: z.string().min(1, 'Color is required')
})

type WorkflowFormData = z.infer<typeof workflowSchema>
type StateFormData = z.infer<typeof stateSchema>

const STATE_COLORS = [
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Green', value: '#10b981' },
  { name: 'Yellow', value: '#f59e0b' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Gray', value: '#6b7280' }
]

export function WorkflowDesigner() {
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowConfiguration | null>(null)
  const [isWorkflowDialogOpen, setIsWorkflowDialogOpen] = useState(false)
  const [isStateDialogOpen, setIsStateDialogOpen] = useState(false)
  const [selectedState, setSelectedState] = useState<WorkflowState | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const queryClient = useQueryClient()

  const { data: workflows = [], isLoading } = useQuery({
    queryKey: ['admin-workflows'],
    queryFn: async (): Promise<WorkflowConfiguration[]> => {
      const response = await fetch('/api/admin/workflows')
      if (!response.ok) {
        throw new Error('Failed to fetch workflows')
      }
      return response.json()
    }
  })

  const { data: autoAssignments = [] } = useQuery({
    queryKey: ['admin-auto-assignments', selectedWorkflow?.id],
    queryFn: async (): Promise<AutoAssignment[]> => {
      if (!selectedWorkflow?.id) return []
      const response = await fetch(`/api/admin/workflows/${selectedWorkflow.id}/auto-assignments`)
      if (!response.ok) {
        throw new Error('Failed to fetch auto assignments')
      }
      return response.json()
    },
    enabled: !!selectedWorkflow?.id
  })

  const { data: notificationRules = [] } = useQuery({
    queryKey: ['admin-notification-rules', selectedWorkflow?.id],
    queryFn: async (): Promise<NotificationRule[]> => {
      if (!selectedWorkflow?.id) return []
      const response = await fetch(`/api/admin/workflows/${selectedWorkflow.id}/notifications`)
      if (!response.ok) {
        throw new Error('Failed to fetch notification rules')
      }
      return response.json()
    },
    enabled: !!selectedWorkflow?.id
  })

  const saveWorkflowMutation = useMutation({
    mutationFn: async (workflow: Partial<WorkflowConfiguration>) => {
      const url = workflow.id ? `/api/admin/workflows/${workflow.id}` : '/api/admin/workflows'
      const method = workflow.id ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workflow)
      })

      if (!response.ok) {
        throw new Error('Failed to save workflow')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-workflows'] })
      setIsWorkflowDialogOpen(false)
    }
  })

  const saveStateMutation = useMutation({
    mutationFn: async (state: Partial<WorkflowState>) => {
      if (!selectedWorkflow?.id) throw new Error('No workflow selected')

      const url = state.id
        ? `/api/admin/workflows/${selectedWorkflow.id}/states/${state.id}`
        : `/api/admin/workflows/${selectedWorkflow.id}/states`
      const method = state.id ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state)
      })

      if (!response.ok) {
        throw new Error('Failed to save state')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-workflows'] })
      setIsStateDialogOpen(false)
      setSelectedState(null)
    }
  })

  const workflowForm = useForm<WorkflowFormData>({
    resolver: zodResolver(workflowSchema),
    defaultValues: {
      name: '',
      description: '',
      entity_type: 'test',
      is_active: true
    }
  })

  const stateForm = useForm<StateFormData>({
    resolver: zodResolver(stateSchema),
    defaultValues: {
      name: '',
      display_name: '',
      is_initial: false,
      is_final: false,
      color: STATE_COLORS[0].value
    }
  })

  const onWorkflowSubmit = (data: WorkflowFormData) => {
    const workflowData = {
      ...data,
      id: selectedWorkflow?.id,
      states: selectedWorkflow?.states || [],
      transitions: selectedWorkflow?.transitions || []
    }
    saveWorkflowMutation.mutate(workflowData)
  }

  const onStateSubmit = (data: StateFormData) => {
    const stateData = {
      ...data,
      id: selectedState?.id,
      required_permissions: selectedState?.required_permissions || [],
      auto_actions: selectedState?.auto_actions || []
    }
    saveStateMutation.mutate(stateData)
  }

  const handleEditWorkflow = (workflow: WorkflowConfiguration) => {
    setSelectedWorkflow(workflow)
    workflowForm.reset({
      name: workflow.name,
      description: workflow.description,
      entity_type: workflow.entity_type,
      is_active: workflow.is_active
    })
    setIsWorkflowDialogOpen(true)
  }

  const handleNewWorkflow = () => {
    setSelectedWorkflow(null)
    workflowForm.reset()
    setIsWorkflowDialogOpen(true)
  }

  const handleEditState = (state: WorkflowState) => {
    setSelectedState(state)
    stateForm.reset({
      name: state.name,
      display_name: state.display_name,
      is_initial: state.is_initial,
      is_final: state.is_final,
      color: state.color
    })
    setIsStateDialogOpen(true)
  }

  const handleNewState = () => {
    setSelectedState(null)
    stateForm.reset()
    setIsStateDialogOpen(true)
  }

  const getEntityTypeIcon = (entityType: string) => {
    switch (entityType) {
      case 'test': return <Play className="h-4 w-4" />
      case 'control': return <Shield className="h-4 w-4" />
      case 'issue': return <AlertTriangle className="h-4 w-4" />
      case 'evidence': return <FileText className="h-4 w-4" />
      default: return <Circle className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Workflow Designer</h1>
          <p className="text-muted-foreground">Design and configure organizational workflows</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleNewWorkflow}>
            <Plus className="h-4 w-4 mr-2" />
            New Workflow
          </Button>
          <Button variant="outline" onClick={() => queryClient.invalidateQueries()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Workflow List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Workflows</CardTitle>
              <CardDescription>Select a workflow to configure</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {workflows.map((workflow) => (
                    <div
                      key={workflow.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedWorkflow?.id === workflow.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedWorkflow(workflow)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getEntityTypeIcon(workflow.entity_type)}
                          <span className="font-medium">{workflow.name}</span>
                        </div>
                        <Badge variant={workflow.is_active ? 'default' : 'secondary'}>
                          {workflow.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {workflow.description}
                      </p>
                      <div className="text-xs text-muted-foreground mt-1">
                        {workflow.states.length} states • {workflow.transitions.length} transitions
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Workflow Details */}
        <div className="lg:col-span-2">
          {selectedWorkflow ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {getEntityTypeIcon(selectedWorkflow.entity_type)}
                      {selectedWorkflow.name}
                    </CardTitle>
                    <CardDescription>{selectedWorkflow.description}</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => handleEditWorkflow(selectedWorkflow)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="states">States</TabsTrigger>
                    <TabsTrigger value="transitions">Transitions</TabsTrigger>
                    <TabsTrigger value="automation">Automation</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Entity Type</Label>
                        <p className="text-sm text-muted-foreground capitalize">
                          {selectedWorkflow.entity_type}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Status</Label>
                        <p className="text-sm text-muted-foreground">
                          {selectedWorkflow.is_active ? 'Active' : 'Inactive'}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">States</Label>
                        <p className="text-sm text-muted-foreground">
                          {selectedWorkflow.states.length} configured
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Transitions</Label>
                        <p className="text-sm text-muted-foreground">
                          {selectedWorkflow.transitions.length} configured
                        </p>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="states" className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium">Workflow States</h3>
                      <Button size="sm" onClick={handleNewState}>
                        <Plus className="h-3 w-3 mr-1" />
                        Add State
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {selectedWorkflow.states.map((state) => (
                        <div
                          key={state.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: state.color }}
                            />
                            <div>
                              <span className="font-medium">{state.display_name}</span>
                              <div className="text-xs text-muted-foreground">
                                {state.name}
                                {state.is_initial && <Badge className="ml-2" variant="outline">Initial</Badge>}
                                {state.is_final && <Badge className="ml-2" variant="outline">Final</Badge>}
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditState(state)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="transitions" className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium">State Transitions</h3>
                      <Button size="sm">
                        <Plus className="h-3 w-3 mr-1" />
                        Add Transition
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {selectedWorkflow.transitions.map((transition) => (
                        <div
                          key={transition.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">
                                {selectedWorkflow.states.find(s => s.id === transition.from_state)?.display_name}
                              </span>
                              <ArrowRight className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm font-medium">
                                {selectedWorkflow.states.find(s => s.id === transition.to_state)?.display_name}
                              </span>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {transition.trigger}
                            </Badge>
                          </div>
                          <Button variant="outline" size="sm">
                            <Edit className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="automation" className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-4">Auto Assignments</h3>
                      <div className="space-y-2">
                        {autoAssignments.map((assignment) => (
                          <div
                            key={assignment.id}
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <span className="text-sm font-medium">{assignment.trigger}</span>
                                <p className="text-xs text-muted-foreground">
                                  Assign to {assignment.assignee_type}: {assignment.assignee_id}
                                </p>
                              </div>
                            </div>
                            <Button variant="outline" size="sm">
                              <Edit className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-4">Notification Rules</h3>
                      <div className="space-y-2">
                        {notificationRules.map((rule) => (
                          <div
                            key={rule.id}
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <Bell className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <span className="text-sm font-medium">{rule.trigger}</span>
                                <p className="text-xs text-muted-foreground">
                                  Notify {rule.recipients.length} recipients
                                  {rule.delay_minutes > 0 && ` after ${rule.delay_minutes} minutes`}
                                </p>
                              </div>
                            </div>
                            <Button variant="outline" size="sm">
                              <Edit className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Workflow className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Select a Workflow</h3>
                <p className="text-muted-foreground">
                  Choose a workflow from the list to view and edit its configuration
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Workflow Edit Dialog */}
      <Dialog open={isWorkflowDialogOpen} onOpenChange={setIsWorkflowDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedWorkflow ? 'Edit Workflow' : 'Create New Workflow'}
            </DialogTitle>
            <DialogDescription>
              Configure the basic workflow settings
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={workflowForm.handleSubmit(onWorkflowSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="name">Workflow Name</Label>
              <Input
                id="name"
                {...workflowForm.register('name')}
                className="mt-1"
              />
              {workflowForm.formState.errors.name && (
                <p className="text-sm text-red-600 mt-1">
                  {workflowForm.formState.errors.name.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...workflowForm.register('description')}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="entity_type">Entity Type</Label>
              <Select
                value={workflowForm.watch('entity_type')}
                onValueChange={(value: 'test' | 'control' | 'issue' | 'evidence') =>
                  workflowForm.setValue('entity_type', value)
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select entity type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="test">Test</SelectItem>
                  <SelectItem value="control">Control</SelectItem>
                  <SelectItem value="issue">Issue</SelectItem>
                  <SelectItem value="evidence">Evidence</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={workflowForm.watch('is_active')}
                onCheckedChange={(checked) => workflowForm.setValue('is_active', checked)}
              />
              <Label htmlFor="is_active">Active</Label>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsWorkflowDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saveWorkflowMutation.isPending}>
                {saveWorkflowMutation.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Workflow
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* State Edit Dialog */}
      <Dialog open={isStateDialogOpen} onOpenChange={setIsStateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedState ? 'Edit State' : 'Create New State'}
            </DialogTitle>
            <DialogDescription>
              Configure the workflow state properties
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={stateForm.handleSubmit(onStateSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="state_name">State Name</Label>
                <Input
                  id="state_name"
                  {...stateForm.register('name')}
                  className="mt-1"
                  placeholder="e.g., in_progress"
                />
              </div>

              <div>
                <Label htmlFor="display_name">Display Name</Label>
                <Input
                  id="display_name"
                  {...stateForm.register('display_name')}
                  className="mt-1"
                  placeholder="e.g., In Progress"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="color">Color</Label>
              <Select
                value={stateForm.watch('color')}
                onValueChange={(value) => stateForm.setValue('color', value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select color" />
                </SelectTrigger>
                <SelectContent>
                  {STATE_COLORS.map((color) => (
                    <SelectItem key={color.value} value={color.value}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: color.value }}
                        />
                        {color.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_initial"
                  checked={stateForm.watch('is_initial')}
                  onCheckedChange={(checked) => stateForm.setValue('is_initial', checked)}
                />
                <Label htmlFor="is_initial">Initial State</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_final"
                  checked={stateForm.watch('is_final')}
                  onCheckedChange={(checked) => stateForm.setValue('is_final', checked)}
                />
                <Label htmlFor="is_final">Final State</Label>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsStateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saveStateMutation.isPending}>
                {saveStateMutation.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save State
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}