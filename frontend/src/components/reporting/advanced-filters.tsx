import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Collapsible,
  CollapsibleContent,
} from '@/components/ui/collapsible'
import {
  Filter,
  CalendarIcon,
  Save,
  FolderOpen,
  ChevronDown,
  ChevronUp,
  RefreshCw
} from 'lucide-react'
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns'

const filterSchema = z.object({
  // Date Range
  dateRange: z.object({
    from: z.date().optional(),
    to: z.date().optional(),
    preset: z.enum(['custom', 'last-7-days', 'last-30-days', 'last-3-months', 'last-6-months', 'current-year', 'last-year']).optional()
  }).optional(),

  // Entity Filters
  processes: z.array(z.string()).optional(),
  controls: z.array(z.string()).optional(),
  tests: z.array(z.string()).optional(),

  // Status Filters
  testStatuses: z.array(z.enum(['planned', 'in_progress', 'submitted', 'in_review', 'concluded'])).optional(),
  issueStatuses: z.array(z.enum(['open', 'in_remediation', 'ready_for_retest', 'closed'])).optional(),
  controlStatuses: z.array(z.enum(['draft', 'active', 'retired'])).optional(),

  // Severity & Priority
  issueSeverities: z.array(z.enum(['low', 'medium', 'high', 'critical'])).optional(),
  reviewPriorities: z.array(z.enum(['low', 'medium', 'high', 'urgent'])).optional(),

  // Risk & Control Attributes
  controlTypes: z.array(z.string()).optional(),
  automationLevels: z.array(z.enum(['manual', 'automated', 'hybrid'])).optional(),
  keyControlsOnly: z.boolean().optional(),

  // Test & Evidence
  testMethods: z.array(z.string()).optional(),
  evidenceTypes: z.array(z.string()).optional(),
  confidentialityLevels: z.array(z.enum(['public', 'internal', 'confidential', 'restricted'])).optional(),

  // User & Assignment
  assignedUsers: z.array(z.string()).optional(),
  reviewers: z.array(z.string()).optional(),
  createdBy: z.array(z.string()).optional(),

  // Custom Fields
  customFilters: z.record(z.string(), z.unknown()).optional()
})

export type ReportingFilters = z.infer<typeof filterSchema>

export interface SavedFilter {
  id: string
  name: string
  description?: string
  filters: ReportingFilters
  is_public: boolean
  created_by: string
  created_at: string
  updated_at: string
}

interface AdvancedFiltersProps {
  initialFilters?: ReportingFilters
  onFiltersChange: (filters: ReportingFilters) => void
  onSaveFilter?: (filter: Omit<SavedFilter, 'id' | 'created_at' | 'updated_at'>) => void
  savedFilters?: SavedFilter[]
}

const DATE_PRESETS = [
  { value: 'last-7-days', label: 'Last 7 Days' },
  { value: 'last-30-days', label: 'Last 30 Days' },
  { value: 'last-3-months', label: 'Last 3 Months' },
  { value: 'last-6-months', label: 'Last 6 Months' },
  { value: 'current-year', label: 'Current Year' },
  { value: 'last-year', label: 'Last Year' },
  { value: 'custom', label: 'Custom Range' },
]

