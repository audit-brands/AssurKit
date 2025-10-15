import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Download,
  FileText,
  FileSpreadsheet,
  Image,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Mail,
  Settings
} from 'lucide-react'
import { format } from 'date-fns'
import type { ReportingFilters } from './advanced-filters'

export interface ExportJob {
  id: string
  name: string
  type: 'csv' | 'excel' | 'pdf' | 'json'
  status: 'pending' | 'running' | 'completed' | 'failed'
  progress: number
  created_at: string
  completed_at?: string
  download_url?: string
  file_size?: number
  error_message?: string
  filters: ReportingFilters
  config: ExportConfig
}

export interface ExportConfig {
  format: 'csv' | 'excel' | 'pdf' | 'json'
  include_summary: boolean
  include_charts: boolean
  include_raw_data: boolean
  date_format: string
  timezone: string
  template?: string
  custom_fields: string[]
  grouping: string[]
  sorting: Array<{ field: string; direction: 'asc' | 'desc' }>
}

export interface ReportTemplate {
  id: string
  name: string
  description: string
  type: 'compliance' | 'executive' | 'operational' | 'audit'
  config: ExportConfig
  is_public: boolean
  created_by: string
  created_at: string
}

interface ExportCenterProps {
  filters: ReportingFilters
  dataType: 'tests' | 'issues' | 'controls' | 'evidence' | 'reviews' | 'dashboard'
}

const EXPORT_FORMATS = [
  { value: 'csv', label: 'CSV', icon: FileSpreadsheet, description: 'Comma-separated values, compatible with Excel' },
  { value: 'excel', label: 'Excel', icon: FileSpreadsheet, description: 'Microsoft Excel format with multiple sheets' },
  { value: 'pdf', label: 'PDF', icon: FileText, description: 'Formatted report with charts and summaries' },
  { value: 'json', label: 'JSON', icon: FileText, description: 'Raw data for API integration' },
]

const COMPLIANCE_TEMPLATES = [
  { id: 'sox-quarterly', name: 'SOX Quarterly Report', type: 'compliance' },
  { id: 'control-testing', name: 'Control Testing Summary', type: 'operational' },
  { id: 'exception-report', name: 'Exception Analysis Report', type: 'audit' },
  { id: 'executive-summary', name: 'Executive Dashboard', type: 'executive' },
]

