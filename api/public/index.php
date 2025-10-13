<?php

declare(strict_types=1);

require __DIR__ . '/../vendor/autoload.php';

use AssurKit\Controllers\AuthController;
use AssurKit\Database\Connection;
use AssurKit\Middleware\AuthMiddleware;
use AssurKit\Middleware\RoleMiddleware;
use AssurKit\Services\JwtService;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\Factory\AppFactory;

// Load environment variables
$dotenv = Dotenv\Dotenv::createImmutable(dirname(__DIR__));
if (file_exists(dirname(__DIR__) . '/.env')) {
    $dotenv->load();
}

// Initialize database connection
Connection::getInstance();

// Initialize services
$jwtService = new JwtService();
$authController = new AuthController($jwtService);
$authMiddleware = new AuthMiddleware($jwtService);

// Create app
$app = AppFactory::create();

// Add error middleware
$app->addErrorMiddleware(true, true, true);

// Add body parsing middleware
$app->addBodyParsingMiddleware();

// CORS middleware
$app->add(function (Request $request, \Psr\Http\Message\ResponseInterface $response, $next) {
    $response = $next($request, $response);

    return $response
        ->withHeader('Access-Control-Allow-Origin', '*')
        ->withHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept, Origin, Authorization')
        ->withHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
});

// Routes
$app->get('/', function (Request $request, Response $response) {
    $response->getBody()->write(json_encode([
        'name' => 'AssurKit API',
        'version' => '0.1.0',
        'status' => 'healthy',
    ]));

    return $response->withHeader('Content-Type', 'application/json');
});

$app->get('/health', function (Request $request, Response $response) {
    $response->getBody()->write(json_encode([
        'status' => 'healthy',
        'timestamp' => date('Y-m-d H:i:s'),
    ]));

    return $response->withHeader('Content-Type', 'application/json');
});

// Authentication routes (public)
$app->post('/auth/login', [$authController, 'login']);
$app->post('/auth/register', [$authController, 'register']);
$app->post('/auth/refresh', [$authController, 'refresh']);

// Protected routes group
$app->group('/api', function ($group) use ($authController) {
    // User profile
    $group->get('/me', [$authController, 'me']);

    // Admin-only routes
    $group->group('/admin', function ($adminGroup) {
        $adminGroup->get('/users', function (Request $request, Response $response) {
            $response->getBody()->write(json_encode([
                'message' => 'Admin users endpoint',
                'user' => $request->getAttribute('user')->email,
            ]));

            return $response->withHeader('Content-Type', 'application/json');
        });
    })->add(new RoleMiddleware(['Admin']));

})->add($authMiddleware);

$app->run();
