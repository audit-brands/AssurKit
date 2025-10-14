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
import { useCreateControl, useUpdateControl, type Control, type CreateControlData } from '@/hooks/use-controls'
import { useRisks } from '@/hooks/use-risks'
import { useSubprocesses } from '@/hooks/use-subprocesses'
import { useEffect } from 'react'

const controlFormSchema = z.object({
  risk_id: z.string().min(1, 'Risk is required'),
  control_name: z.string().min(2, 'Control name must be at least 2 characters'),
  control_type: z.enum(['Preventive', 'Detective', 'Corrective', 'Compensating']),
  frequency: z.enum(['Real-time', 'Daily', 'Weekly', 'Monthly', 'Quarterly', 'Annual', 'Ad-hoc']),
  automation: z.enum(['Manual', 'Semi-Automated', 'Automated']),
  key_control: z.boolean(),
  description: z.string().optional(),
  owner: z.string().optional(),
  testing_procedures: z.string().optional(),
  status: z.enum(['Draft', 'Active', 'Retired']).optional()
})

type ControlFormData = z.infer<typeof controlFormSchema>

interface ControlFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  control?: Control
  defaultRiskId?: string
}

export function ControlForm({ open, onOpenChange, control, defaultRiskId }: ControlFormProps) {
  const { data: risks, isLoading: risksLoading } = useRisks()
  const { data: subprocesses } = useSubprocesses()
  const createControl = useCreateControl()
  const updateControl = useUpdateControl()

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
    if (control) {
      form.reset({
        risk_id: control.risk_id,
        control_name: control.control_name,
        control_type: control.control_type,
        frequency: control.frequency,
        automation: control.automation,
        key_control: control.key_control,
        description: control.description || '',
        owner: control.owner || '',
        testing_procedures: control.testing_procedures || '',
        status: control.status
      })
    } else {
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
        status: 'Draft'
      })
    }
  }, [control, defaultRiskId, form])

  // Get risk display name with subprocess context
  const getRiskDisplayName = (riskId: string) => {
    const risk = risks?.find(r => r.id === riskId)
    if (!risk) return 'Unknown Risk'

    const subprocess = subprocesses?.find(s => s.id === risk.subprocess_id)
    return `${risk.risk_name} (${subprocess?.subprocess_name || 'Unknown Subprocess'})`
  }

  const onSubmit = async (data: ControlFormData) => {
    try {
      const controlData: CreateControlData = {
        risk_id: data.risk_id,
        control_name: data.control_name,
        control_type: data.control_type,
        frequency: data.frequency,
        automation: data.automation,
        key_control: data.key_control,
        description: data.description || undefined,
        owner: data.owner || undefined,
        testing_procedures: data.testing_procedures || undefined
      }

      if (control) {
        await updateControl.mutateAsync({
          id: control.id,
          data: {
            ...controlData,
            status: data.status
          }
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

  const isLoading = createControl.isPending || updateControl.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{control ? 'Edit Control' : 'Create New Control'}</DialogTitle>
          <DialogDescription>
            {control ? 'Update the control information below.' : 'Add a new control to mitigate the selected risk.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="risk_id">Risk</Label>
            <Select
              value={form.watch('risk_id')}
              onValueChange={(value: string) => form.setValue('risk_id', value)}
              disabled={risksLoading || isLoading}
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
              placeholder="e.g., Management Review and Approval, System Access Controls"
              disabled={isLoading}
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
                onValueChange={(value: string) => form.setValue('control_type', value as 'Preventive' | 'Detective' | 'Corrective' | 'Compensating')}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select control type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Preventive">Preventive</SelectItem>
                  <SelectItem value="Detective">Detective</SelectItem>
                  <SelectItem value="Corrective">Corrective</SelectItem>
                  <SelectItem value="Compensating">Compensating</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="frequency">Frequency</Label>
              <Select
                value={form.watch('frequency')}
                onValueChange={(value: string) => form.setValue('frequency', value as 'Real-time' | 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly' | 'Annual' | 'Ad-hoc')}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Real-time">Real-time</SelectItem>
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
                onValueChange={(value: string) => form.setValue('automation', value as 'Manual' | 'Semi-Automated' | 'Automated')}
                disabled={isLoading}
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
            <div className="flex items-end gap-2 pb-2">
              <Checkbox
                id="key_control"
                checked={form.watch('key_control')}
                onCheckedChange={(checked) => form.setValue('key_control', checked as boolean)}
                disabled={isLoading}
              />
              <Label
                htmlFor="key_control"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Key Control
              </Label>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="owner">Control Owner</Label>
            <Input
              id="owner"
              {...form.register('owner')}
              placeholder="e.g., CFO, Controller, IT Manager"
              disabled={isLoading}
            />
            {form.formState.errors.owner && (
              <p className="text-sm text-red-600">{form.formState.errors.owner.message}</p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...form.register('description')}
              placeholder="Detailed description of the control..."
              disabled={isLoading}
              rows={3}
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
              disabled={isLoading}
              rows={3}
            />
            {form.formState.errors.testing_procedures && (
              <p className="text-sm text-red-600">{form.formState.errors.testing_procedures.message}</p>
            )}
          </div>
          {control && (
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={form.watch('status')}
                onValueChange={(value: string) => form.setValue('status', value as 'Draft' | 'Active' | 'Retired')}
                disabled={isLoading}
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
              {form.formState.errors.status && (
                <p className="text-sm text-red-600">{form.formState.errors.status.message}</p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (control ? 'Updating...' : 'Creating...') : (control ? 'Update Control' : 'Create Control')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}