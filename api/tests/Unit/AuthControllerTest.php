<?php

declare(strict_types=1);

use AssurKit\Controllers\AuthController;
use AssurKit\Models\Role;
use AssurKit\Models\User;
use AssurKit\Services\JwtService;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Message\StreamInterface;

beforeEach(function () {
    // Set JWT secret for tests
    $_ENV['JWT_SECRET'] = 'test-secret-key-for-testing';

    $this->jwtService = new JwtService();
    $this->controller = new AuthController($this->jwtService);

    // Mock PSR-7 Request
    $this->request = Mockery::mock(ServerRequestInterface::class);

    // Mock PSR-7 Response
    $this->response = Mockery::mock(ResponseInterface::class);
    $this->stream = Mockery::mock(StreamInterface::class);

    // Setup default response chain
    $this->response->shouldReceive('getBody')
        ->andReturn($this->stream);

    $this->response->shouldReceive('withStatus')
        ->andReturnSelf();

    $this->response->shouldReceive('withHeader')
        ->andReturnSelf();

    // Ensure default roles exist
    ensureRoleExists('Viewer');
    ensureRoleExists('Admin');
});

describe('AuthController::login', function () {
    test('logs in user with valid credentials', function () {
        // Create test user
        $user = User::createUser('test@example.com', 'Test User', 'password123');
        $user->assignRole('Viewer');

        $loginData = [
            'email' => 'test@example.com',
            'password' => 'password123',
        ];

        $this->request->shouldReceive('getParsedBody')
            ->andReturn($loginData);

        $this->stream->shouldReceive('write')
            ->once()
            ->with(Mockery::on(function ($json) {
                $data = json_decode($json, true);

                return $data['message'] === 'Login successful'
                    && isset($data['token'])
                    && isset($data['user'])
                    && $data['user']['email'] === 'test@example.com';
            }));

        $response = $this->controller->login($this->request, $this->response);

        expect($response)->toBeInstanceOf(ResponseInterface::class);
    });

    test('returns 401 for invalid password', function () {
        $user = User::createUser('test@example.com', 'Test User', 'password123');

        $loginData = [
            'email' => 'test@example.com',
            'password' => 'wrongpassword',
        ];

        $this->request->shouldReceive('getParsedBody')
            ->andReturn($loginData);

        $this->stream->shouldReceive('write')
            ->once()
            ->with(Mockery::on(function ($json) {
                $data = json_decode($json, true);

                return $data['error'] === true
                    && in_array('Invalid email or password', $data['errors'], true);
            }));

        $response = $this->controller->login($this->request, $this->response);

        expect($response)->toBeInstanceOf(ResponseInterface::class);
    });

    test('returns 401 for non-existent user', function () {
        $loginData = [
            'email' => 'nonexistent@example.com',
            'password' => 'password123',
        ];

        $this->request->shouldReceive('getParsedBody')
            ->andReturn($loginData);

        $this->stream->shouldReceive('write')
            ->once()
            ->with(Mockery::on(function ($json) {
                $data = json_decode($json, true);

                return $data['error'] === true
                    && in_array('Invalid email or password', $data['errors'], true);
            }));

        $response = $this->controller->login($this->request, $this->response);

        expect($response)->toBeInstanceOf(ResponseInterface::class);
    });

    test('rejects login with invalid email format', function () {
        $loginData = [
            'email' => 'not-an-email',
            'password' => 'password123',
        ];

        $this->request->shouldReceive('getParsedBody')
            ->andReturn($loginData);

        $this->stream->shouldReceive('write')
            ->once()
            ->with(Mockery::on(function ($json) {
                $data = json_decode($json, true);

                return $data['error'] === true
                    && count(array_filter($data['errors'], function ($error) {
                        return str_contains($error, 'email');
                    })) > 0;
            }));

        $response = $this->controller->login($this->request, $this->response);

        expect($response)->toBeInstanceOf(ResponseInterface::class);
    });

    test('rejects login with missing password', function () {
        $loginData = [
            'email' => 'test@example.com',
            // Missing password
        ];

        $this->request->shouldReceive('getParsedBody')
            ->andReturn($loginData);

        $this->stream->shouldReceive('write')
            ->once()
            ->with(Mockery::on(function ($json) {
                $data = json_decode($json, true);

                return $data['error'] === true
                    && count(array_filter($data['errors'], function ($error) {
                        return str_contains($error, 'Password');
                    })) > 0;
            }));

        $response = $this->controller->login($this->request, $this->response);

        expect($response)->toBeInstanceOf(ResponseInterface::class);
    });

    test('rejects login with empty credentials', function () {
        $loginData = [];

        $this->request->shouldReceive('getParsedBody')
            ->andReturn($loginData);

        $this->stream->shouldReceive('write')
            ->once()
            ->with(Mockery::on(function ($json) {
                $data = json_decode($json, true);

                return $data['error'] === true
                    && !empty($data['errors']);
            }));

        $response = $this->controller->login($this->request, $this->response);

        expect($response)->toBeInstanceOf(ResponseInterface::class);
    });

    test('returns JWT token that can be validated', function () {
        $user = User::createUser('test@example.com', 'Test User', 'password123');
        $user->assignRole('Admin');

        $loginData = [
            'email' => 'test@example.com',
            'password' => 'password123',
        ];

        $this->request->shouldReceive('getParsedBody')
            ->andReturn($loginData);

        $capturedToken = null;
        $this->stream->shouldReceive('write')
            ->once()
            ->with(Mockery::on(function ($json) use (&$capturedToken) {
                $data = json_decode($json, true);
                $capturedToken = $data['token'] ?? null;

                return isset($data['token']);
            }));

        $this->controller->login($this->request, $this->response);

        // Validate the token
        expect($capturedToken)->not->toBeNull();

        $decoded = $this->jwtService->validateToken($capturedToken);
        expect($decoded)->not->toBeNull()
            ->and($decoded->email)->toBe('test@example.com')
            ->and($decoded->user_id)->toBe($user->id)
            ->and($decoded->roles)->toContain('Admin');
    });
});

