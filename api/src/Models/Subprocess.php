<?php

declare(strict_types=1);

namespace AssurKit\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Subprocess extends Model
{
    protected $fillable = [
        'process_id',
        'name',
        'description',
        'owner_email',
        'assertions',
        'metadata',
        'is_active',
    ];

    protected $casts = [
        'id' => 'string',
        'process_id' => 'string',
        'assertions' => 'array',
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

    public function process(): BelongsTo
    {
        return $this->belongsTo(Process::class);
    }

    public function company(): BelongsTo
    {
        return $this->process->company();
    }

    public function risks(): HasMany
    {
        return $this->hasMany(Risk::class);
    }

    public function activeRisks(): HasMany
    {
        return $this->risks()->where('is_active', true);
    }

    public static function getAvailableAssertions(): array
    {
        return [
            'existence_occurrence' => 'Existence/Occurrence',
            'completeness' => 'Completeness',
            'accuracy_valuation' => 'Accuracy/Valuation',
            'cutoff' => 'Cut-off',
            'classification_understandability' => 'Classification/Understandability',
            'rights_obligations' => 'Rights and Obligations',
        ];
    }
}
