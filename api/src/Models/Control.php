<?php

declare(strict_types=1);

namespace AssurKit\Models;

use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Control extends Model
{
    protected $fillable = [
        'control_id',
        'name',
        'description',
        'control_type',
        'frequency',
        'automation_level',
        'is_key_control',
        'owner_email',
        'reviewer_email',
        'evidence_requirements',
        'metadata',
        'status',
    ];

    protected $casts = [
        'is_key_control' => 'boolean',
        'evidence_requirements' => 'array',
        'metadata' => 'array',
    ];

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function ($model) {
            // Auto-generate control_id if not provided
            if (empty($model->control_id)) {
                $model->control_id = static::generateControlId();
            }
        });
    }

    public function risks(): BelongsToMany
    {
        return $this->belongsToMany(Risk::class, 'risk_control_matrix')
                    ->withPivot(['effectiveness', 'rationale', 'metadata'])
                    ->withTimestamps();
    }

    public function tests(): HasMany
    {
        return $this->hasMany(Test::class);
    }

    public function activeTests(): HasMany
    {
        return $this->tests()->whereIn('status', ['Planned', 'In Progress', 'Submitted', 'In Review']);
    }

    public static function generateControlId(): string
    {
        $lastControl = static::orderBy('control_id', 'desc')->first();

        if (!$lastControl || !$lastControl->control_id) {
            return 'CTL-001';
        }

        // Extract number from control_id like CTL-001
        if (preg_match('/CTL-(\d+)/', $lastControl->control_id, $matches)) {
            $nextNumber = intval($matches[1]) + 1;

            return 'CTL-' . str_pad((string) $nextNumber, 3, '0', STR_PAD_LEFT);
        }

        return 'CTL-001';
    }

    public static function getAvailableTypes(): array
    {
        return ['Preventive', 'Detective', 'Corrective'];
    }

    public static function getAvailableFrequencies(): array
    {
        return ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Annual', 'Ad-hoc'];
    }

    public static function getAvailableAutomationLevels(): array
    {
        return ['Manual', 'Semi-automated', 'Automated'];
    }

    public static function getAvailableStatuses(): array
    {
        return ['Draft', 'Active', 'Retired'];
    }

    public function getFrequencyWeightAttribute(): int
    {
        $weights = [
            'Daily' => 5,
            'Weekly' => 4,
            'Monthly' => 3,
            'Quarterly' => 2,
            'Annual' => 1,
            'Ad-hoc' => 1,
        ];

        return $weights[$this->frequency] ?? 1;
    }

    public function getAutomationScoreAttribute(): int
    {
        $scores = [
            'Automated' => 3,
            'Semi-automated' => 2,
            'Manual' => 1,
        ];

        return $scores[$this->automation_level] ?? 1;
    }
}
