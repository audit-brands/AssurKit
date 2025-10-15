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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
  Settings,
  FileText,
  Clock,
  Shield,
  AlertTriangle,
  Plus,
  Edit,
  Trash2,
  Save,
  RefreshCw
} from 'lucide-react'

interface OrganizationalPolicy {
  id: string
  name: string
  category: 'security' | 'workflow' | 'compliance' | 'data-retention' | 'access-control'
  description: string
  content: string
  status: 'active' | 'draft' | 'archived'
  version: string
  created_by: string
  created_at: string
  updated_at: string
  effective_date: string
  review_date: string
  approval_required: boolean
  approved_by?: string
  approved_at?: string
}

interface WorkflowConfiguration {
  id: string
  name: string
  entity_type: 'test' | 'control' | 'issue' | 'evidence'
  states: WorkflowState[]
  transitions: WorkflowTransition[]
  auto_assignments: AutoAssignment[]
  notifications: NotificationRule[]
  is_active: boolean
  created_at: string
  updated_at: string
}

interface WorkflowState {
  id: string
  name: string
  display_name: string
  is_initial: boolean
  is_final: boolean
  required_permissions: string[]
  auto_actions: string[]
}

interface WorkflowTransition {
  id: string
  from_state: string
  to_state: string
  trigger: 'manual' | 'automatic' | 'scheduled'
  conditions: string[]
  required_role: string
  required_permissions: string[]
}

interface AutoAssignment {
  id: string
  trigger: string
  assignee_type: 'user' | 'role' | 'group'
  assignee_id: string
  conditions: string[]
}

interface NotificationRule {
  id: string
  trigger: string
  recipients: string[]
  template: string
  delay_minutes: number
  conditions: string[]
}

interface SystemSettings {
  password_policy: {
    min_length: number
    require_uppercase: boolean
    require_lowercase: boolean
    require_numbers: boolean
    require_symbols: boolean
    expiry_days: number
    history_count: number
  }
  session_policy: {
    timeout_minutes: number
    max_concurrent_sessions: number
    require_2fa: boolean
  }
  audit_policy: {
    retention_days: number
    log_level: 'minimal' | 'standard' | 'detailed'
    encrypt_logs: boolean
  }
  evidence_policy: {
    max_file_size_mb: number
    allowed_file_types: string[]
    retention_years: number
    require_checksum: boolean
    encrypt_at_rest: boolean
  }
  backup_policy: {
    frequency: 'daily' | 'weekly' | 'monthly'
    retention_count: number
    include_evidence: boolean
    encrypt_backups: boolean
  }
}

const policySchema = z.object({
  name: z.string().min(1, 'Policy name is required'),
  category: z.enum(['security', 'workflow', 'compliance', 'data-retention', 'access-control']),
  description: z.string().min(1, 'Description is required'),
  content: z.string().min(1, 'Policy content is required'),
  effective_date: z.string(),
  review_date: z.string(),
  approval_required: z.boolean()
})

type PolicyFormData = z.infer<typeof policySchema>

