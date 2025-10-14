<?php

declare(strict_types=1);

namespace AssurKit\Controllers;

use AssurKit\Models\Evidence;
use Illuminate\Database\Eloquent\Builder;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Message\UploadedFileInterface;

class EvidenceController
{
    private string $uploadPath;
    private array $allowedMimeTypes;
    private int $maxFileSize;

    public function __construct()
    {
        // Configure upload settings
        $this->uploadPath = $_ENV['EVIDENCE_UPLOAD_PATH'] ?? '/tmp/evidence';
        $this->maxFileSize = (int) ($_ENV['MAX_EVIDENCE_FILE_SIZE'] ?? 52428800); // 50MB default
        $this->allowedMimeTypes = [
            // Images
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            // Documents
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            // Text
            'text/plain', 'text/csv',
            // Archives
            'application/zip',
        ];

        // Ensure upload directory exists
        if (!is_dir($this->uploadPath)) {
            mkdir($this->uploadPath, 0755, true);
        }
    }

    public function index(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $queryParams = $request->getQueryParams();

        $page = max(1, (int) ($queryParams['page'] ?? 1));
        $limit = min(100, max(10, (int) ($queryParams['limit'] ?? 20)));
        $search = $queryParams['search'] ?? '';
        $uploaderEmail = $queryParams['uploader_email'] ?? '';
        $mimeType = $queryParams['mime_type'] ?? '';
        $status = $queryParams['status'] ?? '';

        $query = Evidence::query();

        if ($search) {
            $query->where(function (Builder $q) use ($search): void {
                $q->where('original_filename', 'ILIKE', "%{$search}%")
                  ->orWhere('description', 'ILIKE', "%{$search}%");
            });
        }

        if ($uploaderEmail) {
            $query->byUploader($uploaderEmail);
        }

        if ($mimeType) {
            if ($mimeType === 'image') {
                $query->images();
            } elseif ($mimeType === 'document') {
                $query->documents();
            } else {
                $query->where('mime_type', $mimeType);
            }
        }

        if ($status) {
            $query->where('status', $status);
        }

        $total = $query->count();
        $evidence = $query->skip(($page - 1) * $limit)
                         ->take($limit)
                         ->orderBy('created_at', 'desc')
                         ->get();

        /** @var array<array{id: string, filename: string, original_filename: string, mime_type: string, file_size: int, file_size_human: string, uploaded_by_email: string, description: string|null, status: string, is_image: bool, is_pdf: bool, is_document: bool, created_at: string}> $data */
        $data = [];
        foreach ($evidence as $file) {
            $data[] = [
                'id' => $file->id,
                'filename' => $file->filename,
                'original_filename' => $file->original_filename,
                'mime_type' => $file->mime_type,
                'file_size' => $file->file_size,
                'file_size_human' => $file->file_size_human,
                'uploaded_by_email' => $file->uploaded_by_email,
                'description' => $file->description,
                'status' => $file->status,
                'is_image' => $file->is_image,
                'is_pdf' => $file->is_pdf,
                'is_document' => $file->is_document,
                'created_at' => $file->created_at->toISOString(),
            ];
        }

        $responseData = [
            'data' => $data,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'pages' => ceil($total / $limit),
            ],
            'upload_limits' => [
                'max_file_size' => $this->maxFileSize,
                'max_file_size_human' => $this->formatBytes($this->maxFileSize),
                'allowed_mime_types' => $this->allowedMimeTypes,
            ],
        ];

