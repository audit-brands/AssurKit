<?php

declare(strict_types=1);

namespace AssurKit\Middleware;

use AssurKit\Services\JwtService;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface;

class AuthMiddleware implements MiddlewareInterface
{
    private JwtService $jwtService;

    public function __construct(JwtService $jwtService)
    {
        $this->jwtService = $jwtService;
    }

    public function process(
        ServerRequestInterface $request,
        RequestHandlerInterface $handler
    ): ResponseInterface {
        $authHeader = $request->getHeaderLine('Authorization');

        if (!$authHeader) {
            return $this->unauthorizedResponse();
        }

        $token = $this->jwtService->getTokenFromHeader($authHeader);

        if (!$token) {
            return $this->unauthorizedResponse();
        }

        $user = $this->jwtService->getUserFromToken($token);

        if (!$user) {
            return $this->unauthorizedResponse();
        }

        // Add user to request attributes
        $request = $request->withAttribute('user', $user);
        $request = $request->withAttribute('token_payload', $this->jwtService->validateToken($token));

        return $handler->handle($request);
    }

    private function unauthorizedResponse(): ResponseInterface
    {
        $response = new \Slim\Psr7\Response();
        $response->getBody()->write(json_encode([
            'error' => 'Unauthorized',
            'message' => 'Valid authentication token required',
        ]));

        return $response
            ->withStatus(401)
            ->withHeader('Content-Type', 'application/json');
    }
}
