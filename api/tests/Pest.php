<?php

declare(strict_types=1);

use AssurKit\Tests\TestCase;
use Illuminate\Database\Capsule\Manager as Capsule;

/*
|--------------------------------------------------------------------------
| Test Case
|--------------------------------------------------------------------------
|
| The closure you provide to your test functions is always bound to a specific PHPUnit test
| case class. By default, that class is "PHPUnit\Framework\TestCase". Of course, you may
| need to change it using the "uses()" function to bind a different classes or traits.
|
*/

uses(TestCase::class)->in('Feature', 'Unit');

/*
|--------------------------------------------------------------------------
| Expectations
|--------------------------------------------------------------------------
|
| When you're writing tests, you often need to check that values meet certain conditions. The
| "expect()" function gives you access to a set of "expectations" methods that you can use
| to assert different things. Of course, you may extend the Expectation API at any time.
|
*/

expect()->extend('toBeOne', function () {
    return $this->toBe(1);
});

/*
|--------------------------------------------------------------------------
| Functions
|--------------------------------------------------------------------------
|
| While Pest is very powerful out-of-the-box, you may have some testing code specific to your
| project that you don't want to repeat in every file. Here you can also expose helpers as
| global functions to help you to reduce the number of lines of code in your test files.
|
*/

/**
 * Create a test database connection.
 */
function setupTestDatabase(): Capsule
{
    $capsule = new Capsule();

    $capsule->addConnection([
        'driver' => 'pgsql',
        'host' => getenv('DB_HOST') ?: ($_ENV['DB_HOST'] ?? 'localhost'),
        'port' => (int) (getenv('DB_PORT') ?: ($_ENV['DB_PORT'] ?? 5432)),
        'database' => getenv('DB_DATABASE') ?: ($_ENV['DB_DATABASE'] ?? 'assurkit_test'),
        'username' => getenv('DB_USERNAME') ?: ($_ENV['DB_USERNAME'] ?? 'assurkit'),
        'password' => getenv('DB_PASSWORD') ?: ($_ENV['DB_PASSWORD'] ?? 'assurkit_test'),
        'charset' => 'utf8',
        'collation' => 'utf8_unicode_ci',
        'prefix' => '',
    ]);

    $capsule->setAsGlobal();
    $capsule->bootEloquent();

    return $capsule;
}

/**
 * Begin a database transaction.
 */
function beginDatabaseTransaction(): void
{
    Capsule::connection()->beginTransaction();
}

/**
 * Rollback database transaction.
 */
function rollbackDatabaseTransaction(): void
{
    Capsule::connection()->rollBack();
}

/**
 * Create a mock user for testing.
 */
function createTestUser(array $overrides = []): array
{
    return array_merge([
        'id' => \Ramsey\Uuid\Uuid::uuid4()->toString(),
        'email' => 'test@example.com',
        'name' => 'Test User',
        'role' => 'Tester',
        'created_at' => date('Y-m-d H:i:s'),
        'updated_at' => date('Y-m-d H:i:s'),
    ], $overrides);
}

/**
 * Create a mock control for testing.
 */
function createTestControl(array $overrides = []): array
{
    return array_merge([
        'id' => \Ramsey\Uuid\Uuid::uuid4()->toString(),
        'control_id' => 'CTL-' . rand(100, 999),
        'name' => 'Test Control',
        'description' => 'Test control description',
        'control_type' => 'Preventive',
        'frequency' => 'Monthly',
        'automation_level' => 'Manual',
        'is_key_control' => true,
        'owner_email' => 'owner@example.com',
        'status' => 'Active',
        'created_at' => date('Y-m-d H:i:s'),
        'updated_at' => date('Y-m-d H:i:s'),
    ], $overrides);
}
