import { useState, useEffect } from 'react'
import { useControls } from '@/hooks/use-controls'
import { useTestExecutions } from '@/hooks/use-tests'
import { useUsers } from '@/hooks/use-users'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
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
import {
  Search,
  Filter,
  X,
  AlertTriangle,
  User,
  Tag,
  ChevronDown,
  Clock
} from 'lucide-react'

interface IssueSearchProps {
  onFiltersChange: (filters: {
    control_id?: string
    test_execution_id?: string
    severity?: string
    status?: string
    issue_type?: string
    assigned_to?: string
    created_by?: string
    tags?: string[]
    search?: string
    overdue_only?: boolean
  }) => void
}

export function IssueSearch({ onFiltersChange }: IssueSearchProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedControl, setSelectedControl] = useState('')
  const [selectedTestExecution, setSelectedTestExecution] = useState('')
  const [selectedSeverity, setSelectedSeverity] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [selectedIssueType, setSelectedIssueType] = useState('')
  const [selectedAssignee, setSelectedAssignee] = useState('')
  const [selectedCreator, setSelectedCreator] = useState('')
  const [overdueOnly, setOverdueOnly] = useState(false)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)

  const { data: controls } = useControls()
  const { data: testExecutions } = useTestExecutions()
  const { data: users } = useUsers()

  const severityOptions = ['Low', 'Medium', 'High', 'Critical']
  const statusOptions = ['Open', 'In Remediation', 'Ready for Retest', 'Closed']
  const typeOptions = ['Exception', 'Deficiency', 'Observation', 'Recommendation']

  useEffect(() => {
    const filters: {
      search?: string
      control_id?: string
      test_execution_id?: string
      severity?: string
      status?: string
      issue_type?: string
      assigned_to?: string
      created_by?: string
      overdue_only?: boolean
      tags?: string[]
    } = {}

    if (searchTerm.trim()) filters.search = searchTerm.trim()
    if (selectedControl) filters.control_id = selectedControl
    if (selectedTestExecution) filters.test_execution_id = selectedTestExecution
    if (selectedSeverity) filters.severity = selectedSeverity
    if (selectedStatus) filters.status = selectedStatus
    if (selectedIssueType) filters.issue_type = selectedIssueType
    if (selectedAssignee) filters.assigned_to = selectedAssignee
    if (selectedCreator) filters.created_by = selectedCreator
    if (overdueOnly) filters.overdue_only = overdueOnly
    if (selectedTags.length > 0) filters.tags = selectedTags

    onFiltersChange(filters)
  }, [
    searchTerm,
    selectedControl,
    selectedTestExecution,
    selectedSeverity,
    selectedStatus,
    selectedIssueType,
    selectedAssignee,
    selectedCreator,
    overdueOnly,
    selectedTags,
    onFiltersChange
  ])

  const addTag = () => {
    if (tagInput.trim() && !selectedTags.includes(tagInput.trim())) {
      setSelectedTags(prev => [...prev, tagInput.trim()])
      setTagInput('')
    }
  }

  const removeTag = (tag: string) => {
    setSelectedTags(prev => prev.filter(t => t !== tag))
  }

  const clearAllFilters = () => {
    setSearchTerm('')
    setSelectedControl('')
    setSelectedTestExecution('')
    setSelectedSeverity('')
    setSelectedStatus('')
    setSelectedIssueType('')
    setSelectedAssignee('')
    setSelectedCreator('')
    setOverdueOnly(false)
    setSelectedTags([])
    setTagInput('')
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Critical': return 'text-red-600'
      case 'High': return 'text-orange-600'
      case 'Medium': return 'text-yellow-600'
      case 'Low': return 'text-blue-600'
      default: return 'text-gray-600'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open': return 'text-red-600'
      case 'In Remediation': return 'text-yellow-600'
      case 'Ready for Retest': return 'text-blue-600'
      case 'Closed': return 'text-green-600'
      default: return 'text-gray-600'
    }
  }

  const activeFilterCount = [
    searchTerm,
    selectedControl,
    selectedTestExecution,
    selectedSeverity,
    selectedStatus,
    selectedIssueType,
    selectedAssignee,
    selectedCreator,
    overdueOnly ? 'overdue' : '',
    selectedTags.length > 0 ? 'tags' : ''
  ].filter(Boolean).length

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Search & Filter Issues
        </CardTitle>
        <CardDescription>
          Find and filter issues by various criteria
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Bar */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by title, description, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Popover open={filtersOpen} onOpenChange={setFiltersOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="relative">
                <Filter className="h-4 w-4 mr-2" />
                Filters
                <ChevronDown className="h-4 w-4 ml-2" />
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-96 p-4" align="end">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Advanced Filters</Label>
                  {activeFilterCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAllFilters}
                      className="h-6 px-2 text-xs"
                    >
                      Clear All
                    </Button>
                  )}
                </div>

                {/* Control Filter */}
                <div>
                  <Label htmlFor="control-filter" className="text-sm">Control</Label>
                  <Select value={selectedControl} onValueChange={setSelectedControl}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select control" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All controls</SelectItem>
                      {controls?.map(control => (
                        <SelectItem key={control.id} value={control.id}>
                          {control.control_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Test Execution Filter */}
                <div>
                  <Label htmlFor="test-execution-filter" className="text-sm">Test Execution</Label>
                  <Select value={selectedTestExecution} onValueChange={setSelectedTestExecution}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select test execution" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All test executions</SelectItem>
                      {testExecutions?.map(execution => (
                        <SelectItem key={execution.id} value={execution.id}>
                          Test #{execution.id.slice(0, 8)} - {execution.tester}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Severity Filter */}
                <div>
                  <Label htmlFor="severity-filter" className="text-sm">Severity</Label>
                  <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select severity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All severities</SelectItem>
                      {severityOptions.map(severity => (
                        <SelectItem key={severity} value={severity}>
                          <div className="flex items-center gap-2">
                            <AlertTriangle className={`h-3 w-3 ${getSeverityColor(severity)}`} />
                            {severity}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Status Filter */}
                <div>
                  <Label htmlFor="status-filter" className="text-sm">Status</Label>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All statuses</SelectItem>
                      {statusOptions.map(status => (
                        <SelectItem key={status} value={status}>
                          <span className={getStatusColor(status)}>{status}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Issue Type Filter */}
                <div>
                  <Label htmlFor="type-filter" className="text-sm">Issue Type</Label>
                  <Select value={selectedIssueType} onValueChange={setSelectedIssueType}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select issue type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All types</SelectItem>
                      {typeOptions.map(type => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Assignee Filter */}
                <div>
                  <Label htmlFor="assignee-filter" className="text-sm">Assigned To</Label>
                  <Select value={selectedAssignee} onValueChange={setSelectedAssignee}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select assignee" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All users</SelectItem>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {users?.map(user => (
                        <SelectItem key={user.id} value={user.id}>
                          <div className="flex items-center gap-2">
                            <User className="h-3 w-3" />
                            {user.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Creator Filter */}
                <div>
                  <Label htmlFor="creator-filter" className="text-sm">Created By</Label>
                  <Select value={selectedCreator} onValueChange={setSelectedCreator}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select creator" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All users</SelectItem>
                      {users?.map(user => (
                        <SelectItem key={user.id} value={user.id}>
                          <div className="flex items-center gap-2">
                            <User className="h-3 w-3" />
                            {user.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Overdue Filter */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="overdue-filter"
                    checked={overdueOnly}
                    onCheckedChange={(checked) => setOverdueOnly(checked as boolean)}
                  />
                  <Label htmlFor="overdue-filter" className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-red-600" />
                    Overdue Issues Only
                  </Label>
                </div>

                {/* Tags Filter */}
                <div>
                  <Label htmlFor="tags-filter" className="text-sm">Tags</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="tags-filter"
                      placeholder="Add tag"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                      className="flex-1"
                    />
                    <Button type="button" onClick={addTag} variant="outline" size="sm">
                      <Tag className="h-4 w-4" />
                    </Button>
                  </div>
                  {selectedTags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {selectedTags.map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                          <button
                            onClick={() => removeTag(tag)}
                            className="ml-1 hover:text-red-600"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Active Filters Display */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap gap-2">
            {searchTerm && (
              <Badge variant="outline" className="gap-1">
                Search: {searchTerm}
                <button onClick={() => setSearchTerm('')}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {selectedControl && (
              <Badge variant="outline" className="gap-1">
                Control: {controls?.find(c => c.id === selectedControl)?.control_name}
                <button onClick={() => setSelectedControl('')}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {selectedTestExecution && (
              <Badge variant="outline" className="gap-1">
                Test: {testExecutions?.find(t => t.id === selectedTestExecution)?.id.slice(0, 8)}
                <button onClick={() => setSelectedTestExecution('')}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {selectedSeverity && (
              <Badge variant="outline" className="gap-1">
                <AlertTriangle className={`h-3 w-3 ${getSeverityColor(selectedSeverity)}`} />
                {selectedSeverity}
                <button onClick={() => setSelectedSeverity('')}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {selectedStatus && (
              <Badge variant="outline" className="gap-1">
                <span className={getStatusColor(selectedStatus)}>{selectedStatus}</span>
                <button onClick={() => setSelectedStatus('')}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {selectedIssueType && (
              <Badge variant="outline" className="gap-1">
                {selectedIssueType}
                <button onClick={() => setSelectedIssueType('')}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {selectedAssignee && (
              <Badge variant="outline" className="gap-1">
                <User className="h-3 w-3" />
                {selectedAssignee === 'unassigned'
                  ? 'Unassigned'
                  : users?.find(u => u.id === selectedAssignee)?.name
                }
                <button onClick={() => setSelectedAssignee('')}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {selectedCreator && (
              <Badge variant="outline" className="gap-1">
                Creator: {users?.find(u => u.id === selectedCreator)?.name}
                <button onClick={() => setSelectedCreator('')}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {overdueOnly && (
              <Badge variant="outline" className="gap-1">
                <Clock className="h-3 w-3 text-red-600" />
                Overdue Only
                <button onClick={() => setOverdueOnly(false)}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {selectedTags.map(tag => (
              <Badge key={tag} variant="outline" className="gap-1">
                <Tag className="h-3 w-3" />
                {tag}
                <button onClick={() => removeTag(tag)}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}