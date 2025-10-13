<?php

declare(strict_types=1);

require __DIR__ . '/../vendor/autoload.php';

use AssurKit\Controllers\AuthController;
use AssurKit\Controllers\CompanyController;
use AssurKit\Controllers\ControlController;
use AssurKit\Controllers\ProcessController;
use AssurKit\Controllers\RiskController;
use AssurKit\Controllers\RiskControlMatrixController;
use AssurKit\Controllers\SubprocessController;
use AssurKit\Controllers\UserController;
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
$userController = new UserController();
$companyController = new CompanyController();
$processController = new ProcessController();
$subprocessController = new SubprocessController();
$riskController = new RiskController();
$controlController = new ControlController();
$riskControlMatrixController = new RiskControlMatrixController();
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
$app->group('/api', function ($group) use ($authController, $userController, $companyController, $processController, $subprocessController, $riskController, $controlController, $riskControlMatrixController) {
    // User profile
    $group->get('/me', [$authController, 'me']);

    // Companies - accessible by all authenticated users
    $group->get('/companies', [$companyController, 'index']);
    $group->get('/companies/{id}', [$companyController, 'show']);

    // Processes - accessible by all authenticated users
    $group->get('/processes', [$processController, 'index']);
    $group->get('/processes/{id}', [$processController, 'show']);

    // Subprocesses - accessible by all authenticated users
    $group->get('/subprocesses', [$subprocessController, 'index']);
    $group->get('/subprocesses/{id}', [$subprocessController, 'show']);

    // Risks - accessible by all authenticated users
    $group->get('/risks', [$riskController, 'index']);
    $group->get('/risks/{id}', [$riskController, 'show']);

    // Controls - accessible by all authenticated users
    $group->get('/controls', [$controlController, 'index']);
    $group->get('/controls/{id}', [$controlController, 'show']);

    // Risk-Control Matrix - accessible by all authenticated users
    $group->get('/risk-control-matrix', [$riskControlMatrixController, 'index']);
    $group->get('/risk-control-matrix/effectiveness-report', [$riskControlMatrixController, 'getEffectivenessReport']);

    // Manager+ routes
    $group->group('/manage', function ($manageGroup) use ($companyController, $processController, $subprocessController, $riskController, $controlController, $riskControlMatrixController) {
        // Company management
        $manageGroup->post('/companies', [$companyController, 'create']);
        $manageGroup->put('/companies/{id}', [$companyController, 'update']);
        $manageGroup->delete('/companies/{id}', [$companyController, 'delete']);

        // Process management
        $manageGroup->post('/processes', [$processController, 'create']);
        $manageGroup->put('/processes/{id}', [$processController, 'update']);
        $manageGroup->delete('/processes/{id}', [$processController, 'delete']);

        // Subprocess management
        $manageGroup->post('/subprocesses', [$subprocessController, 'create']);
        $manageGroup->put('/subprocesses/{id}', [$subprocessController, 'update']);
        $manageGroup->delete('/subprocesses/{id}', [$subprocessController, 'delete']);

        // Risk management
        $manageGroup->post('/risks', [$riskController, 'create']);
        $manageGroup->put('/risks/{id}', [$riskController, 'update']);
        $manageGroup->delete('/risks/{id}', [$riskController, 'delete']);

        // Control management
        $manageGroup->post('/controls', [$controlController, 'create']);
        $manageGroup->put('/controls/{id}', [$controlController, 'update']);
        $manageGroup->delete('/controls/{id}', [$controlController, 'delete']);

        // Risk-Control Matrix management
        $manageGroup->post('/risk-control-matrix/assign', [$riskControlMatrixController, 'assignControl']);
        $manageGroup->put('/risk-control-matrix/update', [$riskControlMatrixController, 'updateAssignment']);
        $manageGroup->delete('/risk-control-matrix/remove', [$riskControlMatrixController, 'removeAssignment']);
    })->add(new RoleMiddleware(['Manager', 'Admin']));

    // Admin-only routes
    $group->group('/admin', function ($adminGroup) use ($userController) {
        // User management
        $adminGroup->get('/users', [$userController, 'index']);
        $adminGroup->get('/users/{id}', [$userController, 'show']);
        $adminGroup->post('/users', [$userController, 'create']);
        $adminGroup->put('/users/{id}', [$userController, 'update']);
        $adminGroup->delete('/users/{id}', [$userController, 'delete']);
    })->add(new RoleMiddleware(['Admin']));
})->add($authMiddleware);

$app->run();
