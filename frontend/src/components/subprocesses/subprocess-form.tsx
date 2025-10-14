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
import { useCreateSubprocess, useUpdateSubprocess, type Subprocess, type CreateSubprocessData } from '@/hooks/use-subprocesses'
import { useProcesses } from '@/hooks/use-processes'
import { useCompanies } from '@/hooks/use-companies'
import { useEffect } from 'react'

const subprocessFormSchema = z.object({
  process_id: z.string().min(1, 'Process is required'),
  subprocess_name: z.string().min(2, 'Subprocess name must be at least 2 characters'),
  description: z.string().optional(),
  owner: z.string().optional(),
  status: z.enum(['Active', 'Inactive']).optional()
})

type SubprocessFormData = z.infer<typeof subprocessFormSchema>

interface SubprocessFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  subprocess?: Subprocess
  defaultProcessId?: string
}

export function SubprocessForm({ open, onOpenChange, subprocess, defaultProcessId }: SubprocessFormProps) {
  const { data: processes, isLoading: processesLoading } = useProcesses()
  const { data: companies } = useCompanies()
  const createSubprocess = useCreateSubprocess()
  const updateSubprocess = useUpdateSubprocess()

  const form = useForm<SubprocessFormData>({
    resolver: zodResolver(subprocessFormSchema),
    defaultValues: {
      process_id: defaultProcessId || '',
      subprocess_name: '',
      description: '',
      owner: '',
      status: 'Active'
    }
  })

  useEffect(() => {
    if (subprocess) {
      form.reset({
        process_id: subprocess.process_id,
        subprocess_name: subprocess.subprocess_name,
        description: subprocess.description || '',
        owner: subprocess.owner || '',
        status: subprocess.status
      })
    } else {
      form.reset({
        process_id: defaultProcessId || '',
        subprocess_name: '',
        description: '',
        owner: '',
        status: 'Active'
      })
    }
  }, [subprocess, defaultProcessId, form])

  // Get company name for process display
  const getProcessDisplayName = (processId: string) => {
    const process = processes?.find(p => p.id === processId)
    if (!process) return 'Unknown Process'

    const company = companies?.find(c => c.id === process.company_id)
    return `${process.process_name} (${company?.company_name || 'Unknown Company'})`
  }

  const onSubmit = async (data: SubprocessFormData) => {
    try {
      const subprocessData: CreateSubprocessData = {
        process_id: data.process_id,
        subprocess_name: data.subprocess_name,
        description: data.description || undefined,
        owner: data.owner || undefined
      }

      if (subprocess) {
        await updateSubprocess.mutateAsync({
          id: subprocess.id,
          data: {
            ...subprocessData,
            status: data.status
          }
        })
      } else {
        await createSubprocess.mutateAsync(subprocessData)
      }

      onOpenChange(false)
      form.reset()
    } catch (error) {
      console.error('Failed to save subprocess:', error)
    }
  }

  const isLoading = createSubprocess.isPending || updateSubprocess.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{subprocess ? 'Edit Subprocess' : 'Create New Subprocess'}</DialogTitle>
          <DialogDescription>
            {subprocess ? 'Update the subprocess information below.' : 'Add a new subprocess to the selected process.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="process_id">Process</Label>
            <Select
              value={form.watch('process_id')}
              onValueChange={(value: string) => form.setValue('process_id', value)}
              disabled={processesLoading || isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a process" />
              </SelectTrigger>
              <SelectContent>
                {processes?.map((process) => (
                  <SelectItem key={process.id} value={process.id}>
                    {getProcessDisplayName(process.id)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.process_id && (
              <p className="text-sm text-red-600">{form.formState.errors.process_id.message}</p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="subprocess_name">Subprocess Name</Label>
            <Input
              id="subprocess_name"
              {...form.register('subprocess_name')}
              placeholder="e.g., Customer Setup, Invoice Processing"
              disabled={isLoading}
            />
            {form.formState.errors.subprocess_name && (
              <p className="text-sm text-red-600">{form.formState.errors.subprocess_name.message}</p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="owner">Subprocess Owner</Label>
            <Input
              id="owner"
              {...form.register('owner')}
              placeholder="e.g., AR Specialist, AP Manager"
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
              placeholder="Brief description of the subprocess..."
              disabled={isLoading}
              rows={3}
            />
            {form.formState.errors.description && (
              <p className="text-sm text-red-600">{form.formState.errors.description.message}</p>
            )}
          </div>
          {subprocess && (
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
              {isLoading ? (subprocess ? 'Updating...' : 'Creating...') : (subprocess ? 'Update Subprocess' : 'Create Subprocess')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}