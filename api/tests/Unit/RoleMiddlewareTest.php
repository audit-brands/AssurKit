<?php

declare(strict_types=1);

use AssurKit\Middleware\RoleMiddleware;
use AssurKit\Models\User;
use AssurKit\Models\Role;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

beforeEach(function () {
    // Ensure roles exist
    ensureRoleExists('Admin');
    ensureRoleExists('Manager');
    ensureRoleExists('Tester');
    ensureRoleExists('Viewer');

    // Mock request
    $this->request = Mockery::mock(ServerRequestInterface::class);

    // Mock handler
    $this->handler = Mockery::mock(RequestHandlerInterface::class);
});

describe('RoleMiddleware::process', function () {
    test('allows user with required role', function () {
        $middleware = new RoleMiddleware(['Admin']);

        $user = User::createUser('admin@example.com', 'Admin User', 'password123');
        $user->assignRole('Admin');

        // Refresh to load roles
        $user = User::where('email', 'admin@example.com')->first();

        $this->request->shouldReceive('getAttribute')
            ->with('user')
            ->andReturn($user);

        $response = Mockery::mock(ResponseInterface::class);
        $this->handler->shouldReceive('handle')
            ->with($this->request)
            ->andReturn($response);

        $result = $middleware->process($this->request, $this->handler);

        expect($result)->toBe($response);
    });

    test('allows user with one of multiple required roles', function () {
        $middleware = new RoleMiddleware(['Manager', 'Admin']);

        $user = User::createUser('manager@example.com', 'Manager User', 'password123');
        $user->assignRole('Manager');

        $user = User::where('email', 'manager@example.com')->first();

        $this->request->shouldReceive('getAttribute')
            ->with('user')
            ->andReturn($user);

        $response = Mockery::mock(ResponseInterface::class);
        $this->handler->shouldReceive('handle')
            ->with($this->request)
            ->andReturn($response);

        $result = $middleware->process($this->request, $this->handler);

        expect($result)->toBe($response);
    });

    test('allows user with multiple roles when one matches', function () {
        $middleware = new RoleMiddleware(['Admin']);

        $user = User::createUser('multirole@example.com', 'Multi Role User', 'password123');
        $user->assignRole('Viewer');
        $user->assignRole('Admin');

        $user = User::where('email', 'multirole@example.com')->first();

        $this->request->shouldReceive('getAttribute')
            ->with('user')
            ->andReturn($user);

        $response = Mockery::mock(ResponseInterface::class);
        $this->handler->shouldReceive('handle')
            ->andReturn($response);

        $result = $middleware->process($this->request, $this->handler);

        expect($result)->toBe($response);
    });

    test('returns 403 when user lacks required role', function () {
        $middleware = new RoleMiddleware(['Admin']);

        $user = User::createUser('viewer@example.com', 'Viewer User', 'password123');
        $user->assignRole('Viewer');

        $user = User::where('email', 'viewer@example.com')->first();

        $this->request->shouldReceive('getAttribute')
            ->with('user')
            ->andReturn($user);

        $response = $middleware->process($this->request, $this->handler);

        expect($response->getStatusCode())->toBe(403);

        $body = (string) $response->getBody();
        $data = json_decode($body, true);

        expect($data)->toHaveKey('error')
            ->and($data['error'])->toBe('Forbidden')
            ->and($data['message'])->toContain('Insufficient permissions')
            ->and($data['message'])->toContain('Admin');
    });

    test('returns 403 when user has no roles', function () {
        $middleware = new RoleMiddleware(['Manager']);

        $user = User::createUser('norole@example.com', 'No Role User', 'password123');
        // Don't assign any roles

        $user = User::where('email', 'norole@example.com')->first();

        $this->request->shouldReceive('getAttribute')
            ->with('user')
            ->andReturn($user);

        $response = $middleware->process($this->request, $this->handler);

        expect($response->getStatusCode())->toBe(403);
    });

    test('returns 403 when user is not authenticated', function () {
        $middleware = new RoleMiddleware(['Admin']);

        // Return null instead of a User object
        $this->request->shouldReceive('getAttribute')
            ->with('user')
            ->andReturn(null);

        $response = $middleware->process($this->request, $this->handler);

        expect($response->getStatusCode())->toBe(403);

        $body = (string) $response->getBody();
        $data = json_decode($body, true);

        expect($data['message'])->toContain('not authenticated');
    });

    test('returns 403 when user attribute is not a User instance', function () {
        $middleware = new RoleMiddleware(['Admin']);

        // Return an array instead of a User object
        $this->request->shouldReceive('getAttribute')
            ->with('user')
            ->andReturn(['id' => 'test', 'email' => 'test@example.com']);

        $response = $middleware->process($this->request, $this->handler);

        expect($response->getStatusCode())->toBe(403);
    });

    test('lists all required roles in error message', function () {
        $middleware = new RoleMiddleware(['Admin', 'Manager', 'Tester']);

        $user = User::createUser('viewer2@example.com', 'Viewer User', 'password123');
        $user->assignRole('Viewer');

        $user = User::where('email', 'viewer2@example.com')->first();

        $this->request->shouldReceive('getAttribute')
            ->with('user')
            ->andReturn($user);

        $response = $middleware->process($this->request, $this->handler);

        $body = (string) $response->getBody();
        $data = json_decode($body, true);

        expect($data['message'])->toContain('Admin')
            ->and($data['message'])->toContain('Manager')
            ->and($data['message'])->toContain('Tester');
    });

    test('returns JSON response with correct content-type', function () {
        $middleware = new RoleMiddleware(['Admin']);

        $this->request->shouldReceive('getAttribute')
            ->with('user')
            ->andReturn(null);

        $response = $middleware->process($this->request, $this->handler);

        expect($response->getHeaderLine('Content-Type'))->toBe('application/json');
    });

    test('Manager role can access Manager-only endpoints', function () {
        $middleware = new RoleMiddleware(['Manager', 'Admin']);

        $user = User::createUser('mgr@example.com', 'Manager', 'password123');
        $user->assignRole('Manager');

        $user = User::where('email', 'mgr@example.com')->first();

        $this->request->shouldReceive('getAttribute')
            ->with('user')
            ->andReturn($user);

        $response = Mockery::mock(ResponseInterface::class);
        $this->handler->shouldReceive('handle')
            ->andReturn($response);

        $result = $middleware->process($this->request, $this->handler);

        // Should succeed (not return 403)
        expect($result)->toBe($response);
    });

    test('Tester role cannot access Admin endpoints', function () {
        $middleware = new RoleMiddleware(['Admin']);

        $user = User::createUser('tester@example.com', 'Tester', 'password123');
        $user->assignRole('Tester');

        $user = User::where('email', 'tester@example.com')->first();

        $this->request->shouldReceive('getAttribute')
            ->with('user')
            ->andReturn($user);

        $response = $middleware->process($this->request, $this->handler);

        expect($response->getStatusCode())->toBe(403);
    });

    test('Viewer role cannot access Manager endpoints', function () {
        $middleware = new RoleMiddleware(['Manager', 'Admin']);

        $user = User::createUser('viewer3@example.com', 'Viewer', 'password123');
        $user->assignRole('Viewer');

        $user = User::where('email', 'viewer3@example.com')->first();

        $this->request->shouldReceive('getAttribute')
            ->with('user')
            ->andReturn($user);

        $response = $middleware->process($this->request, $this->handler);

        expect($response->getStatusCode())->toBe(403);
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

afterEach(function () {
    Mockery::close();
});