export function ExportCenter({ filters, dataType }: ExportCenterProps) {
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)
  const [exportConfig, setExportConfig] = useState<ExportConfig>({
    format: 'csv',
    include_summary: true,
    include_charts: false,
    include_raw_data: true,
    date_format: 'YYYY-MM-DD',
    timezone: 'UTC',
    custom_fields: [],
    grouping: [],
    sorting: []
  })
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [exportName, setExportName] = useState('')

  const { data: exportJobs = [], refetch: refetchJobs } = useQuery({
    queryKey: ['export-jobs'],
    queryFn: async (): Promise<ExportJob[]> => {
      const response = await fetch('/api/exports/jobs')
      if (!response.ok) {
        throw new Error('Failed to fetch export jobs')
      }
      return response.json()
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 5 * 1000, // Poll every 5 seconds for active jobs
  })

  const { data: templates = [] } = useQuery({
    queryKey: ['report-templates'],
    queryFn: async (): Promise<ReportTemplate[]> => {
      const response = await fetch('/api/exports/templates')
      if (!response.ok) {
        throw new Error('Failed to fetch report templates')
      }
      return response.json()
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  })

  const createExportMutation = useMutation({
    mutationFn: async (config: { name: string; filters: ReportingFilters; config: ExportConfig }) => {
      const response = await fetch('/api/exports/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: config.name,
          data_type: dataType,
          filters: config.filters,
          config: config.config
        }),
      })
      if (!response.ok) {
        throw new Error('Failed to create export job')
      }
      return response.json()
    },
    onSuccess: () => {
      refetchJobs()
      setIsExportDialogOpen(false)
      setExportName('')
    },
  })

  const downloadFile = async (job: ExportJob) => {
    if (!job.download_url) return

    try {
      const response = await fetch(job.download_url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${job.name}.${job.type}`
      link.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to download file:', error)
    }
  }

  const deleteExportJob = async (jobId: string) => {
    try {
      await fetch(`/api/exports/jobs/${jobId}`, { method: 'DELETE' })
      refetchJobs()
    } catch (error) {
      console.error('Failed to delete export job:', error)
    }
  }

  const quickExport = (format: 'csv' | 'excel' | 'pdf') => {
    const quickConfig: ExportConfig = {
      ...exportConfig,
      format,
      include_summary: format === 'pdf',
      include_charts: format === 'pdf',
    }

    createExportMutation.mutate({
      name: `${dataType}-export-${format}-${format(new Date(), 'yyyy-MM-dd-HH-mm')}`,
      filters,
      config: quickConfig
    })
  }

  const startCustomExport = () => {
    if (!exportName.trim()) return

    createExportMutation.mutate({
      name: exportName.trim(),
      filters,
      config: exportConfig
    })
  }

  const applyTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId)
    if (template) {
      setExportConfig(template.config)
      setExportName(template.name)
    }
  }

  const getStatusIcon = (status: ExportJob['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'running':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />
    }
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return ''
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <div className="space-y-6">
      {/* Quick Export Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Data
          </CardTitle>
          <CardDescription>
            Export filtered data in various formats for reporting and analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Button onClick={() => quickExport('csv')} variant="outline">
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button onClick={() => quickExport('excel')} variant="outline">
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Export Excel
            </Button>
            <Button onClick={() => quickExport('pdf')} variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
            <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Settings className="h-4 w-4 mr-2" />
                  Custom Export
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Custom Export Configuration</DialogTitle>
                  <DialogDescription>
                    Configure advanced export options and formatting
                  </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="basic" className="space-y-4">
                  <TabsList>
                    <TabsTrigger value="basic">Basic Options</TabsTrigger>
                    <TabsTrigger value="formatting">Formatting</TabsTrigger>
                    <TabsTrigger value="templates">Templates</TabsTrigger>
                  </TabsList>

                  <TabsContent value="basic" className="space-y-4">
                    <div className="space-y-2">
                      <Label>Export Name</Label>
                      <Input
                        value={exportName}
                        onChange={(e) => setExportName(e.target.value)}
                        placeholder="Enter export name..."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Format</Label>
                      <Select
                        value={exportConfig.format}
                        onValueChange={(value) => setExportConfig(prev => ({ ...prev, format: value as any }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {EXPORT_FORMATS.map(format => (
                            <SelectItem key={format.value} value={format.value}>
                              <div className="flex items-center gap-2">
                                <format.icon className="h-4 w-4" />
                                <div>
                                  <div>{format.label}</div>
                                  <div className="text-xs text-muted-foreground">{format.description}</div>
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      <Label>Include Options</Label>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            checked={exportConfig.include_summary}
                            onCheckedChange={(checked) =>
                              setExportConfig(prev => ({ ...prev, include_summary: !!checked }))
                            }
                          />
                          <Label>Include Summary</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            checked={exportConfig.include_charts}
                            onCheckedChange={(checked) =>
                              setExportConfig(prev => ({ ...prev, include_charts: !!checked }))
                            }
                            disabled={exportConfig.format === 'csv' || exportConfig.format === 'json'}
                          />
                          <Label>Include Charts</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            checked={exportConfig.include_raw_data}
                            onCheckedChange={(checked) =>
                              setExportConfig(prev => ({ ...prev, include_raw_data: !!checked }))
                            }
                          />
                          <Label>Include Raw Data</Label>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="formatting" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Date Format</Label>
                        <Select
                          value={exportConfig.date_format}
                          onValueChange={(value) => setExportConfig(prev => ({ ...prev, date_format: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="YYYY-MM-DD">2024-01-15</SelectItem>
                            <SelectItem value="MM/DD/YYYY">01/15/2024</SelectItem>
                            <SelectItem value="DD/MM/YYYY">15/01/2024</SelectItem>
                            <SelectItem value="MMMM DD, YYYY">January 15, 2024</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Timezone</Label>
                        <Select
                          value={exportConfig.timezone}
                          onValueChange={(value) => setExportConfig(prev => ({ ...prev, timezone: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="UTC">UTC</SelectItem>
                            <SelectItem value="America/New_York">Eastern Time</SelectItem>
                            <SelectItem value="America/Chicago">Central Time</SelectItem>
                            <SelectItem value="America/Denver">Mountain Time</SelectItem>
                            <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="templates" className="space-y-4">
                    <div className="space-y-2">
                      <Label>Report Templates</Label>
                      <div className="grid grid-cols-1 gap-2">
                        {COMPLIANCE_TEMPLATES.map(template => (
                          <div
                            key={template.id}
                            className="flex items-center justify-between p-3 border rounded cursor-pointer hover:bg-muted"
                            onClick={() => applyTemplate(template.id)}
                          >
                            <div>
                              <div className="font-medium">{template.name}</div>
                              <Badge variant="outline" className="capitalize mt-1">
                                {template.type}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsExportDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={startCustomExport}
                    disabled={!exportName.trim() || createExportMutation.isPending}
                  >
                    {createExportMutation.isPending ? 'Creating...' : 'Start Export'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Export Jobs Status */}
      <Card>
        <CardHeader>
          <CardTitle>Export History</CardTitle>
          <CardDescription>Track export job progress and download completed files</CardDescription>
        </CardHeader>
        <CardContent>
          {exportJobs.length === 0 ? (
            <div className="text-center py-8">
              <Download className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No export jobs yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {exportJobs.map(job => (
                <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {getStatusIcon(job.status)}
                      <span className="font-medium">{job.name}</span>
                      <Badge variant="outline" className="uppercase">
                        {job.type}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Created {format(new Date(job.created_at), 'MMM d, yyyy HH:mm')}
                      {job.completed_at && ` • Completed ${format(new Date(job.completed_at), 'HH:mm')}`}
                      {job.file_size && ` • ${formatFileSize(job.file_size)}`}
                    </div>
                    {job.status === 'running' && (
                      <Progress value={job.progress} className="mt-2 h-2" />
                    )}
                    {job.status === 'failed' && job.error_message && (
                      <div className="text-sm text-red-600 mt-1">{job.error_message}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {job.status === 'completed' && job.download_url && (
                      <Button size="sm" onClick={() => downloadFile(job)}>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteExportJob(job.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}