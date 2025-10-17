import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { useCreateControl, useUpdateControl, useControl, type CreateControlData } from '@/hooks/use-controls'
import { useRisks } from '@/hooks/use-risks'
import { useSubprocesses } from '@/hooks/use-subprocesses'

const controlFormSchema = z.object({
  risk_id: z.string().min(1, 'Risk is required'),
  control_name: z.string().min(2, 'Control name must be at least 2 characters'),
  control_type: z.enum(['Preventive', 'Detective', 'Corrective']),
  frequency: z.enum(['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Annual', 'Ad-hoc']),
  automation: z.enum(['Manual', 'Semi-Automated', 'Automated']),
  key_control: z.boolean(),
  description: z.string().min(2, 'Description is required'),
  owner: z.string().email('Owner email must be valid'),
  testing_procedures: z.string().optional(),
  status: z.enum(['Draft', 'Active', 'Retired']).optional()
})

type ControlFormData = z.infer<typeof controlFormSchema>

interface ControlFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  controlId?: string
  defaultRiskId?: string
}

export function ControlForm({ open, onOpenChange, controlId, defaultRiskId }: ControlFormProps) {
  const isEditing = Boolean(controlId)
  const { data: risks, isLoading: risksLoading } = useRisks()
  const { data: subprocesses } = useSubprocesses()
  const createControl = useCreateControl()
  const updateControl = useUpdateControl()
  const { data: controlDetail, isLoading: controlLoading } = useControl(controlId ?? '', { enabled: open && isEditing })

  const form = useForm<ControlFormData>({
    resolver: zodResolver(controlFormSchema),
    defaultValues: {
      risk_id: defaultRiskId || '',
      control_name: '',
      control_type: 'Preventive',
      frequency: 'Monthly',
      automation: 'Manual',
      key_control: false,
      description: '',
      owner: '',
      testing_procedures: '',
      status: 'Draft'
    }
  })

  useEffect(() => {
    if (isEditing && controlDetail) {
      form.reset({
        risk_id: controlDetail.risks[0]?.id || defaultRiskId || '',
        control_name: controlDetail.control_name,
        control_type: controlDetail.control_type,
        frequency: controlDetail.frequency,
        automation: controlDetail.automation,
        key_control: controlDetail.key_control,
        description: controlDetail.description || '',
        owner: controlDetail.owner || '',
        testing_procedures: controlDetail.testing_procedures || '',
        status: controlDetail.status,
      })
    } else if (!isEditing) {
      form.reset({
        risk_id: defaultRiskId || '',
        control_name: '',
        control_type: 'Preventive',
        frequency: 'Monthly',
        automation: 'Manual',
        key_control: false,
        description: '',
        owner: '',
        testing_procedures: '',
        status: 'Draft',
      })
    }
  }, [isEditing, controlDetail, defaultRiskId, form])

  const getRiskDisplayName = (riskId: string) => {
    const risk = risks?.find(r => r.id === riskId)
    if (!risk) return 'Unknown Risk'
    const subprocess = subprocesses?.find(s => s.id === risk.subprocess_id)
    return `${risk.risk_name} (${subprocess?.subprocess_name || 'Unknown Subprocess'})`
  }

  const onSubmit = async (data: ControlFormData) => {
    const controlData: CreateControlData = {
      risk_id: data.risk_id,
      control_name: data.control_name,
      control_type: data.control_type,
      frequency: data.frequency,
      automation: data.automation,
      key_control: data.key_control,
      description: data.description,
      owner: data.owner,
      testing_procedures: data.testing_procedures || undefined,
      status: data.status || 'Draft'
    }

    try {
      if (isEditing && controlId) {
        await updateControl.mutateAsync({
          id: controlId,
          ...controlData,
          previous_risk_id: controlDetail?.risks[0]?.id,
        })
      } else {
        await createControl.mutateAsync(controlData)
      }

      onOpenChange(false)
      form.reset()
    } catch (error) {
      console.error('Failed to save control:', error)
    }
  }

  const isSaving = createControl.isPending || updateControl.isPending
  const isLoading = (isEditing && (controlLoading && !controlDetail)) || risksLoading

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Control' : 'Create New Control'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update the control information below.' : 'Add a new control to mitigate the selected risk.'}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <p className="text-muted-foreground">Loading control details...</p>
          </div>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="risk_id">Risk</Label>
              <Select
                value={form.watch('risk_id')}
                onValueChange={(value: string) => form.setValue('risk_id', value)}
                disabled={risksLoading || isSaving}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a risk" />
                </SelectTrigger>
                <SelectContent>
                  {risks?.map((risk) => (
                    <SelectItem key={risk.id} value={risk.id}>
                      {getRiskDisplayName(risk.id)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.risk_id && (
                <p className="text-sm text-red-600">{form.formState.errors.risk_id.message}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="control_name">Control Name</Label>
              <Input
                id="control_name"
                {...form.register('control_name')}
                placeholder="e.g., Management Review and Approval"
                disabled={isSaving}
              />
              {form.formState.errors.control_name && (
                <p className="text-sm text-red-600">{form.formState.errors.control_name.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="control_type">Control Type</Label>
                <Select
                  value={form.watch('control_type')}
                  onValueChange={(value: string) => form.setValue('control_type', value as ControlFormData['control_type'])}
                  disabled={isSaving}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select control type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Preventive">Preventive</SelectItem>
                    <SelectItem value="Detective">Detective</SelectItem>
                    <SelectItem value="Corrective">Corrective</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="frequency">Frequency</Label>
                <Select
                  value={form.watch('frequency')}
                  onValueChange={(value: string) => form.setValue('frequency', value as ControlFormData['frequency'])}
                  disabled={isSaving}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Daily">Daily</SelectItem>
                    <SelectItem value="Weekly">Weekly</SelectItem>
                    <SelectItem value="Monthly">Monthly</SelectItem>
                    <SelectItem value="Quarterly">Quarterly</SelectItem>
                    <SelectItem value="Annual">Annual</SelectItem>
                    <SelectItem value="Ad-hoc">Ad-hoc</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="automation">Automation Level</Label>
                <Select
                  value={form.watch('automation')}
                  onValueChange={(value: string) => form.setValue('automation', value as ControlFormData['automation'])}
                  disabled={isSaving}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select automation" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Manual">Manual</SelectItem>
                    <SelectItem value="Semi-Automated">Semi-Automated</SelectItem>
                    <SelectItem value="Automated">Automated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="owner">Owner Email</Label>
                <Input
                  id="owner"
                  type="email"
                  {...form.register('owner')}
                  placeholder="owner@example.com"
                  disabled={isSaving}
                />
                {form.formState.errors.owner && (
                  <p className="text-sm text-red-600">{form.formState.errors.owner.message}</p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="key_control"
                checked={form.watch('key_control')}
                onCheckedChange={(checked) => form.setValue('key_control', Boolean(checked))}
                disabled={isSaving}
              />
              <Label htmlFor="key_control">Key Control</Label>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...form.register('description')}
                placeholder="Detailed description of the control..."
                rows={3}
                disabled={isSaving}
              />
              {form.formState.errors.description && (
                <p className="text-sm text-red-600">{form.formState.errors.description.message}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="testing_procedures">Testing Procedures</Label>
              <Textarea
                id="testing_procedures"
                {...form.register('testing_procedures')}
                placeholder="How this control should be tested..."
                rows={3}
                disabled={isSaving}
              />
              {form.formState.errors.testing_procedures && (
                <p className="text-sm text-red-600">{form.formState.errors.testing_procedures.message}</p>
              )}
            </div>

            {isEditing && (
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={form.watch('status')}
                  onValueChange={(value: string) => form.setValue('status', value as ControlFormData['status'])}
                  disabled={isSaving}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Draft">Draft</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Retired">Retired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (isEditing ? 'Saving...' : 'Creating...') : isEditing ? 'Save Changes' : 'Create Control'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
