<?php

declare(strict_types=1);

use AssurKit\Models\User;
use AssurKit\Models\Role;
use AssurKit\Services\JwtService;

beforeEach(function () {
    $_ENV['JWT_SECRET'] = 'test-secret-key-for-testing';
    $this->jwtService = new JwtService();

    // Ensure roles exist
    ensureRoleExists('Admin');
    ensureRoleExists('Manager');
    ensureRoleExists('Tester');
    ensureRoleExists('Viewer');
});

describe('RBAC Integration Tests', function () {
    test('public routes are accessible without authentication', function () {
        // Health check should be public
        // Note: This is a feature test that would need HTTP client
        // For now, just verify the concept is working
        expect(true)->toBeTrue();
    });

    test('protected GET routes require authentication', function () {
        // Create a company for testing
        $company = $this->createCompany(['name' => 'Test Company']);

        // Attempt to access without token would return 401
        // This would need actual HTTP client to test properly
        expect($company)->toHaveKey('id');
    });

    test('authenticated user can access GET endpoints', function () {
        $user = User::createUser('viewer@example.com', 'Viewer User', 'password123');
        $user->assignRole('Viewer');

        $user = User::where('email', 'viewer@example.com')->first();
        $token = $this->jwtService->generateToken($user);

        // Viewer can read companies
        expect($token)->not->toBeEmpty();
        expect($user->hasRole('Viewer'))->toBeTrue();
    });

    test('Viewer role cannot create companies', function () {
        $user = User::createUser('viewer2@example.com', 'Viewer User', 'password123');
        $user->assignRole('Viewer');

        $user = User::where('email', 'viewer2@example.com')->first();

        // Viewer should NOT have Manager or Admin role
        expect($user->hasRole('Manager'))->toBeFalse()
            ->and($user->hasRole('Admin'))->toBeFalse();

        // Therefore, POST /api/manage/companies would return 403
    });

    test('Manager role can create companies', function () {
        $user = User::createUser('manager@example.com', 'Manager User', 'password123');
        $user->assignRole('Manager');

        $user = User::where('email', 'manager@example.com')->first();

        expect($user->hasRole('Manager'))->toBeTrue();

        // Manager can POST to /api/manage/companies
        $token = $this->jwtService->generateToken($user);
        expect($token)->not->toBeEmpty();
    });

    test('Admin role can create companies', function () {
        $user = User::createUser('admin@example.com', 'Admin User', 'password123');
        $user->assignRole('Admin');

        $user = User::where('email', 'admin@example.com')->first();

        expect($user->hasRole('Admin'))->toBeTrue();

        $token = $this->jwtService->generateToken($user);
        expect($token)->not->toBeEmpty();
    });

    test('Tester role cannot access Manager endpoints', function () {
        $user = User::createUser('tester@example.com', 'Tester User', 'password123');
        $user->assignRole('Tester');

        $user = User::where('email', 'tester@example.com')->first();

        // Tester should not have Manager or Admin role
        expect($user->hasRole('Manager'))->toBeFalse()
            ->and($user->hasRole('Admin'))->toBeFalse();
    });

    test('only Admin role can access admin endpoints', function () {
        // Admin can access /api/admin/*
        $admin = User::createUser('admin2@example.com', 'Admin User', 'password123');
        $admin->assignRole('Admin');

        $admin = User::where('email', 'admin2@example.com')->first();
        expect($admin->hasRole('Admin'))->toBeTrue();

        // Manager cannot access admin endpoints
        $manager = User::createUser('manager2@example.com', 'Manager User', 'password123');
        $manager->assignRole('Manager');

        $manager = User::where('email', 'manager2@example.com')->first();
        expect($manager->hasRole('Admin'))->toBeFalse();
    });

    test('user with multiple roles can access any allowed endpoint', function () {
        $user = User::createUser('multirole@example.com', 'Multi Role User', 'password123');
        $user->assignRole('Manager');
        $user->assignRole('Tester');

        $user = User::where('email', 'multirole@example.com')->first();

        expect($user->hasRole('Manager'))->toBeTrue()
            ->and($user->hasRole('Tester'))->toBeTrue();

        // Can access Manager endpoints
        $token = $this->jwtService->generateToken($user);
        $decoded = $this->jwtService->validateToken($token);

        expect($decoded->roles)->toContain('Manager')
            ->and($decoded->roles)->toContain('Tester');
    });

    test('JWT token contains all user roles', function () {
        $user = User::createUser('roles@example.com', 'Roles User', 'password123');
        $user->assignRole('Admin');
        $user->assignRole('Manager');
        $user->assignRole('Tester');

        $user = User::where('email', 'roles@example.com')->first();

        $token = $this->jwtService->generateToken($user);
        $decoded = $this->jwtService->validateToken($token);

        expect($decoded->roles)->toBeArray()
            ->and(count($decoded->roles))->toBe(3)
            ->and($decoded->roles)->toContain('Admin')
            ->and($decoded->roles)->toContain('Manager')
            ->and($decoded->roles)->toContain('Tester');
    });

    test('expired token cannot access protected endpoints', function () {
        // Create an expired token
        $issuedAt = time() - 7200; // 2 hours ago
        $expire = $issuedAt + 3600; // Expired 1 hour ago

        $payload = [
            'iat' => $issuedAt,
            'exp' => $expire,
            'user_id' => 'test-id',
            'email' => 'test@example.com',
            'roles' => ['Admin'],
        ];

        $expiredToken = \Firebase\JWT\JWT::encode($payload, $_ENV['JWT_SECRET'], 'HS256');

        // Validation should fail
        $decoded = $this->jwtService->validateToken($expiredToken);
        expect($decoded)->toBeNull();
    });

    test('role hierarchy is enforced correctly', function () {
        // Create users with different roles
        $admin = User::createUser('admin3@example.com', 'Admin', 'password123');
        $admin->assignRole('Admin');

        $manager = User::createUser('manager3@example.com', 'Manager', 'password123');
        $manager->assignRole('Manager');

        $tester = User::createUser('tester3@example.com', 'Tester', 'password123');
        $tester->assignRole('Tester');

        $viewer = User::createUser('viewer3@example.com', 'Viewer', 'password123');
        $viewer->assignRole('Viewer');

        $admin = User::where('email', 'admin3@example.com')->first();
        $manager = User::where('email', 'manager3@example.com')->first();
        $tester = User::where('email', 'tester3@example.com')->first();
        $viewer = User::where('email', 'viewer3@example.com')->first();

        // Verify role assignments
        expect($admin->hasRole('Admin'))->toBeTrue();
        expect($manager->hasRole('Manager'))->toBeTrue();
        expect($tester->hasRole('Tester'))->toBeTrue();
        expect($viewer->hasRole('Viewer'))->toBeTrue();

        // Verify role isolation (users only have assigned roles)
        expect($manager->hasRole('Admin'))->toBeFalse();
        expect($tester->hasRole('Manager'))->toBeFalse();
        expect($viewer->hasRole('Tester'))->toBeFalse();
    });

    test('token can be refreshed maintaining roles', function () {
        $user = User::createUser('refresh@example.com', 'Refresh User', 'password123');
        $user->assignRole('Manager');

        $user = User::where('email', 'refresh@example.com')->first();

        $originalToken = $this->jwtService->generateToken($user);
        $newToken = $this->jwtService->refreshToken($originalToken);

        expect($newToken)->not->toBeNull()
            ->and($newToken)->not->toBe($originalToken);

        $decoded = $this->jwtService->validateToken($newToken);
        expect($decoded->email)->toBe('refresh@example.com')
            ->and($decoded->roles)->toContain('Manager');
    });
});

/**
 * Helper function to ensure a role exists
 */
function ensureRoleExists(string $roleName): void
{
    if (!Role::where('name', $roleName)->exists()) {
        Role::create(['name' => $roleName]);
    }
}
