import { useEvidenceStatistics } from '@/hooks/use-evidence'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts'
import {
  Files,
  HardDrive,
  Shield,
  AlertTriangle,
  TrendingUp,
  Database,
  FileType,
  Lock
} from 'lucide-react'

export function EvidenceStatistics() {
  const { data: stats, isLoading, error } = useEvidenceStatistics()

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error || !stats) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-red-600">Failed to load evidence statistics. Please try again.</p>
        </CardContent>
      </Card>
    )
  }

  // Prepare data for charts
  const fileTypeData = Object.entries(stats.files_by_type).map(([type, count]) => ({
    type: getFileTypeLabel(type),
    count,
    fullType: type
  }))

  const confidentialityData = Object.entries(stats.files_by_confidentiality).map(([level, count]) => ({
    level,
    count
  }))

  const monthlyData = stats.files_by_month.map(item => ({
    month: formatMonth(item.month),
    files: item.count,
    sizeGB: Math.round(item.size_bytes / (1024 * 1024 * 1024) * 100) / 100
  }))

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

  function getFileTypeLabel(type: string) {
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

  function formatMonth(monthString: string) {
    const date = new Date(monthString + '-01')
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  }

  function getConfidentialityColor(level: string) {
    switch (level) {
      case 'Public': return '#10B981'
      case 'Internal': return '#3B82F6'
      case 'Confidential': return '#F59E0B'
      case 'Restricted': return '#EF4444'
      default: return '#6B7280'
    }
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Files</p>
                <p className="text-2xl font-bold">{stats.total_files.toLocaleString()}</p>
              </div>
              <Files className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Storage</p>
                <p className="text-2xl font-bold">{stats.total_size_formatted}</p>
              </div>
              <HardDrive className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Key Evidence</p>
                <p className="text-2xl font-bold">{stats.key_evidence_count}</p>
                <p className="text-xs text-muted-foreground">
                  {((stats.key_evidence_count / stats.total_files) * 100).toFixed(1)}% of total
                </p>
              </div>
              <Shield className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Retention Alerts</p>
                <p className="text-2xl font-bold">{stats.retention_alerts}</p>
                <p className="text-xs text-muted-foreground">
                  Files nearing retention date
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* File Types Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileType className="h-5 w-5" />
              Files by Type
            </CardTitle>
            <CardDescription>
              Distribution of evidence files by file type
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={fileTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ type, percent }) => `${type} ${((percent as number) * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {fileTypeData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [value, 'Files']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Confidentiality Levels */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Confidentiality Levels
            </CardTitle>
            <CardDescription>
              Distribution of files by confidentiality classification
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={confidentialityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="level" />
                  <YAxis />
                  <Tooltip />
                  <Bar
                    dataKey="count"
                    fill="#3B82F6"
                    radius={[4, 4, 0, 0]}
                  >
                    {confidentialityData.map((item, index) => (
                      <Cell key={`cell-${index}`} fill={getConfidentialityColor(item.level)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Evidence Upload Trends
          </CardTitle>
          <CardDescription>
            Monthly uploads and storage growth over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="files" orientation="left" />
                <YAxis yAxisId="storage" orientation="right" />
                <Tooltip
                  formatter={(value, dataKey) => [
                    dataKey === 'files' ? `${value} files` : `${value} GB`,
                    dataKey === 'files' ? 'Files Uploaded' : 'Storage Used'
                  ]}
                />
                <Bar yAxisId="files" dataKey="files" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                <Line
                  yAxisId="storage"
                  type="monotone"
                  dataKey="sizeGB"
                  stroke="#10B981"
                  strokeWidth={3}
                  dot={{ fill: '#10B981', strokeWidth: 2, r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* File Type Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            File Type Details
          </CardTitle>
          <CardDescription>
            Detailed breakdown of file types and counts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {fileTypeData.map((item, index) => (
              <div
                key={item.fullType}
                className="flex items-center justify-between p-4 rounded-lg border"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <div>
                    <p className="font-medium">{item.type}</p>
                    <p className="text-sm text-muted-foreground">{item.fullType}</p>
                  </div>
                </div>
                <Badge variant="secondary">{item.count}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Confidentiality Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {confidentialityData.map((item) => (
          <Card key={item.level}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{item.level}</p>
                  <p className="text-2xl font-bold">{item.count}</p>
                  <p className="text-xs text-muted-foreground">
                    {((item.count / stats.total_files) * 100).toFixed(1)}% of total
                  </p>
                </div>
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: getConfidentialityColor(item.level) + '20' }}
                >
                  <Lock
                    className="h-4 w-4"
                    style={{ color: getConfidentialityColor(item.level) }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}