describe('AuthController::register', function () {
    test('registers new user with valid data', function () {
        $registrationData = [
            'email' => 'newuser@example.com',
            'name' => 'New User',
            'password' => 'password123',
        ];

        $this->request->shouldReceive('getParsedBody')
            ->andReturn($registrationData);

        $this->stream->shouldReceive('write')
            ->once()
            ->with(Mockery::on(function ($json) {
                $data = json_decode($json, true);

                return $data['message'] === 'Registration successful'
                    && isset($data['token'])
                    && isset($data['user'])
                    && $data['user']['email'] === 'newuser@example.com';
            }));

        $response = $this->controller->register($this->request, $this->response);

        expect($response)->toBeInstanceOf(ResponseInterface::class);

        // Verify user was created
        $user = User::where('email', 'newuser@example.com')->first();
        expect($user)->not->toBeNull()
            ->and($user->name)->toBe('New User');
    });

    test('assigns default Viewer role to new user', function () {
        $registrationData = [
            'email' => 'viewer@example.com',
            'name' => 'Viewer User',
            'password' => 'password123',
        ];

        $this->request->shouldReceive('getParsedBody')
            ->andReturn($registrationData);

        $this->stream->shouldReceive('write')->once();

        $this->controller->register($this->request, $this->response);

        $user = User::where('email', 'viewer@example.com')->first();
        expect($user->hasRole('Viewer'))->toBeTrue();
    });

    test('returns 409 for duplicate email', function () {
        // Create existing user
        User::createUser('existing@example.com', 'Existing User', 'password123');

        $registrationData = [
            'email' => 'existing@example.com',
            'name' => 'Another User',
            'password' => 'password123',
        ];

        $this->request->shouldReceive('getParsedBody')
            ->andReturn($registrationData);

        $this->stream->shouldReceive('write')
            ->once()
            ->with(Mockery::on(function ($json) {
                $data = json_decode($json, true);

                return $data['error'] === true
                    && in_array('Email already exists', $data['errors'], true);
            }));

        $response = $this->controller->register($this->request, $this->response);

        expect($response)->toBeInstanceOf(ResponseInterface::class);
    });

    test('rejects registration with invalid email', function () {
        $registrationData = [
            'email' => 'not-an-email',
            'name' => 'Test User',
            'password' => 'password123',
        ];

        $this->request->shouldReceive('getParsedBody')
            ->andReturn($registrationData);

        $this->stream->shouldReceive('write')
            ->once()
            ->with(Mockery::on(function ($json) {
                $data = json_decode($json, true);

                return $data['error'] === true;
            }));

        $response = $this->controller->register($this->request, $this->response);

        expect($response)->toBeInstanceOf(ResponseInterface::class);
    });

    test('rejects registration with name too short', function () {
        $registrationData = [
            'email' => 'test@example.com',
            'name' => 'A', // Only 1 character, min is 2
            'password' => 'password123',
        ];

        $this->request->shouldReceive('getParsedBody')
            ->andReturn($registrationData);

        $this->stream->shouldReceive('write')
            ->once()
            ->with(Mockery::on(function ($json) {
                $data = json_decode($json, true);

                return $data['error'] === true;
            }));

        $response = $this->controller->register($this->request, $this->response);

        expect($response)->toBeInstanceOf(ResponseInterface::class);
    });

    test('rejects registration with password too short', function () {
        $registrationData = [
            'email' => 'test@example.com',
            'name' => 'Test User',
            'password' => 'short', // Less than 8 characters
        ];

        $this->request->shouldReceive('getParsedBody')
            ->andReturn($registrationData);

        $this->stream->shouldReceive('write')
            ->once()
            ->with(Mockery::on(function ($json) {
                $data = json_decode($json, true);

                return $data['error'] === true
                    && count(array_filter($data['errors'], function ($error) {
                        return str_contains($error, 'Password');
                    })) > 0;
            }));

        $response = $this->controller->register($this->request, $this->response);

        expect($response)->toBeInstanceOf(ResponseInterface::class);
    });

    test('hashes password securely', function () {
        $registrationData = [
            'email' => 'secure@example.com',
            'name' => 'Secure User',
            'password' => 'password123',
        ];

        $this->request->shouldReceive('getParsedBody')
            ->andReturn($registrationData);

        $this->stream->shouldReceive('write')->once();

        $this->controller->register($this->request, $this->response);

        $user = User::where('email', 'secure@example.com')->first();

        // Password should be hashed, not stored in plain text
        expect($user->password_hash)->not->toBe('password123')
            ->and(password_verify('password123', $user->password_hash))->toBeTrue();
    });
});

