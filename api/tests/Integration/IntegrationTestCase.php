<?php

declare(strict_types=1);

namespace AssurKit\Tests\Integration;

use AssurKit\Models\Role;
use AssurKit\Models\User;
use AssurKit\Services\JwtService;
use AssurKit\Tests\TestCase;
use Psr\Http\Message\ResponseInterface;
use Slim\App;
use Slim\Psr7\Factory\ServerRequestFactory;

/**
 * Base class for integration tests.
 *
 * Provides HTTP client capabilities for testing full request/response cycles.
 */
abstract class IntegrationTestCase extends TestCase
{
    protected App $app;
    protected JwtService $jwtService;

    /**
     * Set up the test case.
     */
    protected function setUp(): void
    {
        parent::setUp();

        $_ENV['JWT_SECRET'] = 'test-secret-key-for-integration-tests';
        $this->jwtService = new JwtService();

        // Initialize Slim app with routes
        $this->app = require __DIR__ . '/../bootstrap-app.php';

        // Ensure default roles exist
        $this->ensureRoleExists('Admin');
        $this->ensureRoleExists('Manager');
        $this->ensureRoleExists('Tester');
        $this->ensureRoleExists('Viewer');
    }

    /**
     * Make an HTTP request to the application.
     */
    protected function makeRequest(
        string $method,
        string $uri,
        array $headers = [],
        ?array $body = null,
        ?array $queryParams = null
    ): ResponseInterface {
        $factory = new ServerRequestFactory();

        // Build query string
        if ($queryParams) {
            $query = http_build_query($queryParams);
            $uri .= (strpos($uri, '?') === false ? '?' : '&') . $query;
        }

        $request = $factory->createServerRequest($method, $uri);

        // Add headers
        foreach ($headers as $name => $value) {
            $request = $request->withHeader($name, $value);
        }

        // Add body for POST/PUT/PATCH/DELETE
        if ($body !== null && in_array($method, ['POST', 'PUT', 'PATCH', 'DELETE'], true)) {
            $json = json_encode($body);
            $request->getBody()->write($json);
            $request = $request->withHeader('Content-Type', 'application/json');
        }

        return $this->app->handle($request);
    }

    /**
     * Make a GET request.
     */
    protected function get(string $uri, array $headers = [], ?array $queryParams = null): ResponseInterface
    {
        return $this->makeRequest('GET', $uri, $headers, null, $queryParams);
    }

    /**
     * Make a POST request.
     */
    protected function post(string $uri, array $body, array $headers = []): ResponseInterface
    {
        return $this->makeRequest('POST', $uri, $headers, $body);
    }

    /**
     * Make a PUT request.
     */
    protected function put(string $uri, array $body, array $headers = []): ResponseInterface
    {
        return $this->makeRequest('PUT', $uri, $headers, $body);
    }

    /**
     * Make a DELETE request.
     */
    protected function delete(string $uri, array $headers = [], ?array $body = null): ResponseInterface
    {
        return $this->makeRequest('DELETE', $uri, $headers, $body);
    }

    /**
     * Create a user and return JWT token.
     */
    protected function createUserWithToken(string $email, string $name, string $password, string $role = 'Viewer'): string
    {
        $user = User::createUser($email, $name, $password);
        $user->assignRole($role);

        // Refresh to load roles
        $user = User::where('email', $email)->first();

        return $this->jwtService->generateToken($user);
    }

    /**
     * Get authorization header with Bearer token.
     */
    protected function authHeader(string $token): array
    {
        return ['Authorization' => "Bearer {$token}"];
    }

    /**
     * Parse JSON response body.
     */
    protected function parseJsonResponse(ResponseInterface $response): array
    {
        return json_decode((string) $response->getBody(), true);
    }

    /**
     * Ensure a role exists.
     */
    protected function ensureRoleExists(string $roleName): void
    {
        if (!Role::where('name', $roleName)->exists()) {
            Role::create(['name' => $roleName]);
        }
    }
}
