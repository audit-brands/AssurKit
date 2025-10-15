import { useState } from 'react'
import { useEvidence, useDeleteEvidence, useBulkDeleteEvidence, useBulkUpdateEvidence, type Evidence } from '@/hooks/use-evidence'
import { EvidencePreview } from './evidence-preview'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  FileText,
  Download,
  Eye,
  MoreHorizontal,
  Trash2,
  Shield,
  Calendar,
  User,
  Hash,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface EvidenceListProps {
  filters: {
    test_execution_id?: string
    control_id?: string
    tags?: string[]
    file_type?: string
    confidentiality_level?: string
    is_key_evidence?: boolean
    search?: string
  }
}

export function EvidenceList({ filters }: EvidenceListProps) {
  const [page, setPage] = useState(1)
  const [selectedEvidence, setSelectedEvidence] = useState<string[]>([])
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [evidenceToDelete, setEvidenceToDelete] = useState<string | null>(null)
  const [bulkAction, setBulkAction] = useState<'delete' | 'update' | null>(null)
  const [bulkUpdateData, setBulkUpdateData] = useState({
    confidentiality_level: '',
    is_key_evidence: false
  })
  const [previewEvidence, setPreviewEvidence] = useState<Evidence | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)

  const limit = 20
  const { data: evidenceData, isLoading, error } = useEvidence(page, limit, filters)
  const deleteEvidence = useDeleteEvidence()
  const bulkDeleteEvidence = useBulkDeleteEvidence()
  const bulkUpdateEvidence = useBulkUpdateEvidence()

  const evidence = evidenceData?.items || []
  const totalPages = evidenceData?.total_pages || 1

  const handleSelectEvidence = (evidenceId: string, checked: boolean) => {
    if (checked) {
      setSelectedEvidence(prev => [...prev, evidenceId])
    } else {
      setSelectedEvidence(prev => prev.filter(id => id !== evidenceId))
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedEvidence(evidence.map(e => e.id))
    } else {
      setSelectedEvidence([])
    }
  }

  const handleDeleteEvidence = async (id: string) => {
    try {
      await deleteEvidence.mutateAsync(id)
      setEvidenceToDelete(null)
      setDeleteDialogOpen(false)
    } catch (error) {
      console.error('Failed to delete evidence:', error)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedEvidence.length === 0) return

    try {
      await bulkDeleteEvidence.mutateAsync(selectedEvidence)
      setSelectedEvidence([])
      setBulkAction(null)
    } catch (error) {
      console.error('Failed to bulk delete evidence:', error)
    }
  }

  const handleBulkUpdate = async () => {
    if (selectedEvidence.length === 0) return

    try {
      const updates: Partial<Pick<Evidence, 'confidentiality_level' | 'is_key_evidence'>> = {}
      if (bulkUpdateData.confidentiality_level) {
        updates.confidentiality_level = bulkUpdateData.confidentiality_level as Evidence['confidentiality_level']
      }
      if (bulkUpdateData.is_key_evidence) {
        updates.is_key_evidence = bulkUpdateData.is_key_evidence
      }

      await bulkUpdateEvidence.mutateAsync({
        evidence_ids: selectedEvidence,
        updates
      })
      setSelectedEvidence([])
      setBulkAction(null)
      setBulkUpdateData({ confidentiality_level: '', is_key_evidence: false })
    } catch (error) {
      console.error('Failed to bulk update evidence:', error)
    }
  }

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

  const getConfidentialityColor = (level: Evidence['confidentiality_level']) => {
    switch (level) {
      case 'Public': return 'bg-green-100 text-green-800'
      case 'Internal': return 'bg-blue-100 text-blue-800'
      case 'Confidential': return 'bg-orange-100 text-orange-800'
      case 'Restricted': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-red-600">Failed to load evidence. Please try again.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Bulk Actions */}
      {selectedEvidence.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {selectedEvidence.length} evidence file{selectedEvidence.length !== 1 ? 's' : ''} selected
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setBulkAction('update')}
                >
                  Bulk Update
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setBulkAction('delete')}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Selected
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedEvidence([])}
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Evidence Table */}
      <Card>
        <CardHeader>
          <CardTitle>Evidence Files</CardTitle>
          <CardDescription>
            Manage uploaded evidence files and their metadata
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedEvidence.length === evidence.length && evidence.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>File</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Confidentiality</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead>Checksum</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {evidence.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedEvidence.includes(item.id)}
                      onCheckedChange={(checked) => handleSelectEvidence(item.id, checked as boolean)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{item.original_filename}</span>
                          {item.is_key_evidence && (
                            <Shield className="h-4 w-4 text-orange-600" />
                          )}
                        </div>
                        {item.description && (
                          <p className="text-xs text-muted-foreground truncate max-w-xs">
                            {item.description}
                          </p>
                        )}
                        {item.tags.length > 0 && (
                          <div className="flex gap-1 mt-1">
                            {item.tags.slice(0, 3).map(tag => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {item.tags.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{item.tags.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.file_type}</Badge>
                  </TableCell>
                  <TableCell>{formatFileSize(item.file_size)}</TableCell>
                  <TableCell>
                    <Badge className={cn('text-xs', getConfidentialityColor(item.confidentiality_level))}>
                      {item.confidentiality_level}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {item.uploaded_by}
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {formatDate(item.uploaded_at)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 font-mono text-xs">
                      <Hash className="h-3 w-3" />
                      {item.checksum_sha256.slice(0, 8)}...
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => {
                            setPreviewEvidence(item)
                            setPreviewOpen(true)
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Preview
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => {
                            setEvidenceToDelete(item.id)
                            setDeleteDialogOpen(true)
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {evidence.length === 0 && (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No evidence found</h3>
              <p className="text-muted-foreground">
                {Object.keys(filters).length > 0
                  ? 'No evidence matches your current filters.'
                  : 'Start by uploading some evidence files.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages} ({evidenceData?.total || 0} total items)
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Evidence</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this evidence file? This action cannot be undone
              and will permanently remove the file and all associated metadata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => evidenceToDelete && handleDeleteEvidence(evidenceToDelete)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Dialog */}
      <AlertDialog open={bulkAction === 'delete'} onOpenChange={() => setBulkAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Selected Evidence</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedEvidence.length} evidence file
              {selectedEvidence.length !== 1 ? 's' : ''}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Update Dialog */}
      <AlertDialog open={bulkAction === 'update'} onOpenChange={() => setBulkAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Update Selected Evidence</AlertDialogTitle>
            <AlertDialogDescription>
              Update properties for {selectedEvidence.length} selected evidence file
              {selectedEvidence.length !== 1 ? 's' : ''}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="bulk-confidentiality">Confidentiality Level</Label>
              <Select
                value={bulkUpdateData.confidentiality_level}
                onValueChange={(value) => setBulkUpdateData(prev => ({ ...prev, confidentiality_level: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select confidentiality level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No change</SelectItem>
                  <SelectItem value="Public">Public</SelectItem>
                  <SelectItem value="Internal">Internal</SelectItem>
                  <SelectItem value="Confidential">Confidential</SelectItem>
                  <SelectItem value="Restricted">Restricted</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="bulk-key-evidence"
                checked={bulkUpdateData.is_key_evidence}
                onCheckedChange={(checked) => setBulkUpdateData(prev => ({ ...prev, is_key_evidence: checked as boolean }))}
              />
              <Label htmlFor="bulk-key-evidence">Mark as Key Evidence</Label>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkUpdate}>
              Update All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Evidence Preview Dialog */}
      <EvidencePreview
        evidence={previewEvidence}
        open={previewOpen}
        onOpenChange={(open) => {
          setPreviewOpen(open)
          if (!open) setPreviewEvidence(null)
        }}
      />
    </div>
  )
}