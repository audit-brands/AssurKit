<?php

declare(strict_types=1);

namespace AssurKit\Models;

use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Role extends Model
{
    protected $fillable = [
        'name',
        'description',
    ];

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'user_roles')
            ->withPivot('assigned_at')
            ->withTimestamps();
    }

    public static function getDefaultRoles(): array
    {
        return [
            [
                'name' => 'Admin',
                'description' => 'Full system access',
            ],
            [
                'name' => 'Manager',
                'description' => 'Can manage tests and assignments',
            ],
            [
                'name' => 'Tester',
                'description' => 'Can perform tests and upload evidence',
            ],
            [
                'name' => 'Viewer',
                'description' => 'Read-only access',
            ],
        ];
    }
}
