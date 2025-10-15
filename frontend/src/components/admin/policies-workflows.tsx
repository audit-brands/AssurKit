import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Workflow,
  CheckCircle,
  AlertTriangle,
  Save,
  RefreshCw,
  Plus,
  Edit,
  Lock,
  FileText,
  Clock,
  Settings
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Policy {
  id: string
  name: string
  description: string
  category: 'security' | 'compliance' | 'operational' | 'data' | 'workflow'
  type: 'global' | 'departmental' | 'process-specific'
  content: string
  version: string
  status: 'draft' | 'active' | 'archived'
  effective_date: string
  review_date: string
  approval_required: boolean
  approved_by?: string
  approved_at?: string
  created_by: string
  created_at: string
  updated_at: string
}

interface WorkflowConfig {
  id: string
  name: string
  description: string
  process_type: 'control_testing' | 'evidence_review' | 'issue_management' | 'risk_assessment'
  states: WorkflowState[]
  transitions: WorkflowTransition[]
  settings: WorkflowSettings
  is_active: boolean
  created_at: string
  updated_at: string
}

interface WorkflowState {
  id: string
  name: string
  description: string
  type: 'initial' | 'intermediate' | 'final'
  requires_approval: boolean
  auto_transition: boolean
  notification_settings: {
    on_entry: boolean
    on_exit: boolean
    escalation_hours?: number
  }
  permissions: {
    view: string[]
    edit: string[]
    transition: string[]
  }
}

interface WorkflowTransition {
  id: string
  from_state: string
  to_state: string
  name: string
  description: string
  conditions: {
    required_fields?: string[]
    approval_required?: boolean
    min_approvals?: number
    allowed_roles?: string[]
  }
  actions: {
    send_notification?: boolean
    update_fields?: Record<string, unknown>
    trigger_automation?: string
  }
}

interface WorkflowSettings {
  auto_assignment: boolean
  due_date_calculation: 'fixed' | 'business_days' | 'calendar_days'
  default_due_days: number
  escalation_enabled: boolean
  escalation_hours: number
  notification_frequency: 'immediate' | 'daily' | 'weekly'
  parallel_approval: boolean
  require_comments: boolean
}

interface SystemSetting {
  id: string
  category: string
  key: string
  value: string
  type: 'string' | 'number' | 'boolean' | 'json'
  description: string
  is_sensitive: boolean
  requires_restart: boolean
  updated_by?: string
  updated_at?: string
}