export function PoliciesManagement() {
  const [selectedPolicy, setSelectedPolicy] = useState<OrganizationalPolicy | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('policies')
  const queryClient = useQueryClient()

  const { data: policies = [], isLoading: policiesLoading } = useQuery({
    queryKey: ['admin-policies'],
    queryFn: async (): Promise<OrganizationalPolicy[]> => {
      const response = await fetch('/api/admin/policies')
      if (!response.ok) {
        throw new Error('Failed to fetch policies')
      }
      return response.json()
    }
  })

  const { data: workflows = [], isLoading: workflowsLoading } = useQuery({
    queryKey: ['admin-workflows'],
    queryFn: async (): Promise<WorkflowConfiguration[]> => {
      const response = await fetch('/api/admin/workflows')
      if (!response.ok) {
        throw new Error('Failed to fetch workflows')
      }
      return response.json()
    }
  })

  const { data: systemSettings, isLoading: settingsLoading } = useQuery({
    queryKey: ['admin-system-settings'],
    queryFn: async (): Promise<SystemSettings> => {
      const response = await fetch('/api/admin/system-settings')
      if (!response.ok) {
        throw new Error('Failed to fetch system settings')
      }
      return response.json()
    }
  })

  const savePolicyMutation = useMutation({
    mutationFn: async (policy: Partial<OrganizationalPolicy>) => {
      const url = policy.id ? `/api/admin/policies/${policy.id}` : '/api/admin/policies'
      const method = policy.id ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(policy)
      })

      if (!response.ok) {
        throw new Error('Failed to save policy')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-policies'] })
      setIsEditDialogOpen(false)
      setSelectedPolicy(null)
    }
  })

  const updateSystemSettingsMutation = useMutation({
    mutationFn: async (settings: Partial<SystemSettings>) => {
      const response = await fetch('/api/admin/system-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })

      if (!response.ok) {
        throw new Error('Failed to update system settings')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-system-settings'] })
    }
  })

  const form = useForm<PolicyFormData>({
    resolver: zodResolver(policySchema),
    defaultValues: {
      name: '',
      category: 'compliance',
      description: '',
      content: '',
      effective_date: new Date().toISOString().split('T')[0],
      review_date: '',
      approval_required: false
    }
  })

  const onSubmit = (data: PolicyFormData) => {
    const policyData = {
      ...data,
      id: selectedPolicy?.id,
      status: 'draft' as const,
      version: selectedPolicy ? `${parseFloat(selectedPolicy.version) + 0.1}` : '1.0'
    }
    savePolicyMutation.mutate(policyData)
  }

  const handleEditPolicy = (policy: OrganizationalPolicy) => {
    setSelectedPolicy(policy)
    form.reset({
      name: policy.name,
      category: policy.category,
      description: policy.description,
      content: policy.content,
      effective_date: policy.effective_date,
      review_date: policy.review_date,
      approval_required: policy.approval_required
    })
    setIsEditDialogOpen(true)
  }

  const handleNewPolicy = () => {
    setSelectedPolicy(null)
    form.reset()
    setIsEditDialogOpen(true)
  }

  const getCategoryBadgeVariant = (category: string) => {
    switch (category) {
      case 'security': return 'destructive'
      case 'compliance': return 'default'
      case 'workflow': return 'secondary'
      case 'data-retention': return 'outline'
      case 'access-control': return 'secondary'
      default: return 'outline'
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default'
      case 'draft': return 'secondary'
      case 'archived': return 'outline'
      default: return 'outline'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Policies & Configuration</h1>
          <p className="text-muted-foreground">Manage organizational policies and system settings</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleNewPolicy}>
            <Plus className="h-4 w-4 mr-2" />
            New Policy
          </Button>
          <Button variant="outline" onClick={() => queryClient.invalidateQueries()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="policies">
            <FileText className="h-4 w-4 mr-2" />
            Policies
          </TabsTrigger>
          <TabsTrigger value="workflows">
            <Settings className="h-4 w-4 mr-2" />
            Workflows
          </TabsTrigger>
          <TabsTrigger value="system">
            <Shield className="h-4 w-4 mr-2" />
            System Settings
          </TabsTrigger>
          <TabsTrigger value="compliance">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Compliance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="policies" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Organizational Policies</CardTitle>
              <CardDescription>
                Manage organizational policies, procedures, and documentation
              </CardDescription>
            </CardHeader>
            <CardContent>
              {policiesLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Policy Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Version</TableHead>
                      <TableHead>Review Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {policies.map((policy) => (
                      <TableRow key={policy.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{policy.name}</div>
                            <div className="text-sm text-muted-foreground">{policy.description}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getCategoryBadgeVariant(policy.category)}>
                            {policy.category.replace('-', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(policy.status)}>
                            {policy.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{policy.version}</TableCell>
                        <TableCell>{new Date(policy.review_date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditPolicy(policy)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workflows" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Workflow Configurations</CardTitle>
              <CardDescription>
                Configure workflows for tests, controls, issues, and evidence management
              </CardDescription>
            </CardHeader>
            <CardContent>
              {workflowsLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Workflow Name</TableHead>
                      <TableHead>Entity Type</TableHead>
                      <TableHead>States</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {workflows.map((workflow) => (
                      <TableRow key={workflow.id}>
                        <TableCell className="font-medium">{workflow.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{workflow.entity_type}</Badge>
                        </TableCell>
                        <TableCell>{workflow.states.length} states</TableCell>
                        <TableCell>
                          <Badge variant={workflow.is_active ? 'default' : 'secondary'}>
                            {workflow.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Settings className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          {settingsLoading ? (
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-20 bg-gray-100 rounded animate-pulse" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : systemSettings ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Password Policy</CardTitle>
                  <CardDescription>Configure password requirements and security</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="minLength">Minimum Length</Label>
                      <Input
                        id="minLength"
                        type="number"
                        defaultValue={systemSettings.password_policy.min_length}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="expiryDays">Expiry (Days)</Label>
                      <Input
                        id="expiryDays"
                        type="number"
                        defaultValue={systemSettings.password_policy.expiry_days}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="requireUppercase">Require Uppercase</Label>
                      <Switch
                        id="requireUppercase"
                        checked={systemSettings.password_policy.require_uppercase}
                        onCheckedChange={() => {}}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="requireNumbers">Require Numbers</Label>
                      <Switch
                        id="requireNumbers"
                        checked={systemSettings.password_policy.require_numbers}
                        onCheckedChange={() => {}}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="requireSymbols">Require Symbols</Label>
                      <Switch
                        id="requireSymbols"
                        checked={systemSettings.password_policy.require_symbols}
                        onCheckedChange={() => {}}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Session Policy</CardTitle>
                  <CardDescription>Configure user session and authentication settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="sessionTimeout">Session Timeout (Minutes)</Label>
                    <Input
                      id="sessionTimeout"
                      type="number"
                      defaultValue={systemSettings.session_policy.timeout_minutes}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="maxSessions">Max Concurrent Sessions</Label>
                    <Input
                      id="maxSessions"
                      type="number"
                      defaultValue={systemSettings.session_policy.max_concurrent_sessions}
                      className="mt-1"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="require2FA">Require 2FA</Label>
                    <Switch
                      id="require2FA"
                      checked={systemSettings.session_policy.require_2fa}
                      onCheckedChange={() => {}}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Evidence Policy</CardTitle>
                  <CardDescription>Configure evidence storage and retention settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="maxFileSize">Max File Size (MB)</Label>
                      <Input
                        id="maxFileSize"
                        type="number"
                        defaultValue={systemSettings.evidence_policy.max_file_size_mb}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="retentionYears">Retention (Years)</Label>
                      <Input
                        id="retentionYears"
                        type="number"
                        defaultValue={systemSettings.evidence_policy.retention_years}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="allowedTypes">Allowed File Types</Label>
                    <Input
                      id="allowedTypes"
                      defaultValue={systemSettings.evidence_policy.allowed_file_types.join(', ')}
                      placeholder="pdf, docx, xlsx, png, jpg"
                      className="mt-1"
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="requireChecksum">Require Checksum</Label>
                      <Switch
                        id="requireChecksum"
                        checked={systemSettings.evidence_policy.require_checksum}
                        onCheckedChange={() => {}}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="encryptAtRest">Encrypt at Rest</Label>
                      <Switch
                        id="encryptAtRest"
                        checked={systemSettings.evidence_policy.encrypt_at_rest}
                        onCheckedChange={() => {}}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Backup Policy</CardTitle>
                  <CardDescription>Configure automated backup settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="backupFrequency">Backup Frequency</Label>
                    <Select defaultValue={systemSettings.backup_policy.frequency}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="retentionCount">Retention Count</Label>
                    <Input
                      id="retentionCount"
                      type="number"
                      defaultValue={systemSettings.backup_policy.retention_count}
                      className="mt-1"
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="includeEvidence">Include Evidence Files</Label>
                      <Switch
                        id="includeEvidence"
                        checked={systemSettings.backup_policy.include_evidence}
                        onCheckedChange={() => {}}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="encryptBackups">Encrypt Backups</Label>
                      <Switch
                        id="encryptBackups"
                        checked={systemSettings.backup_policy.encrypt_backups}
                        onCheckedChange={() => {}}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : null}

          <div className="flex justify-end">
            <Button onClick={() => updateSystemSettingsMutation.mutate({})}>
              <Save className="h-4 w-4 mr-2" />
              Save System Settings
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Compliance Framework</CardTitle>
                <CardDescription>Current compliance framework configuration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">SOX Compliance</span>
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">COSO Framework</span>
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">ISO 27001</span>
                  <Badge variant="outline">Optional</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Audit Schedule</CardTitle>
                <CardDescription>Upcoming compliance assessments and reviews</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Q4 SOX Testing</p>
                    <p className="text-xs text-muted-foreground">Due: December 31, 2024</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Annual Policy Review</p>
                    <p className="text-xs text-muted-foreground">Due: January 15, 2025</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Policy Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedPolicy ? 'Edit Policy' : 'Create New Policy'}
            </DialogTitle>
            <DialogDescription>
              {selectedPolicy
                ? 'Update the policy information and content below'
                : 'Create a new organizational policy'
              }
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Policy Name</Label>
                <Input
                  id="name"
                  {...form.register('name')}
                  className="mt-1"
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={form.watch('category')}
                  onValueChange={(value: 'security' | 'workflow' | 'compliance' | 'data-retention' | 'access-control') =>
                    form.setValue('category', value)
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="security">Security</SelectItem>
                    <SelectItem value="workflow">Workflow</SelectItem>
                    <SelectItem value="compliance">Compliance</SelectItem>
                    <SelectItem value="data-retention">Data Retention</SelectItem>
                    <SelectItem value="access-control">Access Control</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                {...form.register('description')}
                className="mt-1"
              />
              {form.formState.errors.description && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.description.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="content">Policy Content</Label>
              <Textarea
                id="content"
                {...form.register('content')}
                rows={8}
                className="mt-1"
                placeholder="Enter the detailed policy content..."
              />
              {form.formState.errors.content && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.content.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="effective_date">Effective Date</Label>
                <Input
                  id="effective_date"
                  type="date"
                  {...form.register('effective_date')}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="review_date">Review Date</Label>
                <Input
                  id="review_date"
                  type="date"
                  {...form.register('review_date')}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="approval_required"
                checked={form.watch('approval_required')}
                onCheckedChange={(checked) => form.setValue('approval_required', checked)}
              />
              <Label htmlFor="approval_required">Requires Approval</Label>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={savePolicyMutation.isPending}
              >
                {savePolicyMutation.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Policy
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