import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useCreateCompany, useUpdateCompany, type Company, type CreateCompanyData, type UpdateCompanyData } from '@/hooks/use-companies'
import { useEffect } from 'react'

const companyFormSchema = z.object({
  company_name: z.string().min(2, 'Company name must be at least 2 characters'),
  industry: z.string().min(2, 'Industry must be at least 2 characters'),
  country: z.string().min(2, 'Country must be at least 2 characters'),
  description: z.string().optional(),
  status: z.enum(['Active', 'Inactive']).optional()
})

type CompanyFormData = z.infer<typeof companyFormSchema>

interface CompanyFormProps {
  company?: Company
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function CompanyForm({ company, open, onOpenChange, onSuccess }: CompanyFormProps) {
  const isEditing = !!company
  const createCompany = useCreateCompany()
  const updateCompany = useUpdateCompany()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CompanyFormData>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: {
      company_name: '',
      industry: '',
      country: '',
      description: '',
      status: 'Active'
    }
  })

  // Reset form when company changes
  useEffect(() => {
    if (company) {
      reset({
        company_name: company.company_name,
        industry: company.industry,
        country: company.country,
        description: company.description || '',
        status: company.status
      })
    } else {
      reset({
        company_name: '',
        industry: '',
        country: '',
        description: '',
        status: 'Active'
      })
    }
  }, [company, reset])

  const onSubmit = async (data: CompanyFormData) => {
    try {
      if (isEditing && company) {
        await updateCompany.mutateAsync({
          id: company.id,
          data: data as UpdateCompanyData
        })
      } else {
        await createCompany.mutateAsync(data as CreateCompanyData)
      }

      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      // Error handling is managed by the mutations
      console.error('Error submitting company form:', error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Company' : 'Add New Company'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the company information below.'
              : 'Enter the company information below to create a new company.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="company_name">Company Name</Label>
              <Input
                id="company_name"
                {...register('company_name')}
                placeholder="Enter company name"
                disabled={isSubmitting}
              />
              {errors.company_name && (
                <p className="text-sm text-red-600">{errors.company_name.message}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="industry">Industry</Label>
              <Input
                id="industry"
                {...register('industry')}
                placeholder="Enter industry"
                disabled={isSubmitting}
              />
              {errors.industry && (
                <p className="text-sm text-red-600">{errors.industry.message}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                {...register('country')}
                placeholder="Enter country"
                disabled={isSubmitting}
              />
              {errors.country && (
                <p className="text-sm text-red-600">{errors.country.message}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                {...register('description')}
                placeholder="Enter description (optional)"
                disabled={isSubmitting}
              />
            </div>

            {isEditing && (
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  {...register('status')}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? (isEditing ? 'Updating...' : 'Creating...')
                : (isEditing ? 'Update Company' : 'Create Company')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}