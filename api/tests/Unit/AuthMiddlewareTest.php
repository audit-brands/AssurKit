<?php

declare(strict_types=1);

use AssurKit\Middleware\AuthMiddleware;
use AssurKit\Models\Role;
use AssurKit\Models\User;
use AssurKit\Services\JwtService;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

beforeEach(function () {
    $_ENV['JWT_SECRET'] = 'test-secret-key-for-testing';
    $this->jwtService = new JwtService();
    $this->middleware = new AuthMiddleware($this->jwtService);

    // Ensure Admin role exists for tests
    if (!Role::where('name', 'Admin')->exists()) {
        Role::create(['name' => 'Admin']);
    }

    // Mock request
    $this->request = Mockery::mock(ServerRequestInterface::class);

    // Mock handler
    $this->handler = Mockery::mock(RequestHandlerInterface::class);
});

describe('AuthMiddleware::process', function () {
    test('allows request with valid JWT token', function () {
        // Create user and generate token
        $user = User::createUser('test@example.com', 'Test User', 'password123');
        $token = $this->jwtService->generateToken($user);

        $this->request->shouldReceive('getHeaderLine')
            ->with('Authorization')
            ->andReturn("Bearer {$token}");

        // Mock withAttribute to capture the user being attached
        $modifiedRequest = Mockery::mock(ServerRequestInterface::class);
        $this->request->shouldReceive('withAttribute')
            ->with('user', Mockery::type(User::class))
            ->andReturn($modifiedRequest);

        $modifiedRequest->shouldReceive('withAttribute')
            ->with('token_payload', Mockery::any())
            ->andReturnSelf();

        // Mock response
        $response = Mockery::mock(ResponseInterface::class);
        $this->handler->shouldReceive('handle')
            ->with($modifiedRequest)
            ->andReturn($response);

        $result = $this->middleware->process($this->request, $this->handler);

        expect($result)->toBe($response);
    });

    test('returns 401 when Authorization header is missing', function () {
        $this->request->shouldReceive('getHeaderLine')
            ->with('Authorization')
            ->andReturn('');

        $response = $this->middleware->process($this->request, $this->handler);

        expect($response->getStatusCode())->toBe(401);

        $body = (string) $response->getBody();
        $data = json_decode($body, true);

        expect($data)->toHaveKey('error')
            ->and($data['error'])->toBe('Unauthorized')
            ->and($data['message'])->toContain('authentication token required');
    });

    test('returns 401 when Bearer prefix is missing', function () {
        $user = User::createUser('test@example.com', 'Test User', 'password123');
        $token = $this->jwtService->generateToken($user);

        // Missing "Bearer " prefix
        $this->request->shouldReceive('getHeaderLine')
            ->with('Authorization')
            ->andReturn($token);

        $response = $this->middleware->process($this->request, $this->handler);

        expect($response->getStatusCode())->toBe(401);
    });

    test('returns 401 for invalid JWT token', function () {
        $this->request->shouldReceive('getHeaderLine')
            ->with('Authorization')
            ->andReturn('Bearer invalid.jwt.token');

        $response = $this->middleware->process($this->request, $this->handler);

        expect($response->getStatusCode())->toBe(401);

        $body = (string) $response->getBody();
        $data = json_decode($body, true);

        expect($data)->toHaveKey('error')
            ->and($data['error'])->toBe('Unauthorized');
    });

    test('returns 401 for expired JWT token', function () {
        // Create an expired token manually
        $issuedAt = time() - 7200; // 2 hours ago
        $expire = $issuedAt + 3600; // Expired 1 hour ago

        $payload = [
            'iat' => $issuedAt,
            'exp' => $expire,
            'user_id' => 'test-id',
            'email' => 'test@example.com',
        ];

        $expiredToken = \Firebase\JWT\JWT::encode($payload, $_ENV['JWT_SECRET'], 'HS256');

        $this->request->shouldReceive('getHeaderLine')
            ->with('Authorization')
            ->andReturn("Bearer {$expiredToken}");

        $response = $this->middleware->process($this->request, $this->handler);

        expect($response->getStatusCode())->toBe(401);
    });

    test('returns 401 for token with wrong secret', function () {
        // Create token with different secret
        $payload = [
            'iat' => time(),
            'exp' => time() + 3600,
            'user_id' => 'test-id',
            'email' => 'test@example.com',
        ];

        $wrongToken = \Firebase\JWT\JWT::encode($payload, 'wrong-secret', 'HS256');

        $this->request->shouldReceive('getHeaderLine')
            ->with('Authorization')
            ->andReturn("Bearer {$wrongToken}");

        $response = $this->middleware->process($this->request, $this->handler);

        expect($response->getStatusCode())->toBe(401);
    });

    test('attaches user to request for downstream handlers', function () {
        $user = User::createUser('attached@example.com', 'Attached User', 'password123');
        $token = $this->jwtService->generateToken($user);

        $this->request->shouldReceive('getHeaderLine')
            ->with('Authorization')
            ->andReturn("Bearer {$token}");

        $capturedUser = null;
        $modifiedRequest = Mockery::mock(ServerRequestInterface::class);

        $this->request->shouldReceive('withAttribute')
            ->with('user', Mockery::on(function ($user) use (&$capturedUser) {
                $capturedUser = $user;

                return $user instanceof User;
            }))
            ->andReturn($modifiedRequest);

        $modifiedRequest->shouldReceive('withAttribute')
            ->with('token_payload', Mockery::any())
            ->andReturnSelf();

        $response = Mockery::mock(ResponseInterface::class);
        $this->handler->shouldReceive('handle')
            ->with($modifiedRequest)
            ->andReturn($response);

        $this->middleware->process($this->request, $this->handler);

        expect($capturedUser)->toBeInstanceOf(User::class)
            ->and($capturedUser->email)->toBe('attached@example.com');
    });

    test('attaches token payload to request', function () {
        $user = User::createUser('payload@example.com', 'Payload User', 'password123');
        $user->assignRole('Admin');

        // Query user from database (roles will be lazy-loaded by JwtService)
        $user = User::where('email', 'payload@example.com')->first();

        $token = $this->jwtService->generateToken($user);

        $this->request->shouldReceive('getHeaderLine')
            ->with('Authorization')
            ->andReturn("Bearer {$token}");

        $modifiedRequest = Mockery::mock(ServerRequestInterface::class);
        $this->request->shouldReceive('withAttribute')
            ->with('user', Mockery::any())
            ->andReturn($modifiedRequest);

        $capturedPayload = null;
        $modifiedRequest->shouldReceive('withAttribute')
            ->with('token_payload', Mockery::on(function ($payload) use (&$capturedPayload) {
                $capturedPayload = $payload;

                return true;
            }))
            ->andReturnSelf();

        $response = Mockery::mock(ResponseInterface::class);
        $this->handler->shouldReceive('handle')
            ->andReturn($response);

        $this->middleware->process($this->request, $this->handler);

        expect($capturedPayload)->not->toBeNull()
            ->and($capturedPayload->email)->toBe('payload@example.com')
            ->and($capturedPayload->roles)->toContain('Admin');
    });

    test('returns JSON response with correct content-type', function () {
        $this->request->shouldReceive('getHeaderLine')
            ->with('Authorization')
            ->andReturn('');

        $response = $this->middleware->process($this->request, $this->handler);

        expect($response->getHeaderLine('Content-Type'))->toBe('application/json');
    });
});

afterEach(function () {
    Mockery::close();
});
