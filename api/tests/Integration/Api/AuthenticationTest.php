<?php

declare(strict_types=1);

use AssurKit\Models\User;
use AssurKit\Tests\Integration\IntegrationTestCase;

uses(IntegrationTestCase::class);

describe('POST /api/auth/login', function () {
    test('successfully authenticates user with valid credentials', function () {
        User::createUser('user@example.com', 'Test User', 'password123');

        $response = $this->post('/api/auth/login', [
            'email' => 'user@example.com',
            'password' => 'password123',
        ]);

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(200)
            ->and($data)->toHaveKey('token')
            ->and($data)->toHaveKey('user')
            ->and($data['user']['email'])->toBe('user@example.com')
            ->and($data['message'])->toBe('Login successful');
    });

    test('returns 401 for invalid credentials', function () {
        User::createUser('user@example.com', 'Test User', 'password123');

        $response = $this->post('/api/auth/login', [
            'email' => 'user@example.com',
            'password' => 'wrongpassword',
        ]);

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(401)
            ->and($data['error'])->toBe(true);
    });

    test('returns 400 for missing email', function () {
        $response = $this->post('/api/auth/login', [
            'password' => 'password123',
        ]);

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(400)
            ->and($data['error'])->toBe(true);
    });

    test('returns 400 for invalid email format', function () {
        $response = $this->post('/api/auth/login', [
            'email' => 'not-an-email',
            'password' => 'password123',
        ]);

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(400)
            ->and($data['error'])->toBe(true);
    });
});

describe('POST /api/auth/register', function () {
    test('successfully registers new user', function () {
        $response = $this->post('/api/auth/register', [
            'email' => 'newuser@example.com',
            'name' => 'New User',
            'password' => 'password123',
        ]);

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(201)
            ->and($data)->toHaveKey('token')
            ->and($data)->toHaveKey('user')
            ->and($data['user']['email'])->toBe('newuser@example.com')
            ->and($data['user']['roles'])->toContain('Viewer')
            ->and($data['message'])->toBe('Registration successful');

        // Verify user was created in database
        $user = User::where('email', 'newuser@example.com')->first();
        expect($user)->not->toBeNull();
    });

    test('returns 409 for duplicate email', function () {
        User::createUser('existing@example.com', 'Existing User', 'password123');

        $response = $this->post('/api/auth/register', [
            'email' => 'existing@example.com',
            'name' => 'Another User',
            'password' => 'password123',
        ]);

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(409)
            ->and($data['error'])->toBe(true);
    });

    test('returns 400 for invalid email', function () {
        $response = $this->post('/api/auth/register', [
            'email' => 'not-an-email',
            'name' => 'Test User',
            'password' => 'password123',
        ]);

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(400)
            ->and($data['error'])->toBe(true);
    });

    test('returns 400 for password too short', function () {
        $response = $this->post('/api/auth/register', [
            'email' => 'test@example.com',
            'name' => 'Test User',
            'password' => 'short',
        ]);

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(400)
            ->and($data['error'])->toBe(true);
    });

    test('hashes password securely', function () {
        $this->post('/api/auth/register', [
            'email' => 'secure@example.com',
            'name' => 'Secure User',
            'password' => 'password123',
        ]);

        $user = User::where('email', 'secure@example.com')->first();

        expect($user->password_hash)->not->toBe('password123')
            ->and(password_verify('password123', $user->password_hash))->toBeTrue();
    });
});

describe('GET /api/auth/me', function () {
    test('returns current user information', function () {
        $token = $this->createUserWithToken('me@example.com', 'Me User', 'password123', 'Admin');

        $response = $this->get('/api/auth/me', $this->authHeader($token));

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(200)
            ->and($data)->toHaveKey('user')
            ->and($data['user']['email'])->toBe('me@example.com')
            ->and($data['user']['roles'])->toContain('Admin');
    });

    test('returns 401 without authentication token', function () {
        $response = $this->get('/api/auth/me');

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(401)
            ->and($data['error'])->toBe('Unauthorized');
    });

    test('returns 401 with invalid token', function () {
        $response = $this->get('/api/auth/me', ['Authorization' => 'Bearer invalid.token.here']);

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(401)
            ->and($data['error'])->toBe('Unauthorized');
    });
});

describe('POST /api/auth/refresh', function () {
    test('refreshes valid token', function () {
        $token = $this->createUserWithToken('refresh@example.com', 'Refresh User', 'password123', 'Viewer');

        $response = $this->post(
            '/api/auth/refresh',
            [],
            ['Authorization' => "Bearer {$token}"]
        );

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(200)
            ->and($data)->toHaveKey('token')
            ->and($data['token'])->not->toBe($token)
            ->and($data['message'])->toBe('Token refreshed successfully');
    });

    test('returns 400 without token', function () {
        $response = $this->post('/api/auth/refresh', []);

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(400)
            ->and($data['error'])->toBe(true);
    });

    test('returns 401 with invalid token', function () {
        $response = $this->post(
            '/api/auth/refresh',
            [],
            ['Authorization' => 'Bearer invalid.token.here']
        );

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(401)
            ->and($data['error'])->toBe(true);
    });
});
