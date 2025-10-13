<?php

declare(strict_types=1);

namespace AssurKit\Middleware;

use AssurKit\Models\User;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface;

class RoleMiddleware implements MiddlewareInterface
{
    private array $requiredRoles;

    public function __construct(array $requiredRoles)
    {
        $this->requiredRoles = $requiredRoles;
    }

    public function process(
        ServerRequestInterface $request,
        RequestHandlerInterface $handler
    ): ResponseInterface {
        $user = $request->getAttribute('user');

        if (!$user instanceof User) {
            return $this->forbiddenResponse('User not authenticated');
        }

        $userRoles = $user->roles->pluck('name')->toArray();

        $hasRequiredRole = !empty(array_intersect($this->requiredRoles, $userRoles));

        if (!$hasRequiredRole) {
            return $this->forbiddenResponse(
                'Insufficient permissions. Required roles: ' . implode(', ', $this->requiredRoles)
            );
        }

        return $handler->handle($request);
    }

    private function forbiddenResponse(string $message): ResponseInterface
    {
        $response = new \Slim\Psr7\Response();
        $response->getBody()->write(json_encode([
            'error' => 'Forbidden',
            'message' => $message,
        ]));

        return $response
            ->withStatus(403)
            ->withHeader('Content-Type', 'application/json');
    }
}
