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
import { useCreateRisk, useUpdateRisk, type Risk, type CreateRiskData } from '@/hooks/use-risks'
import { useSubprocesses } from '@/hooks/use-subprocesses'
import { useProcesses } from '@/hooks/use-processes'
import { useCompanies } from '@/hooks/use-companies'
import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

const riskFormSchema = z.object({
  subprocess_id: z.string().min(1, 'Subprocess is required'),
  risk_name: z.string().min(2, 'Risk name must be at least 2 characters'),
  description: z.string().optional(),
  risk_category: z.string().optional(),
  assertions: z.array(z.string()).optional(),
  impact: z.enum(['Low', 'Medium', 'High', 'Critical']).optional(),
  likelihood: z.enum(['Rare', 'Unlikely', 'Possible', 'Likely', 'Almost Certain']).optional(),
  status: z.enum(['Active', 'Inactive']).optional()
})

type RiskFormData = z.infer<typeof riskFormSchema>

interface RiskFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  risk?: Risk
  defaultSubprocessId?: string
}

const RISK_CATEGORIES = [
  'Financial Reporting',
  'Operational',
  'Compliance',
  'Strategic',
  'Technology',
  'Fraud',
  'Regulatory',
  'Reputational'
]

export function RiskForm({ open, onOpenChange, risk, defaultSubprocessId }: RiskFormProps) {
  const { data: subprocesses, isLoading: subprocessesLoading } = useSubprocesses()
  const { data: processes } = useProcesses()
  const { data: companies } = useCompanies()
  const createRisk = useCreateRisk()
  const updateRisk = useUpdateRisk()
  const [assertions, setAssertions] = useState<string[]>([])
  const [newAssertion, setNewAssertion] = useState('')

  const form = useForm<RiskFormData>({
    resolver: zodResolver(riskFormSchema),
    defaultValues: {
      subprocess_id: defaultSubprocessId || '',
      risk_name: '',
      description: '',
      risk_category: '',
      assertions: [],
      impact: 'Medium',
      likelihood: 'Possible',
      status: 'Active'
    }
  })

  useEffect(() => {
    if (risk) {
      form.reset({
        subprocess_id: risk.subprocess_id,
        risk_name: risk.risk_name,
        description: risk.description || '',
        risk_category: risk.risk_category || '',
        assertions: risk.assertions || [],
        impact: risk.impact || 'Medium',
        likelihood: risk.likelihood || 'Possible',
        status: risk.status
      })
      setAssertions(risk.assertions || [])
    } else {
      form.reset({
        subprocess_id: defaultSubprocessId || '',
        risk_name: '',
        description: '',
        risk_category: '',
        assertions: [],
        impact: 'Medium',
        likelihood: 'Possible',
        status: 'Active'
      })
      setAssertions([])
    }
  }, [risk, defaultSubprocessId, form])

  // Get subprocess display name with full hierarchy
  const getSubprocessDisplayName = (subprocessId: string) => {
    const subprocess = subprocesses?.find(s => s.id === subprocessId)
    if (!subprocess) return 'Unknown Subprocess'

    const process = processes?.find(p => p.id === subprocess.process_id)
    if (!process) return subprocess.subprocess_name

    const company = companies?.find(c => c.id === process.company_id)
    return `${subprocess.subprocess_name} (${process.process_name} - ${company?.company_name || 'Unknown'})`
  }

  const handleAddAssertion = () => {
    if (newAssertion.trim()) {
      const updatedAssertions = [...assertions, newAssertion.trim()]
      setAssertions(updatedAssertions)
      form.setValue('assertions', updatedAssertions)
      setNewAssertion('')
    }
  }

  const handleRemoveAssertion = (index: number) => {
    const updatedAssertions = assertions.filter((_, i) => i !== index)
    setAssertions(updatedAssertions)
    form.setValue('assertions', updatedAssertions)
  }

  const onSubmit = async (data: RiskFormData) => {
    try {
      const riskData: CreateRiskData = {
        subprocess_id: data.subprocess_id,
        risk_name: data.risk_name,
        description: data.description || undefined,
        risk_category: data.risk_category || undefined,
        assertions: assertions.length > 0 ? assertions : undefined,
        impact: data.impact,
        likelihood: data.likelihood
      }

      if (risk) {
        await updateRisk.mutateAsync({
          id: risk.id,
          data: {
            ...riskData,
            status: data.status
          }
        })
      } else {
        await createRisk.mutateAsync(riskData)
      }

      onOpenChange(false)
      form.reset()
      setAssertions([])
    } catch (error) {
      console.error('Failed to save risk:', error)
    }
  }

  const isLoading = createRisk.isPending || updateRisk.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{risk ? 'Edit Risk' : 'Create New Risk'}</DialogTitle>
          <DialogDescription>
            {risk ? 'Update the risk information below.' : 'Add a new risk to the selected subprocess.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="subprocess_id">Subprocess</Label>
            <Select
              value={form.watch('subprocess_id')}
              onValueChange={(value: string) => form.setValue('subprocess_id', value)}
              disabled={subprocessesLoading || isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a subprocess" />
              </SelectTrigger>
              <SelectContent>
                {subprocesses?.map((subprocess) => (
                  <SelectItem key={subprocess.id} value={subprocess.id}>
                    {getSubprocessDisplayName(subprocess.id)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.subprocess_id && (
              <p className="text-sm text-red-600">{form.formState.errors.subprocess_id.message}</p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="risk_name">Risk Name</Label>
            <Input
              id="risk_name"
              {...form.register('risk_name')}
              placeholder="e.g., Revenue Recognition Error, Unauthorized Access"
              disabled={isLoading}
            />
            {form.formState.errors.risk_name && (
              <p className="text-sm text-red-600">{form.formState.errors.risk_name.message}</p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="risk_category">Risk Category</Label>
            <Select
              value={form.watch('risk_category')}
              onValueChange={(value: string) => form.setValue('risk_category', value)}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a risk category" />
              </SelectTrigger>
              <SelectContent>
                {RISK_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="impact">Impact</Label>
              <Select
                value={form.watch('impact')}
                onValueChange={(value: string) => form.setValue('impact', value as 'Low' | 'Medium' | 'High' | 'Critical')}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select impact level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="likelihood">Likelihood</Label>
              <Select
                value={form.watch('likelihood')}
                onValueChange={(value: string) => form.setValue('likelihood', value as 'Rare' | 'Unlikely' | 'Possible' | 'Likely' | 'Almost Certain')}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select likelihood" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Rare">Rare</SelectItem>
                  <SelectItem value="Unlikely">Unlikely</SelectItem>
                  <SelectItem value="Possible">Possible</SelectItem>
                  <SelectItem value="Likely">Likely</SelectItem>
                  <SelectItem value="Almost Certain">Almost Certain</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="assertions">Financial Assertions</Label>
            <div className="flex gap-2">
              <Input
                placeholder="e.g., Completeness, Accuracy, Existence"
                value={newAssertion}
                onChange={(e) => setNewAssertion(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddAssertion())}
                disabled={isLoading}
              />
              <Button type="button" onClick={handleAddAssertion} disabled={isLoading}>
                Add
              </Button>
            </div>
            {assertions.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {assertions.map((assertion, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-md text-sm"
                  >
                    <span>{assertion}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveAssertion(index)}
                      className="text-gray-500 hover:text-red-600"
                      disabled={isLoading}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...form.register('description')}
              placeholder="Detailed description of the risk..."
              disabled={isLoading}
              rows={3}
            />
            {form.formState.errors.description && (
              <p className="text-sm text-red-600">{form.formState.errors.description.message}</p>
            )}
          </div>
          {risk && (
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={form.watch('status')}
                onValueChange={(value: string) => form.setValue('status', value as 'Active' | 'Inactive')}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
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
              {isLoading ? (risk ? 'Updating...' : 'Creating...') : (risk ? 'Update Risk' : 'Create Risk')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}