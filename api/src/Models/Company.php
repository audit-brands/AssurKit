<?php

declare(strict_types=1);

namespace AssurKit\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Company extends Model
{
    protected $fillable = [
        'name',
        'description',
        'ticker_symbol',
        'industry',
        'metadata',
        'is_active',
    ];

    protected $casts = [
        'id' => 'string',
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

    public function processes(): HasMany
    {
        return $this->hasMany(Process::class);
    }

    public function activeProcesses(): HasMany
    {
        return $this->processes()->where('is_active', true);
    }
}