export function PoliciesWorkflows() {
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null)
  // const [selectedWorkflow] = useState<WorkflowConfig | null>(null)
  const [isCreatePolicyOpen, setIsCreatePolicyOpen] = useState(false)
  const [isCreateWorkflowOpen, setIsCreateWorkflowOpen] = useState(false)
  const [isEditPolicyOpen, setIsEditPolicyOpen] = useState(false)
  // const [isEditWorkflowOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: policies = [], isLoading: policiesLoading } = useQuery({
    queryKey: ['admin-policies'],
    queryFn: async (): Promise<Policy[]> => {
      const response = await fetch('/api/admin/policies')
      if (!response.ok) throw new Error('Failed to fetch policies')
      return response.json()
    }
  })

  const { data: workflows = [], isLoading: workflowsLoading } = useQuery({
    queryKey: ['admin-workflows'],
    queryFn: async (): Promise<WorkflowConfig[]> => {
      const response = await fetch('/api/admin/workflows')
      if (!response.ok) throw new Error('Failed to fetch workflows')
      return response.json()
    }
  })

  const { data: systemSettings = [], isLoading: settingsLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: async (): Promise<SystemSetting[]> => {
      const response = await fetch('/api/admin/settings')
      if (!response.ok) throw new Error('Failed to fetch system settings')
      return response.json()
    }
  })

  const createPolicyMutation = useMutation({
    mutationFn: async (policyData: Omit<Policy, 'id' | 'version' | 'created_at' | 'updated_at' | 'created_by'>) => {
      const response = await fetch('/api/admin/policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(policyData)
      })
      if (!response.ok) throw new Error('Failed to create policy')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-policies'] })
      setIsCreatePolicyOpen(false)
      toast({ title: 'Policy created successfully' })
    }
  })

  const updatePolicyMutation = useMutation({
    mutationFn: async ({ id, ...policyData }: { id: string } & Partial<Policy>) => {
      const response = await fetch(`/api/admin/policies/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(policyData)
      })
      if (!response.ok) throw new Error('Failed to update policy')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-policies'] })
      setIsEditPolicyOpen(false)
      setSelectedPolicy(null)
      toast({ title: 'Policy updated successfully' })
    }
  })

  const updateSettingMutation = useMutation({
    mutationFn: async ({ id, value }: { id: string; value: string }) => {
      const response = await fetch(`/api/admin/settings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value })
      })
      if (!response.ok) throw new Error('Failed to update setting')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] })
      toast({ title: 'Setting updated successfully' })
    }
  })

  const filteredPolicies = policies.filter(policy => {
    const matchesSearch = policy.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         policy.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || policy.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const groupedSettings = systemSettings.reduce((acc, setting) => {
    if (!acc[setting.category]) {
      acc[setting.category] = []
    }
    acc[setting.category].push(setting)
    return acc
  }, {} as Record<string, SystemSetting[]>)

  if (policiesLoading || workflowsLoading || settingsLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Policies & Workflows</h1>
          <p className="text-muted-foreground">
            Configure organizational policies, workflows, and system settings
          </p>
        </div>
      </div>

      <Tabs defaultValue="policies" className="space-y-4">
        <TabsList>
          <TabsTrigger value="policies">Policies</TabsTrigger>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="settings">System Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="policies" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <h2 className="text-xl font-semibold">Organizational Policies</h2>
            </div>
            <Dialog open={isCreatePolicyOpen} onOpenChange={setIsCreatePolicyOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Policy
                </Button>
              </DialogTrigger>
              <CreatePolicyDialog
                onSubmit={(data) => createPolicyMutation.mutate(data)}
                isLoading={createPolicyMutation.isPending}
              />
            </Dialog>
          </div>

          <div className="flex space-x-4">
            <Input
              placeholder="Search policies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="security">Security</SelectItem>
                <SelectItem value="compliance">Compliance</SelectItem>
                <SelectItem value="operational">Operational</SelectItem>
                <SelectItem value="data">Data</SelectItem>
                <SelectItem value="workflow">Workflow</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredPolicies.map((policy) => (
              <Card key={policy.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedPolicy(policy)}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{policy.name}</CardTitle>
                    <div className="flex items-center space-x-2">
                      <Badge variant={
                        policy.status === 'active' ? 'default' :
                        policy.status === 'draft' ? 'secondary' : 'outline'
                      }>
                        {policy.status === 'active' && <CheckCircle className="h-3 w-3 mr-1" />}
                        {policy.status === 'draft' && <Clock className="h-3 w-3 mr-1" />}
                        {policy.status}
                      </Badge>
                      {policy.approval_required && !policy.approved_at && (
                        <Badge variant="destructive">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Pending Approval
                        </Badge>
                      )}
                    </div>
                  </div>
                  <CardDescription>{policy.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span>Category:</span>
                      <Badge variant="outline">{policy.category}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Type:</span>
                      <span className="text-muted-foreground">{policy.type}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Version:</span>
                      <span className="text-muted-foreground">{policy.version}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Review Date:</span>
                      <span className="text-muted-foreground">
                        {new Date(policy.review_date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {selectedPolicy && (
            <Dialog open={isEditPolicyOpen} onOpenChange={setIsEditPolicyOpen}>
              <EditPolicyDialog
                policy={selectedPolicy}
                onSubmit={(data) => updatePolicyMutation.mutate({ id: selectedPolicy.id, ...data })}
                isLoading={updatePolicyMutation.isPending}
              />
            </Dialog>
          )}
        </TabsContent>

        <TabsContent value="workflows" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Workflow className="h-5 w-5" />
              <h2 className="text-xl font-semibold">Workflow Configuration</h2>
            </div>
            <Dialog open={isCreateWorkflowOpen} onOpenChange={setIsCreateWorkflowOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Workflow
                </Button>
              </DialogTrigger>
              <CreateWorkflowDialog
                onSubmit={() => {}}
                isLoading={false}
              />
            </Dialog>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {workflows.map((workflow) => (
              <Card key={workflow.id} className="cursor-pointer hover:bg-muted/50" onClick={() => {/* setSelectedWorkflow(workflow) */}}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{workflow.name}</CardTitle>
                    <div className="flex items-center space-x-2">
                      <Badge variant={workflow.is_active ? 'default' : 'secondary'}>
                        {workflow.is_active ? <CheckCircle className="h-3 w-3 mr-1" /> : <Clock className="h-3 w-3 mr-1" />}
                        {workflow.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                  <CardDescription>{workflow.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span>Process Type:</span>
                      <Badge variant="outline">{workflow.process_type.replace('_', ' ')}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>States:</span>
                      <span className="text-muted-foreground">{workflow.states.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Transitions:</span>
                      <span className="text-muted-foreground">{workflow.transitions.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Auto Assignment:</span>
                      <Badge variant={workflow.settings.auto_assignment ? 'default' : 'secondary'}>
                        {workflow.settings.auto_assignment ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <div className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <h2 className="text-xl font-semibold">System Settings</h2>
          </div>

          <div className="space-y-6">
            {Object.entries(groupedSettings).map(([category, settings]) => (
              <Card key={category}>
                <CardHeader>
                  <CardTitle className="capitalize">{category.replace('_', ' ')} Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {settings.map((setting) => (
                    <SettingItem
                      key={setting.id}
                      setting={setting}
                      onUpdate={(value) => updateSettingMutation.mutate({ id: setting.id, value })}
                      isLoading={updateSettingMutation.isPending}
                    />
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface CreatePolicyDialogProps {
  onSubmit: (data: Omit<Policy, 'id' | 'version' | 'created_at' | 'updated_at' | 'created_by'>) => void
  isLoading: boolean
}

function CreatePolicyDialog({ onSubmit, isLoading }: CreatePolicyDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'compliance' as Policy['category'],
    type: 'global' as Policy['type'],
    content: '',
    status: 'draft' as Policy['status'],
    effective_date: '',
    review_date: '',
    approval_required: false
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <DialogContent className="max-w-2xl max-h-[80vh]">
      <DialogHeader>
        <DialogTitle>Create New Policy</DialogTitle>
        <DialogDescription>
          Create a new organizational policy document.
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit}>
        <ScrollArea className="max-h-96">
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Policy Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value: Policy['category']) => setFormData(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="security">Security</SelectItem>
                    <SelectItem value="compliance">Compliance</SelectItem>
                    <SelectItem value="operational">Operational</SelectItem>
                    <SelectItem value="data">Data</SelectItem>
                    <SelectItem value="workflow">Workflow</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Policy Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: Policy['type']) => setFormData(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="global">Global</SelectItem>
                    <SelectItem value="departmental">Departmental</SelectItem>
                    <SelectItem value="process-specific">Process Specific</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: Policy['status']) => setFormData(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="effective_date">Effective Date</Label>
                <Input
                  id="effective_date"
                  type="date"
                  value={formData.effective_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, effective_date: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="review_date">Review Date</Label>
                <Input
                  id="review_date"
                  type="date"
                  value={formData.review_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, review_date: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="approval_required"
                checked={formData.approval_required}
                onCheckedChange={(checked: boolean) => setFormData(prev => ({ ...prev, approval_required: checked }))}
              />
              <Label htmlFor="approval_required">Requires Approval</Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Policy Content</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                rows={8}
                placeholder="Enter the policy content here..."
                required
              />
            </div>
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Create Policy
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}

interface EditPolicyDialogProps {
  policy: Policy
  onSubmit: (data: Partial<Policy>) => void
  isLoading: boolean
}

function EditPolicyDialog({ policy, onSubmit, isLoading }: EditPolicyDialogProps) {
  const [formData, setFormData] = useState({
    name: policy.name,
    description: policy.description,
    category: policy.category,
    type: policy.type,
    content: policy.content,
    status: policy.status,
    effective_date: policy.effective_date,
    review_date: policy.review_date,
    approval_required: policy.approval_required
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <DialogContent className="max-w-2xl max-h-[80vh]">
      <DialogHeader>
        <DialogTitle>Edit Policy: {policy.name}</DialogTitle>
        <DialogDescription>
          Modify the policy details and content.
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit}>
        <ScrollArea className="max-h-96">
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Policy Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: Policy['status']) => setFormData(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Policy Content</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                rows={10}
                required
              />
            </div>
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Update Policy
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}

interface CreateWorkflowDialogProps {
  onSubmit: () => void
  isLoading: boolean
}

function CreateWorkflowDialog({ onSubmit, isLoading }: CreateWorkflowDialogProps) {
  return (
    <DialogContent className="max-w-4xl">
      <DialogHeader>
        <DialogTitle>Create Workflow</DialogTitle>
        <DialogDescription>
          Design a new workflow for process automation.
        </DialogDescription>
      </DialogHeader>
      <div className="py-4">
        <p className="text-center text-muted-foreground">
          Workflow designer coming soon...
        </p>
      </div>
      <DialogFooter>
        <Button onClick={onSubmit} disabled={isLoading}>
          Create Workflow
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}

interface SettingItemProps {
  setting: SystemSetting
  onUpdate: (value: string) => void
  isLoading: boolean
}

function SettingItem({ setting, onUpdate, isLoading }: SettingItemProps) {
  const [value, setValue] = useState(setting.value)
  const [isEditing, setIsEditing] = useState(false)

  const handleSave = () => {
    onUpdate(value)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setValue(setting.value)
    setIsEditing(false)
  }

  const renderValue = () => {
    if (setting.is_sensitive && !isEditing) {
      return <span className="text-muted-foreground">••••••••</span>
    }

    if (setting.type === 'boolean') {
      return (
        <Switch
          checked={value === 'true'}
          onCheckedChange={(checked: boolean) => {
            setValue(checked.toString())
            onUpdate(checked.toString())
          }}
          disabled={isLoading}
        />
      )
    }

    if (isEditing) {
      return (
        <div className="flex items-center space-x-2">
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            type={setting.type === 'number' ? 'number' : 'text'}
            className="max-w-xs"
          />
          <Button size="sm" onClick={handleSave} disabled={isLoading}>
            <Save className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
        </div>
      )
    }

    return (
      <div className="flex items-center space-x-2">
        <span className="text-sm font-mono">{value}</span>
        <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)}>
          <Edit className="h-3 w-3" />
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between py-2">
      <div className="space-y-1">
        <div className="flex items-center space-x-2">
          <Label className="font-medium">{setting.key}</Label>
          {setting.is_sensitive && <Lock className="h-3 w-3 text-muted-foreground" />}
          {setting.requires_restart && (
            <Badge variant="outline" className="text-xs">
              <RefreshCw className="h-2 w-2 mr-1" />
              Restart Required
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{setting.description}</p>
        {setting.updated_at && (
          <p className="text-xs text-muted-foreground">
            Last updated: {new Date(setting.updated_at).toLocaleString()}
          </p>
        )}
      </div>
      <div className="min-w-0 flex-1 max-w-md ml-4">
        {renderValue()}
      </div>
    </div>
  )
}