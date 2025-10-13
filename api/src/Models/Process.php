<?php

declare(strict_types=1);

namespace AssurKit\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Process extends Model
{
    protected $fillable = [
        'company_id',
        'name',
        'description',
        'owner_email',
        'metadata',
        'is_active',
    ];

    protected $casts = [
        'id' => 'string',
        'company_id' => 'string',
        'metadata' => 'array',
        'is_active' => 'boolean',
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

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function subprocesses(): HasMany
    {
        return $this->hasMany(Subprocess::class);
    }

    public function activeSubprocesses(): HasMany
    {
        return $this->subprocesses()->where('is_active', true);
    }
}
