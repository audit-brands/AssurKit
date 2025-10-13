<?php

declare(strict_types=1);

namespace AssurKit\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Test extends Model
{
    protected $fillable = [
        'test_id',
        'control_id',
        'name',
        'description',
        'test_method',
        'test_scope',
        'sample_size',
        'sample_criteria',
        'period_start',
        'period_end',
        'tester_email',
        'reviewer_email',
        'status',
        'test_procedures',
        'test_results',
        'conclusion',
        'deficiency_description',
        'management_response',
        'evidence_references',
        'metadata',
        'started_at',
        'submitted_at',
        'reviewed_at',
        'concluded_at',
    ];

    protected $casts = [
        'id' => 'string',
        'control_id' => 'string',
        'period_start' => 'date',
        'period_end' => 'date',
        'evidence_references' => 'array',
        'metadata' => 'array',
        'started_at' => 'datetime',
        'submitted_at' => 'datetime',
        'reviewed_at' => 'datetime',
        'concluded_at' => 'datetime',
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

            // Auto-generate test_id if not provided
            if (empty($model->test_id)) {
                $model->test_id = static::generateTestId();
            }
        });

        static::updating(function ($model) {
            // Auto-set workflow timestamps
            if ($model->isDirty('status')) {
                static::updateWorkflowTimestamps($model);
            }
        });
    }

    public function control(): BelongsTo
    {
        return $this->belongsTo(Control::class);
    }

    public static function generateTestId(): string
    {
        $lastTest = static::orderBy('test_id', 'desc')->first();

        if (!$lastTest || !$lastTest->test_id) {
            return 'TST-001';
        }

        // Extract number from test_id like TST-001
        if (preg_match('/TST-(\d+)/', $lastTest->test_id, $matches)) {
            $nextNumber = intval($matches[1]) + 1;

            return 'TST-' . str_pad((string) $nextNumber, 3, '0', STR_PAD_LEFT);
        }

        return 'TST-001';
    }

    public static function updateWorkflowTimestamps(Test $test): void
    {
        $now = date('Y-m-d H:i:s');

        switch ($test->status) {
            case 'In Progress':
                if (!$test->started_at) {
                    $test->started_at = $now;
                }
                break;
            case 'Submitted':
                if (!$test->submitted_at) {
                    $test->submitted_at = $now;
                }
                break;
            case 'In Review':
                if (!$test->reviewed_at) {
                    $test->reviewed_at = $now;
                }
                break;
            case 'Concluded':
                if (!$test->concluded_at) {
                    $test->concluded_at = $now;
                }
                break;
        }
    }

    public static function getAvailableMethods(): array
    {
        return ['Inquiry', 'Observation', 'Inspection', 'Re-performance', 'Analytical'];
    }

    public static function getAvailableScopes(): array
    {
        return ['Full Population', 'Sample Based', 'Key Items', 'Judgmental'];
    }

    public static function getAvailableStatuses(): array
    {
        return ['Planned', 'In Progress', 'Submitted', 'In Review', 'Concluded'];
    }

    public static function getAvailableConclusions(): array
    {
        return ['Effective', 'Deficient', 'Not Tested'];
    }

    public function canTransitionTo(string $newStatus): bool
    {
        $allowedTransitions = [
            'Planned' => ['In Progress'],
            'In Progress' => ['Submitted', 'Planned'],
            'Submitted' => ['In Review', 'In Progress'],
            'In Review' => ['Concluded', 'In Progress'],
            'Concluded' => [], // Terminal state
        ];

        return in_array($newStatus, $allowedTransitions[$this->status] ?? [], true);
    }

    public function getTestDurationAttribute(): ?int
    {
        if (!$this->started_at || !$this->concluded_at) {
            return null;
        }

        return $this->started_at->diffInDays($this->concluded_at);
    }

    public function getIsOverdueAttribute(): bool
    {
        if ($this->status === 'Concluded') {
            return false;
        }

        // Consider tests overdue if they've been in progress for more than 30 days
        if ($this->started_at) {
            $now = new \DateTime();
            return $this->started_at->diff($now)->days > 30;
        }

        return false;
    }

    public function getRiskLevelAttribute(): string
    {
        // Calculate risk level based on control being tested
        if (!$this->control) {
            return 'Unknown';
        }

        // Higher risk for key controls and deficient tests
        if ($this->control->is_key_control && $this->conclusion === 'Deficient') {
            return 'High';
        } elseif ($this->conclusion === 'Deficient') {
            return 'Medium';
        } elseif ($this->conclusion === 'Effective') {
            return 'Low';
        }

        return 'Pending';
    }

    public function scopeForPeriod($query, string $startDate, string $endDate)
    {
        return $query->whereBetween('period_start', [$startDate, $endDate])
                    ->orWhereBetween('period_end', [$startDate, $endDate])
                    ->orWhere(function ($q) use ($startDate, $endDate) {
                        $q->where('period_start', '<=', $startDate)
                          ->where('period_end', '>=', $endDate);
                    });
    }

    public function scopeByTester($query, string $testerEmail)
    {
        return $query->where('tester_email', $testerEmail);
    }

    public function scopeByStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    public function scopeDeficient($query)
    {
        return $query->where('conclusion', 'Deficient');
    }
}