export function AdvancedFilters({
  initialFilters,
  onFiltersChange,
  onSaveFilter,
  savedFilters = []
}: AdvancedFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeFiltersCount, setActiveFiltersCount] = useState(0)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [saveFilterName, setSaveFilterName] = useState('')
  const [saveFilterDescription, setSaveFilterDescription] = useState('')

  const form = useForm<ReportingFilters>({
    resolver: zodResolver(filterSchema),
    defaultValues: initialFilters || {}
  })

  const watchedValues = form.watch()

  useEffect(() => {
    // Count active filters
    let count = 0
    if (watchedValues.dateRange?.from || watchedValues.dateRange?.to) count++
    if (watchedValues.processes?.length) count++
    if (watchedValues.controls?.length) count++
    if (watchedValues.testStatuses?.length) count++
    if (watchedValues.issueStatuses?.length) count++
    if (watchedValues.issueSeverities?.length) count++
    if (watchedValues.controlTypes?.length) count++
    if (watchedValues.assignedUsers?.length) count++
    if (watchedValues.keyControlsOnly) count++

    setActiveFiltersCount(count)
    onFiltersChange(watchedValues)
  }, [watchedValues, onFiltersChange])

  const applyDatePreset = (preset: string) => {
    const now = new Date()
    let from: Date | undefined
    let to: Date | undefined

    switch (preset) {
      case 'last-7-days':
        from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        to = now
        break
      case 'last-30-days':
        from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        to = now
        break
      case 'last-3-months':
        from = subMonths(startOfMonth(now), 3)
        to = endOfMonth(now)
        break
      case 'last-6-months':
        from = subMonths(startOfMonth(now), 6)
        to = endOfMonth(now)
        break
      case 'current-year':
        from = new Date(now.getFullYear(), 0, 1)
        to = now
        break
      case 'last-year':
        from = new Date(now.getFullYear() - 1, 0, 1)
        to = new Date(now.getFullYear() - 1, 11, 31)
        break
    }

    if (from && to) {
      form.setValue('dateRange', { from, to, preset: preset as 'custom' | 'last-7-days' | 'last-30-days' | 'last-3-months' | 'last-6-months' | 'current-year' | 'last-year' })
    }
  }

  const loadSavedFilter = (savedFilter: SavedFilter) => {
    form.reset(savedFilter.filters)
    setIsExpanded(false)
  }

  const saveCurrentFilter = () => {
    if (!onSaveFilter || !saveFilterName.trim()) return

    onSaveFilter({
      name: saveFilterName.trim(),
      description: saveFilterDescription.trim() || undefined,
      filters: watchedValues,
      is_public: false,
      created_by: 'current-user' // This would come from auth context
    })

    setSaveFilterName('')
    setSaveFilterDescription('')
    setShowSaveDialog(false)
  }

  const clearAllFilters = () => {
    form.reset({})
  }

  const hasActiveFilters = activeFiltersCount > 0

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            <CardTitle>Advanced Filters</CardTitle>
            {hasActiveFilters && (
              <Badge variant="secondary">
                {activeFiltersCount} active
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {savedFilters.length > 0 && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <FolderOpen className="h-4 w-4 mr-2" />
                    Saved Filters
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-2">
                    <h4 className="font-medium">Load Saved Filter</h4>
                    {savedFilters.map(filter => (
                      <div
                        key={filter.id}
                        className="flex items-center justify-between p-2 border rounded cursor-pointer hover:bg-muted"
                        onClick={() => loadSavedFilter(filter)}
                      >
                        <div>
                          <div className="font-medium text-sm">{filter.name}</div>
                          {filter.description && (
                            <div className="text-xs text-muted-foreground">{filter.description}</div>
                          )}
                        </div>
                        {filter.is_public && <Badge variant="outline" className="text-xs">Public</Badge>}
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Quick Actions */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={clearAllFilters}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Clear All
            </Button>
            {onSaveFilter && (
              <Button variant="outline" size="sm" onClick={() => setShowSaveDialog(true)}>
                <Save className="h-4 w-4 mr-2" />
                Save Filter
              </Button>
            )}
          </div>
        )}
      </CardHeader>

      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleContent>
          <CardContent>
            <Tabs defaultValue="date-entity" className="space-y-4">
              <TabsList>
                <TabsTrigger value="date-entity">Date & Entity</TabsTrigger>
                <TabsTrigger value="status">Status & Severity</TabsTrigger>
                <TabsTrigger value="attributes">Attributes</TabsTrigger>
                <TabsTrigger value="users">Users & Assignment</TabsTrigger>
              </TabsList>

              <TabsContent value="date-entity" className="space-y-4">
                {/* Date Range */}
                <div className="space-y-2">
                  <Label>Date Range</Label>
                  <div className="flex gap-2 mb-2">
                    {DATE_PRESETS.map(preset => (
                      <Button
                        key={preset.value}
                        variant={watchedValues.dateRange?.preset === preset.value ? "default" : "outline"}
                        size="sm"
                        onClick={() => applyDatePreset(preset.value)}
                      >
                        {preset.label}
                      </Button>
                    ))}
                  </div>
                  {watchedValues.dateRange?.preset === 'custom' && (
                    <div className="flex gap-2">
                      <Controller
                        name="dateRange.from"
                        control={form.control}
                        render={({ field }) => (
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className="justify-start text-left font-normal">
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {field.value ? format(field.value, 'PPP') : 'From date'}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        )}
                      />
                      <Controller
                        name="dateRange.to"
                        control={form.control}
                        render={({ field }) => (
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className="justify-start text-left font-normal">
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {field.value ? format(field.value, 'PPP') : 'To date'}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        )}
                      />
                    </div>
                  )}
                </div>

                {/* Entity Filters */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Processes</Label>
                    <Input placeholder="Search processes..." />
                  </div>
                  <div className="space-y-2">
                    <Label>Controls</Label>
                    <Input placeholder="Search controls..." />
                  </div>
                  <div className="space-y-2">
                    <Label>Tests</Label>
                    <Input placeholder="Search tests..." />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="status" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Test Statuses */}
                  <div className="space-y-2">
                    <Label>Test Status</Label>
                    <div className="space-y-2">
                      {['planned', 'in_progress', 'submitted', 'in_review', 'concluded'].map(status => (
                        <div key={status} className="flex items-center space-x-2">
                          <Controller
                            name="testStatuses"
                            control={form.control}
                            render={({ field }) => (
                              <Checkbox
                                checked={(field.value || []).includes(status as 'planned' | 'in_progress' | 'submitted' | 'in_review' | 'concluded')}
                                onCheckedChange={(checked) => {
                                  const current = field.value || []
                                  if (checked) {
                                    field.onChange([...current, status as 'planned' | 'submitted' | 'concluded' | 'in_review' | 'in_progress'])
                                  } else {
                                    field.onChange(current.filter((s: string) => s !== status))
                                  }
                                }}
                              />
                            )}
                          />
                          <Label className="capitalize">{status.replace('_', ' ')}</Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Issue Severities */}
                  <div className="space-y-2">
                    <Label>Issue Severity</Label>
                    <div className="space-y-2">
                      {['low', 'medium', 'high', 'critical'].map(severity => (
                        <div key={severity} className="flex items-center space-x-2">
                          <Controller
                            name="issueSeverities"
                            control={form.control}
                            render={({ field }) => (
                              <Checkbox
                                checked={(field.value || []).includes(severity as 'low' | 'medium' | 'high' | 'critical')}
                                onCheckedChange={(checked) => {
                                  const current = field.value || []
                                  if (checked) {
                                    field.onChange([...current, severity as 'low' | 'medium' | 'high' | 'critical'])
                                  } else {
                                    field.onChange(current.filter((s: string) => s !== severity))
                                  }
                                }}
                              />
                            )}
                          />
                          <Label className="capitalize">{severity}</Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Review Priorities */}
                  <div className="space-y-2">
                    <Label>Review Priority</Label>
                    <div className="space-y-2">
                      {['low', 'medium', 'high', 'urgent'].map(priority => (
                        <div key={priority} className="flex items-center space-x-2">
                          <Controller
                            name="reviewPriorities"
                            control={form.control}
                            render={({ field }) => (
                              <Checkbox
                                checked={(field.value || []).includes(priority as 'low' | 'medium' | 'high' | 'urgent')}
                                onCheckedChange={(checked) => {
                                  const current = field.value || []
                                  if (checked) {
                                    field.onChange([...current, priority as 'low' | 'medium' | 'high' | 'urgent'])
                                  } else {
                                    field.onChange(current.filter((p: string) => p !== priority))
                                  }
                                }}
                              />
                            )}
                          />
                          <Label className="capitalize">{priority}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="attributes" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Control Attributes */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Control Attributes</h4>

                    <div className="space-y-2">
                      <Label>Automation Level</Label>
                      <div className="space-y-2">
                        {['manual', 'automated', 'hybrid'].map(level => (
                          <div key={level} className="flex items-center space-x-2">
                            <Controller
                              name="automationLevels"
                              control={form.control}
                              render={({ field }) => (
                                <Checkbox
                                  checked={(field.value || []).includes(level as 'manual' | 'automated' | 'hybrid')}
                                  onCheckedChange={(checked) => {
                                    const current = field.value || []
                                    if (checked) {
                                      field.onChange([...current, level as 'manual' | 'automated' | 'hybrid'])
                                    } else {
                                      field.onChange(current.filter((l: string) => l !== level))
                                    }
                                  }}
                                />
                              )}
                            />
                            <Label className="capitalize">{level}</Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Controller
                        name="keyControlsOnly"
                        control={form.control}
                        render={({ field }) => (
                          <Checkbox
                            checked={field.value || false}
                            onCheckedChange={field.onChange}
                          />
                        )}
                      />
                      <Label>Key Controls Only</Label>
                    </div>
                  </div>

                  {/* Evidence Attributes */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Evidence Attributes</h4>

                    <div className="space-y-2">
                      <Label>Confidentiality Level</Label>
                      <div className="space-y-2">
                        {['public', 'internal', 'confidential', 'restricted'].map(level => (
                          <div key={level} className="flex items-center space-x-2">
                            <Controller
                              name="confidentialityLevels"
                              control={form.control}
                              render={({ field }) => (
                                <Checkbox
                                  checked={(field.value || []).includes(level as 'public' | 'internal' | 'confidential' | 'restricted')}
                                  onCheckedChange={(checked) => {
                                    const current = field.value || []
                                    if (checked) {
                                      field.onChange([...current, level as 'public' | 'internal' | 'confidential' | 'restricted'])
                                    } else {
                                      field.onChange(current.filter((l: string) => l !== level))
                                    }
                                  }}
                                />
                              )}
                            />
                            <Label className="capitalize">{level}</Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="users" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Assigned Users</Label>
                    <Input placeholder="Search users..." />
                  </div>
                  <div className="space-y-2">
                    <Label>Reviewers</Label>
                    <Input placeholder="Search reviewers..." />
                  </div>
                  <div className="space-y-2">
                    <Label>Created By</Label>
                    <Input placeholder="Search creators..." />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>

      {/* Save Filter Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-96">
            <CardHeader>
              <CardTitle>Save Filter</CardTitle>
              <CardDescription>Save current filter settings for future use</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Filter Name</Label>
                <Input
                  value={saveFilterName}
                  onChange={(e) => setSaveFilterName(e.target.value)}
                  placeholder="Enter filter name..."
                />
              </div>
              <div className="space-y-2">
                <Label>Description (optional)</Label>
                <Input
                  value={saveFilterDescription}
                  onChange={(e) => setSaveFilterDescription(e.target.value)}
                  placeholder="Enter description..."
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={saveCurrentFilter} disabled={!saveFilterName.trim()}>
                  Save Filter
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </Card>
  )
}