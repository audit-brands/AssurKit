<?php

declare(strict_types=1);

use AssurKit\Models\User;
use AssurKit\Services\JwtService;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

beforeEach(function () {
    // Set JWT secret for tests
    $_ENV['JWT_SECRET'] = 'test-secret-key-for-testing';
    $this->jwtService = new JwtService();
});

test('can generate JWT token for user', function () {
    // Create a mock user with roles
    $user = Mockery::mock(User::class);
    $user->id = 'test-user-id';
    $user->email = 'test@example.com';
    $user->name = 'Test User';

    // Mock the roles relationship
    $roles = Mockery::mock();
    $roles->shouldReceive('pluck')->with('name')->andReturn(collect(['Admin', 'Tester']));
    $user->roles = $roles;

    $token = $this->jwtService->generateToken($user);

    expect($token)->toBeString()
        ->and(strlen($token))->toBeGreaterThan(10);
});

test('generated token contains correct user data', function () {
    // Create a mock user
    $user = Mockery::mock(User::class);
    $user->id = 'test-user-id';
    $user->email = 'test@example.com';
    $user->name = 'Test User';

    $roles = Mockery::mock();
    $roles->shouldReceive('pluck')->with('name')->andReturn(collect(['Manager']));
    $user->roles = $roles;

    $token = $this->jwtService->generateToken($user);

    // Decode token to verify payload
    $decoded = JWT::decode($token, new Key($_ENV['JWT_SECRET'], 'HS256'));

    expect($decoded->user_id)->toBe('test-user-id')
        ->and($decoded->email)->toBe('test@example.com')
        ->and($decoded->name)->toBe('Test User')
        ->and($decoded->roles)->toBe(['Manager'])
        ->and($decoded->iat)->toBeInt()
        ->and($decoded->exp)->toBeInt()
        ->and($decoded->exp)->toBeGreaterThan($decoded->iat);
});

test('can validate valid JWT token', function () {
    // Create a valid token
    $issuedAt = time();
    $expire = $issuedAt + 3600;

    $payload = [
        'iat' => $issuedAt,
        'exp' => $expire,
        'user_id' => 'test-id',
        'email' => 'test@example.com',
    ];

    $token = JWT::encode($payload, $_ENV['JWT_SECRET'], 'HS256');

    $decoded = $this->jwtService->validateToken($token);

    expect($decoded)->not->toBeNull()
        ->and($decoded->user_id)->toBe('test-id')
        ->and($decoded->email)->toBe('test@example.com');
});

test('validates token has not expired', function () {
    // Token expires in 1 hour
    $user = Mockery::mock(User::class);
    $user->id = 'test-id';
    $user->email = 'test@example.com';
    $user->name = 'Test';

    $roles = Mockery::mock();
    $roles->shouldReceive('pluck')->with('name')->andReturn(collect([]));
    $user->roles = $roles;

    $token = $this->jwtService->generateToken($user);
    $decoded = $this->jwtService->validateToken($token);

    expect($decoded)->not->toBeNull()
        ->and($decoded->exp)->toBeGreaterThan(time());
});

test('returns null for invalid token', function () {
    $invalidToken = 'invalid.jwt.token';

    $decoded = $this->jwtService->validateToken($invalidToken);

    expect($decoded)->toBeNull();
});

test('returns null for expired token', function () {
    // Create an expired token
    $issuedAt = time() - 7200; // 2 hours ago
    $expire = $issuedAt + 3600; // Expired 1 hour ago

    $payload = [
        'iat' => $issuedAt,
        'exp' => $expire,
        'user_id' => 'test-id',
    ];

    $token = JWT::encode($payload, $_ENV['JWT_SECRET'], 'HS256');

    $decoded = $this->jwtService->validateToken($token);

    expect($decoded)->toBeNull();
});

test('returns null for token with wrong secret', function () {
    // Create token with different secret
    $payload = [
        'iat' => time(),
        'exp' => time() + 3600,
        'user_id' => 'test-id',
    ];

    $token = JWT::encode($payload, 'wrong-secret', 'HS256');

    $decoded = $this->jwtService->validateToken($token);

    expect($decoded)->toBeNull();
});

test('can extract token from Bearer header', function () {
    $token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.abc';
    $authHeader = "Bearer {$token}";

    $extracted = $this->jwtService->getTokenFromHeader($authHeader);

    expect($extracted)->toBe($token);
});

test('returns null for malformed Bearer header', function () {
    $authHeader = 'Basic token123';

    $extracted = $this->jwtService->getTokenFromHeader($authHeader);

    expect($extracted)->toBeNull();
});

test('returns null for missing Bearer prefix', function () {
    $authHeader = 'token123';

    $extracted = $this->jwtService->getTokenFromHeader($authHeader);

    expect($extracted)->toBeNull();
});

test('token expiration time is approximately 1 hour', function () {
    $user = Mockery::mock(User::class);
    $user->id = 'test-id';
    $user->email = 'test@example.com';
    $user->name = 'Test';

    $roles = Mockery::mock();
    $roles->shouldReceive('pluck')->with('name')->andReturn(collect([]));
    $user->roles = $roles;

    $beforeGeneration = time();
    $token = $this->jwtService->generateToken($user);
    $afterGeneration = time();

    $decoded = JWT::decode($token, new Key($_ENV['JWT_SECRET'], 'HS256'));

    $expectedExpiration = $beforeGeneration + 3600;
    $allowedDiff = 2; // 2 seconds tolerance

    expect($decoded->exp)->toBeGreaterThanOrEqual($expectedExpiration - $allowedDiff)
        ->and($decoded->exp)->toBeLessThanOrEqual($expectedExpiration + $allowedDiff);
});

afterEach(function () {
    Mockery::close();
});
