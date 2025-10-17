<?php

declare(strict_types=1);

namespace AssurKit\Models;

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
        'metadata' => 'array',
        'is_active' => 'boolean',
    ];

    public function processes(): HasMany
    {
        return $this->hasMany(Process::class);
    }

    public function activeProcesses(): HasMany
    {
        return $this->processes()->where('is_active', true);
    }
}
