import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { CompanyForm } from './company-form'
import { useCompanies, useDeleteCompany, type Company } from '@/hooks/use-companies'
import { Plus, Pencil, Trash2, Building2 } from 'lucide-react'

export function CompanyTable() {
  const [selectedCompany, setSelectedCompany] = useState<Company | undefined>()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [companyToDelete, setCompanyToDelete] = useState<Company | undefined>()

  const { data: companies, isLoading, error } = useCompanies()
  const deleteCompany = useDeleteCompany()

  const handleEdit = (company: Company) => {
    setSelectedCompany(company)
    setIsFormOpen(true)
  }

  const handleAdd = () => {
    setSelectedCompany(undefined)
    setIsFormOpen(true)
  }

  const handleDelete = (company: Company) => {
    setCompanyToDelete(company)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (companyToDelete) {
      try {
        await deleteCompany.mutateAsync(companyToDelete.id)
        setIsDeleteDialogOpen(false)
        setCompanyToDelete(undefined)
      } catch (error) {
        console.error('Error deleting company:', error)
      }
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <p className="text-red-600 mb-2">Error loading companies</p>
            <p className="text-sm text-gray-500">Please try refreshing the page</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Companies
              </CardTitle>
              <CardDescription>
                Manage your organization's companies and their information
              </CardDescription>
            </div>
            <Button onClick={handleAdd} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Company
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Loading companies...</p>
              </div>
            </div>
          ) : !companies || companies.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No companies found</h3>
              <p className="text-gray-500 mb-4">Get started by creating your first company</p>
              <Button onClick={handleAdd}>
                <Plus className="h-4 w-4 mr-2" />
                Add Company
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company Name</TableHead>
                  <TableHead>Industry</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div className="font-semibold">{company.company_name}</div>
                        {company.description && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {company.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{company.industry}</TableCell>
                    <TableCell>{company.country}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          company.status === 'Active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {company.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-gray-500">
                      {formatDate(company.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(company)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(company)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
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

      {/* Company Form Dialog */}
      <CompanyForm
        company={selectedCompany}
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSuccess={() => {
          setSelectedCompany(undefined)
        }}
      />

      {/* Delete Confirmation Dialog */}
      {isDeleteDialogOpen && companyToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Company</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete "{companyToDelete.company_name}"? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDeleteDialogOpen(false)
                  setCompanyToDelete(undefined)
                }}
                disabled={deleteCompany.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDelete}
                disabled={deleteCompany.isPending}
              >
                {deleteCompany.isPending ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}