<?php

declare(strict_types=1);

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\Factory\AppFactory;

require __DIR__ . '/../vendor/autoload.php';

use AssurKit\Database\Connection;

// Load environment variables
$dotenv = Dotenv\Dotenv::createImmutable(dirname(__DIR__));
if (file_exists(dirname(__DIR__) . '/.env')) {
    $dotenv->load();
}

// Initialize database connection
Connection::getInstance();

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

$app->run();
