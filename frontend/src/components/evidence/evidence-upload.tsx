import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useUploadEvidence, validateFile, calculateFileChecksum, type EvidenceUpload } from '@/hooks/use-evidence'
import { useControls } from '@/hooks/use-controls'
import { useTestExecutions } from '@/hooks/use-tests'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Upload,
  File,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  Shield,
  FileText,
  Image,
  FileSpreadsheet
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface EvidenceUploadProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  preselectedTestExecutionId?: string
  preselectedControlId?: string
}

interface FileWithMetadata extends File {
  id: string
  checksum?: string
  uploadProgress?: number
  status: 'pending' | 'validating' | 'ready' | 'uploading' | 'success' | 'error'
  error?: string
}

export function EvidenceUpload({
  open,
  onOpenChange,
  preselectedTestExecutionId,
  preselectedControlId
}: EvidenceUploadProps) {
  const [files, setFiles] = useState<FileWithMetadata[]>([])
  const [testExecutionId, setTestExecutionId] = useState(preselectedTestExecutionId || '')
  const [controlId, setControlId] = useState(preselectedControlId || '')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [isKeyEvidence, setIsKeyEvidence] = useState(false)
  const [confidentialityLevel, setConfidentialityLevel] = useState<'Public' | 'Internal' | 'Confidential' | 'Restricted'>('Internal')
  const [isUploading, setIsUploading] = useState(false)

  const { data: controlsData } = useControls({ limit: 100 })
  const controls = controlsData?.items ?? []
  const { data: testExecutions } = useTestExecutions()
  const uploadEvidence = useUploadEvidence()

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const filesWithMetadata: FileWithMetadata[] = acceptedFiles.map(file => ({
      ...file,
      id: Math.random().toString(36),
      status: 'pending' as const
    }))

    setFiles(prev => [...prev, ...filesWithMetadata])

    // Validate and calculate checksums for each file
    for (const fileWithMetadata of filesWithMetadata) {
      setFiles(prev =>
        prev.map(f =>
          f.id === fileWithMetadata.id
            ? { ...f, status: 'validating' as const }
            : f
        )
      )

      try {
        // Validate file
        const validation = validateFile(fileWithMetadata)
        if (!validation.valid) {
          setFiles(prev =>
            prev.map(f =>
              f.id === fileWithMetadata.id
                ? { ...f, status: 'error' as const, error: validation.error }
                : f
            )
          )
          continue
        }

        // Calculate checksum
        const checksum = await calculateFileChecksum(fileWithMetadata)
        setFiles(prev =>
          prev.map(f =>
            f.id === fileWithMetadata.id
              ? { ...f, status: 'ready' as const, checksum }
              : f
          )
        )
      } catch {
        setFiles(prev =>
          prev.map(f =>
            f.id === fileWithMetadata.id
              ? { ...f, status: 'error' as const, error: 'Failed to process file' }
              : f
          )
        )
      }
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize: 100 * 1024 * 1024, // 100MB
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/gif': ['.gif'],
      'text/plain': ['.txt'],
      'text/csv': ['.csv'],
      'application/json': ['.json']
    }
  })

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId))
  }

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags(prev => [...prev, tagInput.trim()])
      setTagInput('')
    }
  }

  const removeTag = (tag: string) => {
    setTags(prev => prev.filter(t => t !== tag))
  }

  const handleUpload = async () => {
    if (files.length === 0) return

    setIsUploading(true)

    try {
      for (const file of files) {
        if (file.status !== 'ready') continue

        setFiles(prev =>
          prev.map(f =>
            f.id === file.id
              ? { ...f, status: 'uploading' as const, uploadProgress: 0 }
              : f
          )
        )

        const uploadData: EvidenceUpload = {
          file,
          test_execution_id: testExecutionId || undefined,
          control_id: controlId || undefined,
          description: description || undefined,
          tags: tags.length > 0 ? tags : undefined,
          is_key_evidence: isKeyEvidence,
          confidentiality_level: confidentialityLevel
        }

        try {
          await uploadEvidence.mutateAsync(uploadData)
          setFiles(prev =>
            prev.map(f =>
              f.id === file.id
                ? { ...f, status: 'success' as const, uploadProgress: 100 }
                : f
            )
          )
        } catch {
          setFiles(prev =>
            prev.map(f =>
              f.id === file.id
                ? { ...f, status: 'error' as const, error: 'Upload failed' }
                : f
            )
          )
        }
      }

      // Check if all uploads were successful
      const allSuccessful = files.every(f => f.status === 'success')
      if (allSuccessful) {
        setTimeout(() => {
          onOpenChange(false)
          resetForm()
        }, 1000)
      }
    } finally {
      setIsUploading(false)
    }
  }

  const resetForm = () => {
    setFiles([])
    setTestExecutionId(preselectedTestExecutionId || '')
    setControlId(preselectedControlId || '')
    setDescription('')
    setTags([])
    setTagInput('')
    setIsKeyEvidence(false)
    setConfidentialityLevel('Internal')
  }

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <Image className="h-4 w-4" />
    if (file.type.includes('spreadsheet') || file.type.includes('excel')) return <FileSpreadsheet className="h-4 w-4" />
    if (file.type === 'application/pdf') return <FileText className="h-4 w-4" />
    return <File className="h-4 w-4" />
  }

  const getStatusIcon = (status: FileWithMetadata['status']) => {
    switch (status) {
      case 'pending':
      case 'validating':
        return <Loader2 className="h-4 w-4 animate-spin" />
      case 'ready':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />
      case 'uploading':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Evidence
          </DialogTitle>
          <DialogDescription>
            Upload files as evidence for control testing. All files will be validated and have checksums calculated for integrity.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* File Upload Area */}
          <div className="space-y-4">
            <div>
              <Label>Files</Label>
              <div
                {...getRootProps()}
                className={cn(
                  'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
                  isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                )}
              >
                <input {...getInputProps()} />
                <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                {isDragActive ? (
                  <p className="text-blue-600">Drop the files here...</p>
                ) : (
                  <div>
                    <p className="text-gray-600 mb-1">
                      Drag & drop files here, or click to select files
                    </p>
                    <p className="text-xs text-gray-400">
                      PDF, DOC, XLS, Images, TXT, CSV, JSON (max 100MB)
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* File List */}
            {files.length > 0 && (
              <div className="space-y-2">
                <Label>Uploaded Files ({files.length})</Label>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {files.map(file => (
                    <div key={file.id} className="flex items-center gap-3 p-2 border rounded">
                      {getFileIcon(file)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate">{file.name}</span>
                          {getStatusIcon(file.status)}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>{formatFileSize(file.size)}</span>
                          {file.checksum && (
                            <span className="font-mono text-xs">
                              SHA256: {file.checksum.slice(0, 8)}...
                            </span>
                          )}
                        </div>
                        {file.status === 'uploading' && file.uploadProgress !== undefined && (
                          <Progress value={file.uploadProgress} className="mt-1 h-1" />
                        )}
                        {file.error && (
                          <p className="text-xs text-red-600 mt-1">{file.error}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(file.id)}
                        disabled={file.status === 'uploading'}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Metadata Form */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="test-execution">Test Execution (Optional)</Label>
              <Select value={testExecutionId} onValueChange={setTestExecutionId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select test execution" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {testExecutions?.map(execution => (
                    <SelectItem key={execution.id} value={execution.id}>
                      Test #{execution.id.slice(0, 8)} - {execution.tester}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="control">Control (Optional)</Label>
              <Select value={controlId} onValueChange={setControlId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select control" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {controls?.map(control => (
                    <SelectItem key={control.id} value={control.id}>
                      {control.control_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the evidence and its purpose"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="confidentiality">Confidentiality Level</Label>
              <Select value={confidentialityLevel} onValueChange={(value: 'Public' | 'Internal' | 'Confidential' | 'Restricted') => setConfidentialityLevel(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Public">Public</SelectItem>
                  <SelectItem value="Internal">Internal</SelectItem>
                  <SelectItem value="Confidential">Confidential</SelectItem>
                  <SelectItem value="Restricted">Restricted</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="key-evidence"
                checked={isKeyEvidence}
                onCheckedChange={(checked) => setIsKeyEvidence(checked as boolean)}
              />
              <Label htmlFor="key-evidence" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Mark as Key Evidence
              </Label>
            </div>

            <div>
              <Label htmlFor="tags">Tags</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  id="tags"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Add tag and press Enter"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                />
                <Button type="button" onClick={addTag} variant="outline" size="sm">
                  Add
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {tags.map(tag => (
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isUploading}>
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={files.length === 0 || files.every(f => f.status !== 'ready') || isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload {files.length} File{files.length !== 1 ? 's' : ''}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
