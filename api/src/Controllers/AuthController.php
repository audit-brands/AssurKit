<?php

declare(strict_types=1);

namespace AssurKit\Controllers;

use AssurKit\Models\User;
use AssurKit\Services\JwtService;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Respect\Validation\Validator as v;

class AuthController
{
    private JwtService $jwtService;

    public function __construct(JwtService $jwtService)
    {
        $this->jwtService = $jwtService;
    }

    public function login(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $data = $request->getParsedBody();

        // Validate input
        $validation = $this->validateLoginData($data);
        if (!$validation['valid']) {
            return $this->errorResponse($response, $validation['errors'], 400);
        }

        // Find user
        $user = User::where('email', $data['email'])->first();

        if (!$user || !$user->verifyPassword($data['password'])) {
            return $this->errorResponse($response, ['Invalid email or password'], 401);
        }

        // Generate token
        $token = $this->jwtService->generateToken($user);

        $responseData = [
            'message' => 'Login successful',
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'email' => $user->email,
                'name' => $user->name,
                'roles' => $user->roles->pluck('name')->toArray(),
            ],
        ];

        return $this->jsonResponse($response, $responseData);
    }

    public function register(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $data = $request->getParsedBody();

        // Validate input
        $validation = $this->validateRegistrationData($data);
        if (!$validation['valid']) {
            return $this->errorResponse($response, $validation['errors'], 400);
        }

        // Check if user already exists
        if (User::where('email', $data['email'])->exists()) {
            return $this->errorResponse($response, ['Email already exists'], 409);
        }

        // Create user
        $user = User::createUser($data['email'], $data['name'], $data['password']);

        // Assign default role
        $user->assignRole('Viewer');

        // Generate token
        $token = $this->jwtService->generateToken($user);

        $responseData = [
            'message' => 'Registration successful',
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'email' => $user->email,
                'name' => $user->name,
                'roles' => $user->roles->pluck('name')->toArray(),
            ],
        ];

        return $this->jsonResponse($response, $responseData, 201);
    }

    public function me(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $user = $request->getAttribute('user');

        $responseData = [
            'user' => [
                'id' => $user->id,
                'email' => $user->email,
                'name' => $user->name,
                'roles' => $user->roles->pluck('name')->toArray(),
            ],
        ];

        return $this->jsonResponse($response, $responseData);
    }

    public function refresh(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $authHeader = $request->getHeaderLine('Authorization');
        $token = $this->jwtService->getTokenFromHeader($authHeader);

        if (!$token) {
            return $this->errorResponse($response, ['No token provided'], 400);
        }

        $newToken = $this->jwtService->refreshToken($token);

        if (!$newToken) {
            return $this->errorResponse($response, ['Invalid token'], 401);
        }

        $responseData = [
            'message' => 'Token refreshed successfully',
            'token' => $newToken,
        ];

        return $this->jsonResponse($response, $responseData);
    }

    private function validateLoginData(?array $data): array
    {
        if (!$data) {
            return ['valid' => false, 'errors' => ['No data provided']];
        }

        $errors = [];

        if (!v::email()->validate($data['email'] ?? '')) {
            $errors[] = 'Valid email is required';
        }

        if (!v::stringType()->notEmpty()->validate($data['password'] ?? '')) {
            $errors[] = 'Password is required';
        }

        return ['valid' => empty($errors), 'errors' => $errors];
    }

    private function validateRegistrationData(?array $data): array
    {
        if (!$data) {
            return ['valid' => false, 'errors' => ['No data provided']];
        }

        $errors = [];

        if (!v::email()->validate($data['email'] ?? '')) {
            $errors[] = 'Valid email is required';
        }

        if (!v::stringType()->notEmpty()->length(2, 255)->validate($data['name'] ?? '')) {
            $errors[] = 'Name is required and must be between 2 and 255 characters';
        }

        if (!v::stringType()->length(8)->validate($data['password'] ?? '')) {
            $errors[] = 'Password must be at least 8 characters long';
        }

        return ['valid' => empty($errors), 'errors' => $errors];
    }

    private function jsonResponse(ResponseInterface $response, array $data, int $status = 200): ResponseInterface
    {
        $response->getBody()->write(json_encode($data));

        return $response
            ->withStatus($status)
            ->withHeader('Content-Type', 'application/json');
    }

    private function errorResponse(ResponseInterface $response, array $errors, int $status = 400): ResponseInterface
    {
        $data = [
            'error' => true,
            'message' => 'Validation failed',
            'errors' => $errors,
        ];

        return $this->jsonResponse($response, $data, $status);
    }
}
