<?php

declare(strict_types=1);

namespace AssurKit\Services;

use AssurKit\Models\User;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

class JwtService
{
    private string $secret;
    private string $algorithm = 'HS256';
    private int $expiresIn = 3600; // 1 hour

    public function __construct()
    {
        $this->secret = $_ENV['JWT_SECRET'] ?? 'your-secret-key-here';
    }

    public function generateToken(User $user): string
    {
        $issuedAt = time();
        $expire = $issuedAt + $this->expiresIn;

        $payload = [
            'iat' => $issuedAt,
            'exp' => $expire,
            'user_id' => $user->id,
            'email' => $user->email,
            'name' => $user->name,
            'roles' => $user->roles->pluck('name')->toArray(),
        ];

        return JWT::encode($payload, $this->secret, $this->algorithm);
    }

    public function validateToken(string $token): ?object
    {
        try {
            return JWT::decode($token, new Key($this->secret, $this->algorithm));
        } catch (\Exception $e) {
            return null;
        }
    }

    public function getUserFromToken(string $token): ?User
    {
        $decoded = $this->validateToken($token);

        if (!$decoded) {
            return null;
        }

        return User::find($decoded->user_id);
    }

    public function getTokenFromHeader(string $authHeader): ?string
    {
        if (strpos($authHeader, 'Bearer ') !== 0) {
            return null;
        }

        return substr($authHeader, 7);
    }

    public function refreshToken(string $token): ?string
    {
        $user = $this->getUserFromToken($token);

        if (!$user) {
            return null;
        }

        return $this->generateToken($user);
    }
}
