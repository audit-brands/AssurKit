<?php

declare(strict_types=1);

namespace AssurKit\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Risk extends Model
{
    protected $fillable = [
        'subprocess_id',
        'name',
        'description',
        'risk_type',
        'likelihood',
        'impact',
        'assertions',
        'metadata',
        'is_active',
    ];

    protected $casts = [
        'id' => 'string',
        'subprocess_id' => 'string',
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

    public function subprocess(): BelongsTo
    {
        return $this->belongsTo(Subprocess::class);
    }

    public function controls(): BelongsToMany
    {
        return $this->belongsToMany(Control::class, 'risk_control_matrix')
                    ->withPivot(['effectiveness', 'rationale', 'metadata'])
                    ->withTimestamps();
    }

    public function getCalculatedRiskScoreAttribute(): int
    {
        $likelihoodScores = [
            'Very Low' => 1,
            'Low' => 2,
            'Medium' => 3,
            'High' => 4,
            'Very High' => 5,
        ];

        $impactScores = [
            'Very Low' => 1,
            'Low' => 2,
            'Medium' => 3,
            'High' => 4,
            'Very High' => 5,
        ];

        $likelihoodScore = $likelihoodScores[$this->likelihood] ?? 3;
        $impactScore = $impactScores[$this->impact] ?? 3;

        return $likelihoodScore * $impactScore;
    }

    public function getRiskLevelAttribute(): string
    {
        $score = $this->calculated_risk_score;

        if ($score <= 6) {
            return 'Low';
        } elseif ($score <= 12) {
            return 'Medium';
        } elseif ($score <= 20) {
            return 'High';
        } else {
            return 'Very High';
        }
    }

    public static function getAvailableRiskTypes(): array
    {
        return ['Operational', 'Financial', 'Compliance', 'Strategic', 'Technology'];
    }

    public static function getAvailableLevels(): array
    {
        return ['Very Low', 'Low', 'Medium', 'High', 'Very High'];
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