describe('AuthController::me', function () {
    test('returns current user information', function () {
        $user = User::createUser('me@example.com', 'Me User', 'password123');
        $user->assignRole('Admin');

        $this->request->shouldReceive('getAttribute')
            ->with('user')
            ->andReturn($user);

        $this->stream->shouldReceive('write')
            ->once()
            ->with(Mockery::on(function ($json) use ($user) {
                $data = json_decode($json, true);

                return isset($data['user'])
                    && $data['user']['id'] === $user->id
                    && $data['user']['email'] === 'me@example.com'
                    && $data['user']['name'] === 'Me User'
                    && in_array('Admin', $data['user']['roles'], true);
            }));

        $response = $this->controller->me($this->request, $this->response);

        expect($response)->toBeInstanceOf(ResponseInterface::class);
    });

    test('includes all user roles', function () {
        $user = User::createUser('multirole@example.com', 'Multi Role User', 'password123');
        $user->assignRole('Admin');
        $user->assignRole('Viewer');

        // Need to refresh to load roles
        $user = User::where('email', 'multirole@example.com')->first();

        $this->request->shouldReceive('getAttribute')
            ->with('user')
            ->andReturn($user);

        $this->stream->shouldReceive('write')
            ->once()
            ->with(Mockery::on(function ($json) {
                $data = json_decode($json, true);

                return isset($data['user']['roles'])
                    && count($data['user']['roles']) === 2
                    && in_array('Admin', $data['user']['roles'], true)
                    && in_array('Viewer', $data['user']['roles'], true);
            }));

        $response = $this->controller->me($this->request, $this->response);

        expect($response)->toBeInstanceOf(ResponseInterface::class);
    });
});

describe('AuthController::refresh', function () {
    test('refreshes valid token', function () {
        $user = User::createUser('refresh@example.com', 'Refresh User', 'password123');
        $user->assignRole('Viewer');

        // Generate original token
        $originalToken = $this->jwtService->generateToken($user);

        // Sleep to ensure new token has different timestamp
        sleep(1);

        $this->request->shouldReceive('getHeaderLine')
            ->with('Authorization')
            ->andReturn("Bearer $originalToken");

        $this->stream->shouldReceive('write')
            ->once()
            ->with(Mockery::on(function ($json) use ($originalToken) {
                $data = json_decode($json, true);

                return $data['message'] === 'Token refreshed successfully'
                    && isset($data['token'])
                    && $data['token'] !== $originalToken; // Should be a new token
            }));

        $response = $this->controller->refresh($this->request, $this->response);

        expect($response)->toBeInstanceOf(ResponseInterface::class);
    });

    test('rejects refresh without token', function () {
        $this->request->shouldReceive('getHeaderLine')
            ->with('Authorization')
            ->andReturn('');

        $this->stream->shouldReceive('write')
            ->once()
            ->with(Mockery::on(function ($json) {
                $data = json_decode($json, true);

                return $data['error'] === true
                    && in_array('No token provided', $data['errors'], true);
            }));

        $response = $this->controller->refresh($this->request, $this->response);

        expect($response)->toBeInstanceOf(ResponseInterface::class);
    });

    test('rejects refresh with invalid token', function () {
        $this->request->shouldReceive('getHeaderLine')
            ->with('Authorization')
            ->andReturn('Bearer invalid.token.here');

        $this->stream->shouldReceive('write')
            ->once()
            ->with(Mockery::on(function ($json) {
                $data = json_decode($json, true);

                return $data['error'] === true
                    && in_array('Invalid token', $data['errors'], true);
            }));

        $response = $this->controller->refresh($this->request, $this->response);

        expect($response)->toBeInstanceOf(ResponseInterface::class);
    });

    test('rejects refresh without Bearer prefix', function () {
        $user = User::createUser('nobearer@example.com', 'No Bearer User', 'password123');
        $token = $this->jwtService->generateToken($user);

        $this->request->shouldReceive('getHeaderLine')
            ->with('Authorization')
            ->andReturn($token); // Missing "Bearer " prefix

        $this->stream->shouldReceive('write')
            ->once()
            ->with(Mockery::on(function ($json) {
                $data = json_decode($json, true);

                return $data['error'] === true;
            }));

        $response = $this->controller->refresh($this->request, $this->response);

        expect($response)->toBeInstanceOf(ResponseInterface::class);
    });
});

/*
 * Helper function to ensure a role exists.
 */
if (!function_exists('ensureRoleExists')) {
    function ensureRoleExists(string $roleName): void
    {
        if (!Role::where('name', $roleName)->exists()) {
            Role::create(['name' => $roleName]);
        }
    }
}

afterEach(function () {
    Mockery::close();
});