        return $this->jsonResponse($response, $responseData);
    }

    public function show(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $evidenceId = $args['id'];
        $evidence = Evidence::find($evidenceId);

        if (!$evidence) {
            return $this->errorResponse($response, ['Evidence not found'], 404);
        }

        $responseData = [
            'id' => $evidence->id,
            'filename' => $evidence->filename,
            'original_filename' => $evidence->original_filename,
            'mime_type' => $evidence->mime_type,
            'file_size' => $evidence->file_size,
            'file_size_human' => $evidence->file_size_human,
            'sha256_hash' => $evidence->sha256_hash,
            'uploaded_by_email' => $evidence->uploaded_by_email,
            'description' => $evidence->description,
            'metadata' => $evidence->metadata,
            'status' => $evidence->status,
            'is_image' => $evidence->is_image,
            'is_pdf' => $evidence->is_pdf,
            'is_document' => $evidence->is_document,
            'archived_at' => $evidence->archived_at?->toISOString(),
            'created_at' => $evidence->created_at->toISOString(),
            'updated_at' => $evidence->updated_at->toISOString(),
        ];

        return $this->jsonResponse($response, $responseData);
    }

    public function upload(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $uploadedFiles = $request->getUploadedFiles();
        $parsedBody = $request->getParsedBody();

        if (empty($uploadedFiles['file'])) {
            return $this->errorResponse($response, ['No file uploaded'], 400);
        }

        /** @var UploadedFileInterface $uploadedFile */
        $uploadedFile = $uploadedFiles['file'];

        // Validate file
        $validation = $this->validateUploadedFile($uploadedFile);
        if (!$validation['valid']) {
            return $this->errorResponse($response, $validation['errors'], 400);
        }

        // Get user from request (assuming it's set by auth middleware)
        $user = $request->getAttribute('user');
        $uploaderEmail = $user ? $user->email : 'unknown@example.com';

        // Generate unique filename
        $extension = pathinfo($uploadedFile->getClientFilename(), PATHINFO_EXTENSION);
        $filename = uniqid() . '_' . time() . '.' . $extension;
        $filePath = $this->uploadPath . '/' . $filename;

        // Calculate file hash before moving
        $tempPath = $uploadedFile->getStream()->getMetadata('uri');
        $fileHash = hash_file('sha256', $tempPath);

        // Check for duplicate files
        $existingEvidence = Evidence::where('sha256_hash', $fileHash)->first();
        if ($existingEvidence) {
            return $this->errorResponse($response, [
                'File already exists',
                'Existing file ID: ' . $existingEvidence->id,
            ], 409);
        }

        // Move uploaded file
        try {
            $uploadedFile->moveTo($filePath);
        } catch (\Exception $e) {
            return $this->errorResponse($response, ['Failed to save file: ' . $e->getMessage()], 500);
        }

        // Create evidence record
        $evidence = Evidence::create([
            'filename' => $filename,
            'original_filename' => $uploadedFile->getClientFilename(),
            'mime_type' => $uploadedFile->getClientMediaType() ?? 'application/octet-stream',
            'file_size' => $uploadedFile->getSize(),
            'sha256_hash' => $fileHash,
            'storage_path' => $filePath,
            'uploaded_by_email' => $uploaderEmail,
            'description' => $parsedBody['description'] ?? null,
            'metadata' => isset($parsedBody['metadata']) ? json_decode($parsedBody['metadata'], true) : null,
            'status' => 'Available',
        ]);

        $responseData = [
            'message' => 'File uploaded successfully',
            'evidence' => [
                'id' => $evidence->id,
                'filename' => $evidence->filename,
                'original_filename' => $evidence->original_filename,
                'mime_type' => $evidence->mime_type,
                'file_size' => $evidence->file_size,
                'file_size_human' => $evidence->file_size_human,
                'sha256_hash' => $evidence->sha256_hash,
                'uploaded_by_email' => $evidence->uploaded_by_email,
                'description' => $evidence->description,
                'status' => $evidence->status,
                'created_at' => $evidence->created_at->toISOString(),
            ],
        ];

        return $this->jsonResponse($response, $responseData, 201);
    }

    public function download(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $evidenceId = $args['id'];
        $evidence = Evidence::find($evidenceId);

        if (!$evidence) {
            return $this->errorResponse($response, ['Evidence not found'], 404);
        }

        if ($evidence->status !== 'Available') {
            return $this->errorResponse($response, ['Evidence is not available for download'], 400);
        }

        if (!file_exists($evidence->storage_path)) {
            return $this->errorResponse($response, ['File not found on storage'], 404);
        }

        // Set appropriate headers for file download
        $response = $response->withHeader('Content-Type', $evidence->mime_type)
                           ->withHeader('Content-Length', (string) $evidence->file_size)
                           ->withHeader('Content-Disposition', 'attachment; filename="' . $evidence->original_filename . '"')
                           ->withHeader('X-Evidence-ID', $evidence->id)
                           ->withHeader('X-SHA256-Hash', $evidence->sha256_hash);

        // Stream file content
        $response->getBody()->write(file_get_contents($evidence->storage_path));

        return $response;
    }

    public function updateMetadata(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $evidenceId = $args['id'];
        $evidence = Evidence::find($evidenceId);

        if (!$evidence) {
            return $this->errorResponse($response, ['Evidence not found'], 404);
        }

        $data = $request->getParsedBody();

        if (isset($data['description'])) {
            $evidence->description = $data['description'];
        }

        if (isset($data['metadata'])) {
            if (!is_array($data['metadata'])) {
                return $this->errorResponse($response, ['Metadata must be an object/array'], 400);
            }
            $evidence->metadata = $data['metadata'];
        }

        $evidence->save();

        $responseData = [
            'message' => 'Evidence metadata updated successfully',
            'evidence' => [
                'id' => $evidence->id,
                'description' => $evidence->description,
                'metadata' => $evidence->metadata,
                'updated_at' => $evidence->updated_at->toISOString(),
            ],
        ];

        return $this->jsonResponse($response, $responseData);
    }

    public function archive(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $evidenceId = $args['id'];
        $evidence = Evidence::find($evidenceId);

        if (!$evidence) {
            return $this->errorResponse($response, ['Evidence not found'], 404);
        }

        $evidence->status = 'Archived';
        $evidence->archived_at = date('Y-m-d H:i:s');
        $evidence->save();

        $responseData = [
            'message' => 'Evidence archived successfully',
            'evidence' => [
                'id' => $evidence->id,
                'status' => $evidence->status,
                'archived_at' => $evidence->archived_at->toISOString(),
            ],
        ];

        return $this->jsonResponse($response, $responseData);
    }

    private function validateUploadedFile(UploadedFileInterface $file): array
    {
        $errors = [];

        // Check upload errors
        if ($file->getError() !== UPLOAD_ERR_OK) {
            $errors[] = 'File upload error: ' . $this->getUploadErrorMessage($file->getError());
        }

        // Check file size
        if ($file->getSize() > $this->maxFileSize) {
            $errors[] = 'File too large. Maximum size: ' . $this->formatBytes($this->maxFileSize);
        }

        // Check file type
        $mimeType = $file->getClientMediaType();
        if (!in_array($mimeType, $this->allowedMimeTypes, true)) {
            $errors[] = 'File type not allowed: ' . $mimeType;
        }

        // Check filename
        if (empty($file->getClientFilename())) {
            $errors[] = 'Filename is required';
        }

        return ['valid' => empty($errors), 'errors' => $errors];
    }

    private function getUploadErrorMessage(int $error): string
    {
        $messages = [
            UPLOAD_ERR_INI_SIZE => 'File exceeds upload_max_filesize',
            UPLOAD_ERR_FORM_SIZE => 'File exceeds MAX_FILE_SIZE',
            UPLOAD_ERR_PARTIAL => 'File was partially uploaded',
            UPLOAD_ERR_NO_FILE => 'No file was uploaded',
            UPLOAD_ERR_NO_TMP_DIR => 'Missing temporary folder',
            UPLOAD_ERR_CANT_WRITE => 'Failed to write file to disk',
            UPLOAD_ERR_EXTENSION => 'File upload stopped by extension',
        ];

        return $messages[$error] ?? 'Unknown upload error';
    }

    private function formatBytes(int $bytes): string
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];

        $unitIndex = 0;
        while ($bytes >= 1024 && $unitIndex < 4) {
            $bytes /= 1024;
            $unitIndex++;
        }

        return round($bytes, 2) . ' ' . $units[$unitIndex];
    }

    private function jsonResponse(ResponseInterface $response, array $data, int $status = 200): ResponseInterface
    {
        $response->getBody()->write(json_encode($data));

        return $response
            ->withStatus($status)
            ->withHeader('Content-Type', 'application/json');
    }

    private function errorResponse(ResponseInterface $response, array $errors, int $status = 400): ResponseInterface
    {
        $data = [
            'error' => true,
            'message' => 'Request failed',
            'errors' => $errors,
        ];

        return $this->jsonResponse($response, $data, $status);
    }
}
