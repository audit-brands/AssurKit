import { useEvidencePreview, useEvidenceDownloadUrl, type Evidence } from '@/hooks/use-evidence'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Eye,
  Download,
  FileText,
  Image,
  File,
  AlertCircle,
  ExternalLink,
  Calendar,
  Hash,
  User,
  Shield
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface EvidencePreviewProps {
  evidence: Evidence | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EvidencePreview({ evidence, open, onOpenChange }: EvidencePreviewProps) {

  const { data: previewData, isLoading: previewLoading, error: previewDataError } = useEvidencePreview(
    evidence?.id || ''
  )
  const { data: downloadUrl, isLoading: downloadLoading } = useEvidenceDownloadUrl(
    evidence?.id || ''
  )

  const previewError = previewDataError ? 'Failed to load preview data' : null

  if (!evidence) return null

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <Image className="h-5 w-5" />
    if (fileType === 'application/pdf') return <FileText className="h-5 w-5" />
    return <File className="h-5 w-5" />
  }

  const getConfidentialityColor = (level: Evidence['confidentiality_level']) => {
    switch (level) {
      case 'Public': return 'bg-green-100 text-green-800'
      case 'Internal': return 'bg-blue-100 text-blue-800'
      case 'Confidential': return 'bg-orange-100 text-orange-800'
      case 'Restricted': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const canPreview = previewData?.can_preview && !previewError

  const handleDownload = () => {
    if (downloadUrl) {
      window.open(downloadUrl, '_blank')
    }
  }

  const renderPreview = () => {
    if (previewLoading) {
      return (
        <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
          <div className="text-center">
            <Skeleton className="h-8 w-8 mx-auto mb-2" />
            <Skeleton className="h-4 w-24 mx-auto" />
          </div>
        </div>
      )
    }

    if (previewError || !canPreview) {
      return (
        <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Preview Not Available</h3>
            <p className="text-sm text-gray-500 mb-4">
              {previewError || 'This file type cannot be previewed'}
            </p>
            <Button onClick={handleDownload} disabled={downloadLoading}>
              <Download className="h-4 w-4 mr-2" />
              Download to View
            </Button>
          </div>
        </div>
      )
    }

    if (evidence.file_type.startsWith('image/')) {
      return (
        <div className="relative">
          <img
            src={previewData?.preview_url || previewData?.thumbnail_url}
            alt={evidence.original_filename}
            className="w-full h-auto max-h-96 object-contain rounded-lg"
            onError={() => console.error('Failed to load image')}
          />
          {previewData?.file_info?.dimensions && (
            <Badge variant="secondary" className="absolute top-2 right-2">
              {previewData.file_info.dimensions.width} × {previewData.file_info.dimensions.height}
            </Badge>
          )}
        </div>
      )
    }

    if (evidence.file_type === 'application/pdf' && previewData?.preview_url) {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              <span className="font-medium">PDF Preview</span>
              {previewData.file_info?.pages && (
                <Badge variant="secondary">{previewData.file_info.pages} pages</Badge>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(previewData.preview_url, '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open in New Tab
            </Button>
          </div>
          <iframe
            src={previewData.preview_url}
            className="w-full h-96 border rounded-lg"
            title={`Preview of ${evidence.original_filename}`}
          />
        </div>
      )
    }

    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border">
        <div className="text-center">
          {getFileIcon(evidence.file_type)}
          <h3 className="text-lg font-medium text-gray-900 mb-2 mt-4">
            {evidence.original_filename}
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Click download to view this file
          </p>
          <Button onClick={handleDownload} disabled={downloadLoading}>
            <Download className="h-4 w-4 mr-2" />
            Download File
          </Button>
        </div>
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Evidence Preview
          </DialogTitle>
          <DialogDescription>
            View and download evidence file details
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Preview Area */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getFileIcon(evidence.file_type)}
                  {evidence.original_filename}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderPreview()}
              </CardContent>
            </Card>
          </div>

          {/* Metadata Sidebar */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">File Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Size</p>
                  <p className="text-sm">{formatFileSize(evidence.file_size)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Type</p>
                  <Badge variant="outline">{evidence.file_type}</Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Confidentiality</p>
                  <Badge className={cn('text-xs', getConfidentialityColor(evidence.confidentiality_level))}>
                    {evidence.confidentiality_level}
                  </Badge>
                </div>
                {evidence.is_key_evidence && (
                  <div>
                    <Badge variant="outline" className="text-orange-600 border-orange-600">
                      <Shield className="h-3 w-3 mr-1" />
                      Key Evidence
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Upload Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <User className="h-3 w-3" />
                    Uploaded by
                  </p>
                  <p className="text-sm">{evidence.uploaded_by}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Upload date
                  </p>
                  <p className="text-sm">{formatDate(evidence.uploaded_at)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Hash className="h-3 w-3" />
                    Checksum
                  </p>
                  <p className="text-xs font-mono break-all">
                    {evidence.checksum_sha256}
                  </p>
                </div>
              </CardContent>
            </Card>

            {evidence.description && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{evidence.description}</p>
                </CardContent>
              </Card>
            )}

            {evidence.tags.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1">
                    {evidence.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {(evidence.test_execution_id || evidence.control_id) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Associated Items</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {evidence.test_execution_id && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Test Execution</p>
                      <p className="text-sm font-mono">#{evidence.test_execution_id.slice(0, 8)}</p>
                    </div>
                  )}
                  {evidence.control_id && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Control</p>
                      <p className="text-sm font-mono">#{evidence.control_id.slice(0, 8)}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={handleDownload} disabled={downloadLoading}>
            <Download className="h-4 w-4 mr-2" />
            {downloadLoading ? 'Preparing...' : 'Download'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}