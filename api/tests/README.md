# AssurKit API Testing

This directory contains the test suite for the AssurKit API using [Pest PHP](https://pestphp.com/).

## Structure

```
tests/
├── Feature/          # Integration/feature tests (API endpoints, database interactions)
├── Unit/             # Unit tests (isolated component testing)
├── Pest.php          # Pest configuration and global helpers
├── TestCase.php      # Base test case class
└── README.md         # This file
```

## Running Tests

### All Tests
```bash
cd api
composer test
```

### Specific Test Suite
```bash
# Unit tests only
vendor/bin/pest tests/Unit

# Feature tests only
vendor/bin/pest tests/Feature
```

### With Coverage
```bash
composer test:coverage
```

### Watch Mode (during development)
```bash
vendor/bin/pest --watch
```

## Writing Tests

### Unit Tests

Unit tests should test isolated components without external dependencies. Use mocking for dependencies.

```php
<?php

use AssurKit\Services\SomeService;

test('service performs expected operation', function () {
    $service = new SomeService();

    $result = $service->doSomething('input');

    expect($result)->toBe('expected-output');
});
```

### Feature Tests

Feature tests test API endpoints and database interactions. They extend `TestCase` which provides database transaction isolation.

```php
<?php

use function Pest\Laravel\{post, get};

test('can create a new company', function () {
    $user = $this->createUser(['role' => 'Admin']);

    $response = post('/api/companies', [
        'name' => 'Test Company',
    ], [
        'Authorization' => 'Bearer ' . generateTokenForUser($user),
    ]);

    expect($response->status())->toBe(201)
        ->and($response->json())->toHaveKey('id');
});
```

## Test Database

Tests use a separate test database (`assurkit_test`) to avoid affecting development data.

### Configuration

Set environment variables in `phpunit.xml` or `.env.testing`:

```xml
<php>
    <env name="DB_DATABASE" value="assurkit_test"/>
    <env name="DB_USERNAME" value="assurkit"/>
    <env name="DB_PASSWORD" value="assurkit_test"/>
</php>
```

### Database Isolation

Each feature test runs in a database transaction that is automatically rolled back after the test completes. This ensures test isolation without manual cleanup.

## Helper Functions

Global helper functions are available in all tests (defined in `Pest.php`):

### Database Helpers

- `setupTestDatabase()` - Initialize test database connection
- `beginDatabaseTransaction()` - Start a transaction
- `rollbackDatabaseTransaction()` - Rollback a transaction

### Factory Helpers

- `createTestUser(array $overrides = [])` - Create a test user
- `createTestControl(array $overrides = [])` - Create a test control

### TestCase Methods

When extending `TestCase`, you have access to:

- `$this->createUser($attributes)` - Create and persist a user in the database
- `$this->createCompany($attributes)` - Create and persist a company
- `$this->createControl($attributes)` - Create and persist a control
- `$this->assertJsonStructure($structure, $json)` - Assert JSON has expected structure
- `$this->assertJsonMatch($expected, $actual)` - Assert JSON matches expected data

## Best Practices

### 1. Test Naming

Use descriptive test names that explain what is being tested:

```php
✅ test('can create user with valid data')
✅ test('returns 404 when company not found')
✅ test('validates required fields on update')

❌ test('test1')
❌ test('it works')
```

### 2. Arrange-Act-Assert

Structure tests in three clear sections:

```php
test('calculates total correctly', function () {
    // Arrange: Set up test data
    $items = [10, 20, 30];

    // Act: Perform the action
    $total = calculateTotal($items);

    // Assert: Verify the result
    expect($total)->toBe(60);
});
```

### 3. One Assertion Per Concept

Each test should verify one specific behavior:

```php
✅ test('validates email format')
✅ test('validates email is required')
✅ test('validates email is unique')

❌ test('validates email') // Too broad
```

### 4. Use Factories for Test Data

Always use factory helpers instead of hardcoding test data:

```php
✅ $user = $this->createUser(['role' => 'Admin']);

❌ $user = ['id' => '123', 'email' => 'test@test.com', ...];
```

### 5. Mock External Dependencies

Unit tests should not depend on external services:

```php
test('sends email notification', function () {
    $mailer = Mockery::mock(Mailer::class);
    $mailer->shouldReceive('send')->once();

    $service = new NotificationService($mailer);
    $service->notifyUser($user);
});
```

## Code Coverage

Aim for high test coverage, especially for:
- Business logic (services, models)
- Critical paths (authentication, authorization)
- Data validation
- API endpoints

Minimum coverage targets:
- Unit tests: 80%+
- Feature tests: All critical paths

Check coverage report after running:
```bash
composer test:coverage
open coverage/index.html
```

## CI/CD

Tests automatically run on:
- Pull requests (pr-backend workflow)
- Pushes to `main` and `development` branches

All tests must pass before merging.

## Troubleshooting

### Database Connection Errors

Ensure the test database exists:
```bash
psql -U assurkit -c "CREATE DATABASE assurkit_test;"
```

### Permission Errors

Grant necessary permissions:
```bash
psql -U assurkit -c "GRANT ALL PRIVILEGES ON DATABASE assurkit_test TO assurkit;"
```

### Slow Tests

Use database transactions for isolation instead of truncating tables:
```php
// ✅ Fast (uses transactions)
class MyTest extends TestCase { }

// ❌ Slow (truncates tables)
beforeEach(function () {
    DB::table('users')->truncate();
});
```

## Resources

- [Pest PHP Documentation](https://pestphp.com/docs)
- [PHPUnit Documentation](https://phpunit.de/documentation.html)
- [Mockery Documentation](http://docs.mockery.io/)
