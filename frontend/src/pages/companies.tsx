import { CompanyTable } from '@/components/companies/company-table'

export function CompaniesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Companies</h1>
        <p className="text-gray-600">Manage companies in your SOX compliance program</p>
      </div>

      <CompanyTable />
    </div>
  )
}