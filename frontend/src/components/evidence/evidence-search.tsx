import { useState, useEffect } from 'react'
import { useControls } from '@/hooks/use-controls'
import { useTestExecutions } from '@/hooks/use-tests'
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
  FileType,
  Shield,
  Tag,
  ChevronDown
} from 'lucide-react'

interface EvidenceSearchProps {
  onFiltersChange: (filters: {
    test_execution_id?: string
    control_id?: string
    tags?: string[]
    file_type?: string
    confidentiality_level?: string
    is_key_evidence?: boolean
    search?: string
  }) => void
}

export function EvidenceSearch({ onFiltersChange }: EvidenceSearchProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTestExecution, setSelectedTestExecution] = useState('')
  const [selectedControl, setSelectedControl] = useState('')
  const [selectedFileType, setSelectedFileType] = useState('')
  const [selectedConfidentiality, setSelectedConfidentiality] = useState('')
  const [isKeyEvidence, setIsKeyEvidence] = useState<boolean | undefined>(undefined)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)

  const { data: controls } = useControls()
  const { data: testExecutions } = useTestExecutions()

  // Common file types for filtering
  const fileTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'text/plain',
    'text/csv',
    'application/json'
  ]

  const confidentialityLevels = ['Public', 'Internal', 'Confidential', 'Restricted']

  useEffect(() => {
    const filters: {
      search?: string
      test_execution_id?: string
      control_id?: string
      file_type?: string
      confidentiality_level?: string
      is_key_evidence?: boolean
      tags?: string[]
    } = {}

    if (searchTerm.trim()) filters.search = searchTerm.trim()
    if (selectedTestExecution) filters.test_execution_id = selectedTestExecution
    if (selectedControl) filters.control_id = selectedControl
    if (selectedFileType) filters.file_type = selectedFileType
    if (selectedConfidentiality) filters.confidentiality_level = selectedConfidentiality
    if (isKeyEvidence !== undefined) filters.is_key_evidence = isKeyEvidence
    if (selectedTags.length > 0) filters.tags = selectedTags

    onFiltersChange(filters)
  }, [
    searchTerm,
    selectedTestExecution,
    selectedControl,
    selectedFileType,
    selectedConfidentiality,
    isKeyEvidence,
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
    setSelectedTestExecution('')
    setSelectedControl('')
    setSelectedFileType('')
    setSelectedConfidentiality('')
    setIsKeyEvidence(undefined)
    setSelectedTags([])
    setTagInput('')
  }

  const getFileTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      'application/pdf': 'PDF',
      'application/msword': 'DOC',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
      'application/vnd.ms-excel': 'XLS',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
      'image/jpeg': 'JPEG',
      'image/png': 'PNG',
      'text/plain': 'TXT',
      'text/csv': 'CSV',
      'application/json': 'JSON'
    }
    return typeMap[type] || type.split('/')[1]?.toUpperCase() || type
  }

  const activeFilterCount = [
    searchTerm,
    selectedTestExecution,
    selectedControl,
    selectedFileType,
    selectedConfidentiality,
    isKeyEvidence !== undefined ? 'key-evidence' : '',
    selectedTags.length > 0 ? 'tags' : ''
  ].filter(Boolean).length

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Search & Filter Evidence
        </CardTitle>
        <CardDescription>
          Search and filter evidence files by various criteria
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Bar */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by filename, description, or uploader..."
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

                {/* File Type Filter */}
                <div>
                  <Label htmlFor="file-type-filter" className="text-sm">File Type</Label>
                  <Select value={selectedFileType} onValueChange={setSelectedFileType}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select file type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All file types</SelectItem>
                      {fileTypes.map(type => (
                        <SelectItem key={type} value={type}>
                          <div className="flex items-center gap-2">
                            <FileType className="h-3 w-3" />
                            {getFileTypeLabel(type)}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Confidentiality Filter */}
                <div>
                  <Label htmlFor="confidentiality-filter" className="text-sm">Confidentiality Level</Label>
                  <Select value={selectedConfidentiality} onValueChange={setSelectedConfidentiality}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select confidentiality level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All levels</SelectItem>
                      {confidentialityLevels.map(level => (
                        <SelectItem key={level} value={level}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Key Evidence Filter */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="key-evidence-filter"
                    checked={isKeyEvidence === true}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setIsKeyEvidence(true)
                      } else if (isKeyEvidence === true) {
                        setIsKeyEvidence(undefined)
                      }
                    }}
                  />
                  <Label htmlFor="key-evidence-filter" className="flex items-center gap-2 text-sm">
                    <Shield className="h-4 w-4" />
                    Key Evidence Only
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
            {selectedTestExecution && (
              <Badge variant="outline" className="gap-1">
                Test: {testExecutions?.find(t => t.id === selectedTestExecution)?.id.slice(0, 8)}
                <button onClick={() => setSelectedTestExecution('')}>
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
            {selectedFileType && (
              <Badge variant="outline" className="gap-1">
                Type: {getFileTypeLabel(selectedFileType)}
                <button onClick={() => setSelectedFileType('')}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {selectedConfidentiality && (
              <Badge variant="outline" className="gap-1">
                {selectedConfidentiality}
                <button onClick={() => setSelectedConfidentiality('')}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {isKeyEvidence && (
              <Badge variant="outline" className="gap-1">
                <Shield className="h-3 w-3" />
                Key Evidence
                <button onClick={() => setIsKeyEvidence(undefined)}>
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