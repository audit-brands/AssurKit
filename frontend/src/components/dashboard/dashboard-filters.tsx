import { useState } from 'react'
import { type DashboardFilters } from '@/hooks/use-dashboard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Calendar,
  Filter,
  RotateCcw,
  Building,
  Settings
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface DashboardFiltersProps {
  filters: DashboardFilters
  onFiltersChange: (filters: DashboardFilters) => void
  className?: string
}

export function DashboardFilters({ filters, onFiltersChange, className }: DashboardFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [localFilters, setLocalFilters] = useState<DashboardFilters>(filters)

  // Mock data - in real app, these would come from API
  const businessUnits = [
    'Corporate',
    'North America',
    'Europe',
    'Asia Pacific',
    'Latin America'
  ]

  const processes = [
    { id: '1', name: 'Revenue Recognition' },
    { id: '2', name: 'Procurement' },
    { id: '3', name: 'Financial Reporting' },
    { id: '4', name: 'Payroll' },
    { id: '5', name: 'Fixed Assets' },
    { id: '6', name: 'Inventory Management' }
  ]

  const controlTypes = [
    'Preventive',
    'Detective',
    'Corrective',
    'Manual',
    'Automated',
    'IT General Controls',
    'Application Controls'
  ]

  const handleApplyFilters = () => {
    onFiltersChange(localFilters)
    setIsOpen(false)
  }

  const handleResetFilters = () => {
    const resetFilters: DashboardFilters = {
      period: 'current'
    }
    setLocalFilters(resetFilters)
    onFiltersChange(resetFilters)
    setIsOpen(false)
  }

  const updateLocalFilters = (updates: Partial<DashboardFilters>) => {
    setLocalFilters(prev => ({ ...prev, ...updates }))
  }

  const handleBusinessUnitChange = (unit: string, checked: boolean) => {
    const currentUnits = localFilters.business_unit || []
    if (checked) {
      updateLocalFilters({
        business_unit: [...currentUnits, unit]
      })
    } else {
      updateLocalFilters({
        business_unit: currentUnits.filter(u => u !== unit)
      })
    }
  }

  const handleProcessChange = (processId: string, checked: boolean) => {
    const currentProcesses = localFilters.process_ids || []
    if (checked) {
      updateLocalFilters({
        process_ids: [...currentProcesses, processId]
      })
    } else {
      updateLocalFilters({
        process_ids: currentProcesses.filter(id => id !== processId)
      })
    }
  }

  const handleControlTypeChange = (type: string, checked: boolean) => {
    const currentTypes = localFilters.control_types || []
    if (checked) {
      updateLocalFilters({
        control_types: [...currentTypes, type]
      })
    } else {
      updateLocalFilters({
        control_types: currentTypes.filter(t => t !== type)
      })
    }
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (filters.period && filters.period !== 'current') count++
    if (filters.start_date) count++
    if (filters.end_date) count++
    if (filters.business_unit?.length) count++
    if (filters.process_ids?.length) count++
    if (filters.control_types?.length) count++
    return count
  }

  return (
    <Card className={cn(className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Dashboard Filters
            </CardTitle>
            <CardDescription>
              Customize the dashboard view and reporting period
            </CardDescription>
          </div>
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Filters
                {getActiveFiltersCount() > 0 && (
                  <span className="ml-2 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {getActiveFiltersCount()}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-96 p-0" align="end">
              <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Filter Options</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleResetFilters}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset
                  </Button>
                </div>
              </div>

              <div className="p-4 space-y-6 max-h-96 overflow-y-auto">
                {/* Time Period */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Time Period
                  </Label>
                  <Select
                    value={localFilters.period || 'current'}
                    onValueChange={(value) => updateLocalFilters({ period: value as DashboardFilters['period'] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="current">Current Period</SelectItem>
                      <SelectItem value="previous">Previous Period</SelectItem>
                      <SelectItem value="ytd">Year to Date</SelectItem>
                      <SelectItem value="custom">Custom Range</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Custom Date Range */}
                {localFilters.period === 'custom' && (
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="start-date">Start Date</Label>
                      <Input
                        id="start-date"
                        type="date"
                        value={localFilters.start_date || ''}
                        onChange={(e) => updateLocalFilters({ start_date: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="end-date">End Date</Label>
                      <Input
                        id="end-date"
                        type="date"
                        value={localFilters.end_date || ''}
                        onChange={(e) => updateLocalFilters({ end_date: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                {/* Business Units */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Business Units
                  </Label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {businessUnits.map((unit) => (
                      <div key={unit} className="flex items-center space-x-2">
                        <Checkbox
                          id={`unit-${unit}`}
                          checked={localFilters.business_unit?.includes(unit) || false}
                          onCheckedChange={(checked) => handleBusinessUnitChange(unit, checked as boolean)}
                        />
                        <Label
                          htmlFor={`unit-${unit}`}
                          className="text-sm font-normal"
                        >
                          {unit}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Processes */}
                <div className="space-y-2">
                  <Label>Processes</Label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {processes.map((process) => (
                      <div key={process.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`process-${process.id}`}
                          checked={localFilters.process_ids?.includes(process.id) || false}
                          onCheckedChange={(checked) => handleProcessChange(process.id, checked as boolean)}
                        />
                        <Label
                          htmlFor={`process-${process.id}`}
                          className="text-sm font-normal"
                        >
                          {process.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Control Types */}
                <div className="space-y-2">
                  <Label>Control Types</Label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {controlTypes.map((type) => (
                      <div key={type} className="flex items-center space-x-2">
                        <Checkbox
                          id={`type-${type}`}
                          checked={localFilters.control_types?.includes(type) || false}
                          onCheckedChange={(checked) => handleControlTypeChange(type, checked as boolean)}
                        />
                        <Label
                          htmlFor={`type-${type}`}
                          className="text-sm font-normal"
                        >
                          {type}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-4 border-t flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleApplyFilters}>
                  Apply Filters
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Quick Filter Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant={filters.period === 'current' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onFiltersChange({ ...filters, period: 'current' })}
          >
            Current Period
          </Button>
          <Button
            variant={filters.period === 'previous' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onFiltersChange({ ...filters, period: 'previous' })}
          >
            Previous Period
          </Button>
          <Button
            variant={filters.period === 'ytd' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onFiltersChange({ ...filters, period: 'ytd' })}
          >
            Year to Date
          </Button>
        </div>

        {/* Active Filters Display */}
        {getActiveFiltersCount() > 0 && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-900">
                {getActiveFiltersCount()} filter{getActiveFiltersCount() !== 1 ? 's' : ''} active
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="text-blue-700 hover:text-blue-900"
              >
                Clear all
              </Button>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {filters.business_unit?.map(unit => (
                <span key={unit} className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                  {unit}
                </span>
              ))}
              {filters.process_ids?.map(id => {
                const process = processes.find(p => p.id === id)
                return process ? (
                  <span key={id} className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                    {process.name}
                  </span>
                ) : null
              })}
              {filters.control_types?.map(type => (
                <span key={type} className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                  {type}
                </span>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}