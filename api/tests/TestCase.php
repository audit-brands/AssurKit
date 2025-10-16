<?php

declare(strict_types=1);

namespace AssurKit\Tests;

use Illuminate\Database\Capsule\Manager as Capsule;
use PHPUnit\Framework\TestCase as BaseTestCase;

/**
 * Base test case for AssurKit tests.
 *
 * Provides common functionality for all tests including:
 * - Database setup and transactions
 * - Test data factories
 * - Helper methods for API testing
 */
abstract class TestCase extends BaseTestCase
{
    protected static bool $databaseSetup = false;

    /**
     * Set up the test case.
     */
    protected function setUp(): void
    {
        parent::setUp();

        // Set up database connection once
        if (!self::$databaseSetup) {
            $this->setupDatabaseConnection();
            self::$databaseSetup = true;
        }

        // Begin transaction for test isolation
        Capsule::connection()->beginTransaction();
    }

    /**
     * Tear down the test case.
     */
    protected function tearDown(): void
    {
        // Rollback transaction to clean up test data
        if (Capsule::connection()->transactionLevel() > 0) {
            Capsule::connection()->rollBack();
        }

        parent::tearDown();
    }

    /**
     * Set up database connection for testing.
     */
    protected function setupDatabaseConnection(): void
    {
        $capsule = new Capsule();

        $capsule->addConnection([
            'driver' => 'pgsql',
            'host' => getenv('DB_HOST') ?: 'localhost',
            'port' => getenv('DB_PORT') ?: 5432,
            'database' => getenv('DB_DATABASE') ?: 'assurkit_test',
            'username' => getenv('DB_USERNAME') ?: 'assurkit',
            'password' => getenv('DB_PASSWORD') ?: 'assurkit_test',
            'charset' => 'utf8',
            'collation' => 'utf8_unicode_ci',
            'prefix' => '',
        ]);

        $capsule->setAsGlobal();
        $capsule->bootEloquent();
    }

    /**
     * Create a test user in the database.
     */
    protected function createUser(array $attributes = []): array
    {
        $user = array_merge([
            'id' => \Ramsey\Uuid\Uuid::uuid4()->toString(),
            'email' => 'test' . rand(1000, 9999) . '@example.com',
            'password' => password_hash('password', PASSWORD_BCRYPT),
            'name' => 'Test User',
            'role' => 'Tester',
            'created_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s'),
        ], $attributes);

        Capsule::table('users')->insert($user);

        // Don't return password
        unset($user['password']);

        return $user;
    }

    /**
     * Create a test company in the database.
     */
    protected function createCompany(array $attributes = []): array
    {
        $company = array_merge([
            'id' => \Ramsey\Uuid\Uuid::uuid4()->toString(),
            'name' => 'Test Company ' . rand(1000, 9999),
            'created_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s'),
        ], $attributes);

        Capsule::table('companies')->insert($company);

        return $company;
    }

    /**
     * Create a test control in the database.
     */
    protected function createControl(array $attributes = []): array
    {
        $control = array_merge([
            'id' => \Ramsey\Uuid\Uuid::uuid4()->toString(),
            'name' => 'Test Control ' . rand(1000, 9999),
            'description' => 'Test control description',
            'type' => 'preventive',
            'frequency' => 'monthly',
            'automation' => 'manual',
            'is_key' => true,
            'status' => 'active',
            'created_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s'),
        ], $attributes);

        Capsule::table('controls')->insert($control);

        return $control;
    }

    /**
     * Assert that a JSON response has a specific structure.
     */
    protected function assertJsonStructure(array $structure, array $json): void
    {
        foreach ($structure as $key => $value) {
            if (is_array($value)) {
                $this->assertArrayHasKey($key, $json, "Missing key: {$key}");
                $this->assertJsonStructure($value, $json[$key]);
            } else {
                $this->assertArrayHasKey($value, $json, "Missing key: {$value}");
            }
        }
    }

    /**
     * Assert that a JSON response matches expected data.
     */
    protected function assertJsonMatch(array $expected, array $actual): void
    {
        foreach ($expected as $key => $value) {
            $this->assertArrayHasKey($key, $actual, "Missing key: {$key}");
            $this->assertEquals($value, $actual[$key], "Value mismatch for key: {$key}");
        }
    }
}
