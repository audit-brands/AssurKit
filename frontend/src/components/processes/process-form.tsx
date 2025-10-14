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
import { useCreateProcess, useUpdateProcess, type Process, type CreateProcessData } from '@/hooks/use-processes'
import { useCompanies } from '@/hooks/use-companies'
import { useEffect } from 'react'

const processFormSchema = z.object({
  company_id: z.string().min(1, 'Company is required'),
  process_name: z.string().min(2, 'Process name must be at least 2 characters'),
  description: z.string().optional(),
  owner: z.string().optional(),
  status: z.enum(['Active', 'Inactive']).optional()
})

type ProcessFormData = z.infer<typeof processFormSchema>

interface ProcessFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  process?: Process
  defaultCompanyId?: string
}

export function ProcessForm({ open, onOpenChange, process, defaultCompanyId }: ProcessFormProps) {
  const { data: companies, isLoading: companiesLoading } = useCompanies()
  const createProcess = useCreateProcess()
  const updateProcess = useUpdateProcess()

  const form = useForm<ProcessFormData>({
    resolver: zodResolver(processFormSchema),
    defaultValues: {
      company_id: defaultCompanyId || '',
      process_name: '',
      description: '',
      owner: '',
      status: 'Active'
    }
  })

  useEffect(() => {
    if (process) {
      form.reset({
        company_id: process.company_id,
        process_name: process.process_name,
        description: process.description || '',
        owner: process.owner || '',
        status: process.status
      })
    } else {
      form.reset({
        company_id: defaultCompanyId || '',
        process_name: '',
        description: '',
        owner: '',
        status: 'Active'
      })
    }
  }, [process, defaultCompanyId, form])

  const onSubmit = async (data: ProcessFormData) => {
    try {
      const processData: CreateProcessData = {
        company_id: data.company_id,
        process_name: data.process_name,
        description: data.description || undefined,
        owner: data.owner || undefined
      }

      if (process) {
        await updateProcess.mutateAsync({
          id: process.id,
          data: {
            ...processData,
            status: data.status
          }
        })
      } else {
        await createProcess.mutateAsync(processData)
      }

      onOpenChange(false)
      form.reset()
    } catch (error) {
      console.error('Failed to save process:', error)
    }
  }

  const isLoading = createProcess.isPending || updateProcess.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{process ? 'Edit Process' : 'Create New Process'}</DialogTitle>
          <DialogDescription>
            {process ? 'Update the process information below.' : 'Add a new process to the selected company.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="company_id">Company</Label>
            <Select
              value={form.watch('company_id')}
              onValueChange={(value: string) => form.setValue('company_id', value)}
              disabled={companiesLoading || isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a company" />
              </SelectTrigger>
              <SelectContent>
                {companies?.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.company_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.company_id && (
              <p className="text-sm text-red-600">{form.formState.errors.company_id.message}</p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="process_name">Process Name</Label>
            <Input
              id="process_name"
              {...form.register('process_name')}
              placeholder="e.g., Revenue Recognition, Accounts Payable"
              disabled={isLoading}
            />
            {form.formState.errors.process_name && (
              <p className="text-sm text-red-600">{form.formState.errors.process_name.message}</p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="owner">Process Owner</Label>
            <Input
              id="owner"
              {...form.register('owner')}
              placeholder="e.g., Finance Manager, Controller"
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
              placeholder="Brief description of the process..."
              disabled={isLoading}
              rows={3}
            />
            {form.formState.errors.description && (
              <p className="text-sm text-red-600">{form.formState.errors.description.message}</p>
            )}
          </div>
          {process && (
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
              {isLoading ? (process ? 'Updating...' : 'Creating...') : (process ? 'Update Process' : 'Create Process')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}