<?php

declare(strict_types=1);

namespace AssurKit\Models;

use Illuminate\Database\Eloquent\Model;

class Evidence extends Model
{
    protected $table = 'evidence';

    protected $fillable = [
        'filename',
        'original_filename',
        'mime_type',
        'file_size',
        'sha256_hash',
        'storage_path',
        'uploaded_by_email',
        'description',
        'metadata',
        'status',
        'archived_at',
    ];

    protected $casts = [
        'id' => 'string',
        'file_size' => 'integer',
        'metadata' => 'array',
        'archived_at' => 'datetime',
    ];

    protected $keyType = 'string';
    public $incrementing = false;

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = (string) \Ramsey\Uuid\Uuid::uuid4();
            }
        });
    }

    public static function getAvailableStatuses(): array
    {
        return ['Uploading', 'Available', 'Archived'];
    }

    public function getFileSizeHumanAttribute(): string
    {
        $bytes = $this->file_size;
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];

        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }

        return round($bytes, 2) . ' ' . $units[$i];
    }

    public function getIsImageAttribute(): bool
    {
        return str_starts_with($this->mime_type, 'image/');
    }

    public function getIsPdfAttribute(): bool
    {
        return $this->mime_type === 'application/pdf';
    }

    public function getIsDocumentAttribute(): bool
    {
        $documentTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/plain',
            'text/csv',
        ];

        return in_array($this->mime_type, $documentTypes, true);
    }

    public function scopeByUploader($query, string $uploaderEmail)
    {
        return $query->where('uploaded_by_email', $uploaderEmail);
    }

    public function scopeAvailable($query)
    {
        return $query->where('status', 'Available');
    }

    public function scopeImages($query)
    {
        return $query->where('mime_type', 'like', 'image/%');
    }

    public function scopeDocuments($query)
    {
        return $query->whereIn('mime_type', [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/plain',
            'text/csv',
        ]);
    }
}