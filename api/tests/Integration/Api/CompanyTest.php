<?php

declare(strict_types=1);

use AssurKit\Models\Company;
use AssurKit\Tests\Integration\IntegrationTestCase;

uses(IntegrationTestCase::class);

describe('GET /api/companies', function () {
    test('returns paginated companies list', function () {
        $token = $this->createUserWithToken('viewer@example.com', 'Viewer', 'password123', 'Viewer');

        // Create test companies
        $this->createCompany(['name' => 'Company A']);
        $this->createCompany(['name' => 'Company B']);

        $response = $this->get('/api/companies', $this->authHeader($token));

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(200)
            ->and($data)->toHaveKey('data')
            ->and($data)->toHaveKey('pagination')
            ->and($data['pagination']['page'])->toBe(1)
            ->and(count($data['data']))->toBeGreaterThanOrEqual(2);
    });

    test('supports search filtering', function () {
        $token = $this->createUserWithToken('viewer@example.com', 'Viewer', 'password123', 'Viewer');

        $this->createCompany(['name' => 'Acme Corporation']);
        $this->createCompany(['name' => 'Beta Industries']);

        $response = $this->get('/api/companies', $this->authHeader($token), ['search' => 'Acme']);

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(200)
            ->and(count($data['data']))->toBe(1)
            ->and($data['data'][0]['name'])->toBe('Acme Corporation');
    });

    test('supports pagination parameters', function () {
        $token = $this->createUserWithToken('viewer@example.com', 'Viewer', 'password123', 'Viewer');

        // Create multiple companies
        for ($i = 1; $i <= 15; $i++) {
            $this->createCompany(['name' => "Company {$i}"]);
        }

        $response = $this->get('/api/companies', $this->authHeader($token), [
            'page' => 2,
            'limit' => 5,
        ]);

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(200)
            ->and($data['pagination']['page'])->toBe(2)
            ->and($data['pagination']['limit'])->toBe(5)
            ->and(count($data['data']))->toBeLessThanOrEqual(5);
    });

    test('requires authentication', function () {
        $response = $this->get('/api/companies');

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(401)
            ->and($data['error'])->toBe('Unauthorized');
    });
});

describe('GET /api/companies/{id}', function () {
    test('returns company with processes', function () {
        $token = $this->createUserWithToken('viewer@example.com', 'Viewer', 'password123', 'Viewer');

        $company = $this->createCompany(['name' => 'Test Company']);

        $response = $this->get("/api/companies/{$company['id']}", $this->authHeader($token));

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(200)
            ->and($data['id'])->toBe($company['id'])
            ->and($data['name'])->toBe('Test Company')
            ->and($data)->toHaveKey('processes');
    });

    test('returns 404 for non-existent company', function () {
        $token = $this->createUserWithToken('viewer@example.com', 'Viewer', 'password123', 'Viewer');

        $response = $this->get('/api/companies/non-existent-id', $this->authHeader($token));

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(404)
            ->and($data['error'])->toBe(true);
    });
});

describe('POST /api/manage/companies', function () {
    test('Admin can create company', function () {
        $token = $this->createUserWithToken('admin@example.com', 'Admin', 'password123', 'Admin');

        $response = $this->post('/api/manage/companies', [
            'name' => 'New Company',
            'description' => 'A new test company',
            'ticker_symbol' => 'NEWCO',
            'industry' => 'Technology',
        ], $this->authHeader($token));

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(201)
            ->and($data['message'])->toBe('Company created successfully')
            ->and($data['company']['name'])->toBe('New Company');

        // Verify in database
        $company = Company::where('name', 'New Company')->first();
        expect($company)->not->toBeNull();
    });

    test('Manager can create company', function () {
        $token = $this->createUserWithToken('manager@example.com', 'Manager', 'password123', 'Manager');

        $response = $this->post('/api/manage/companies', [
            'name' => 'Manager Company',
        ], $this->authHeader($token));

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(201)
            ->and($data['message'])->toBe('Company created successfully');
    });

    test('Tester cannot create company', function () {
        $token = $this->createUserWithToken('tester@example.com', 'Tester', 'password123', 'Tester');

        $response = $this->post('/api/manage/companies', [
            'name' => 'Test Company',
        ], $this->authHeader($token));

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(403)
            ->and($data['error'])->toBe('Forbidden');
    });

    test('Viewer cannot create company', function () {
        $token = $this->createUserWithToken('viewer@example.com', 'Viewer', 'password123', 'Viewer');

        $response = $this->post('/api/manage/companies', [
            'name' => 'Test Company',
        ], $this->authHeader($token));

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(403)
            ->and($data['error'])->toBe('Forbidden');
    });

    test('validates required fields', function () {
        $token = $this->createUserWithToken('admin@example.com', 'Admin', 'password123', 'Admin');

        $response = $this->post('/api/manage/companies', [], $this->authHeader($token));

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(400)
            ->and($data['error'])->toBe(true);
    });

    test('validates name length', function () {
        $token = $this->createUserWithToken('admin@example.com', 'Admin', 'password123', 'Admin');

        $response = $this->post('/api/manage/companies', [
            'name' => 'A', // Too short
        ], $this->authHeader($token));

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(400)
            ->and($data['error'])->toBe(true);
    });
});

describe('PUT /api/manage/companies/{id}', function () {
    test('Admin can update company', function () {
        $token = $this->createUserWithToken('admin@example.com', 'Admin', 'password123', 'Admin');

        $company = $this->createCompany(['name' => 'Original Name']);

        $response = $this->put("/api/manage/companies/{$company['id']}", [
            'name' => 'Updated Name',
            'description' => 'Updated description',
        ], $this->authHeader($token));

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(200)
            ->and($data['message'])->toBe('Company updated successfully')
            ->and($data['company']['name'])->toBe('Updated Name');

        // Verify in database
        $updated = Company::find($company['id']);
        expect($updated->name)->toBe('Updated Name');
    });

    test('Manager can update company', function () {
        $token = $this->createUserWithToken('manager@example.com', 'Manager', 'password123', 'Manager');

        $company = $this->createCompany(['name' => 'Original Name']);

        $response = $this->put("/api/manage/companies/{$company['id']}", [
            'name' => 'Manager Updated',
        ], $this->authHeader($token));

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(200)
            ->and($data['message'])->toBe('Company updated successfully');
    });

    test('Tester cannot update company', function () {
        $token = $this->createUserWithToken('tester@example.com', 'Tester', 'password123', 'Tester');

        $company = $this->createCompany(['name' => 'Test Company']);

        $response = $this->put("/api/manage/companies/{$company['id']}", [
            'name' => 'Updated Name',
        ], $this->authHeader($token));

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(403)
            ->and($data['error'])->toBe('Forbidden');
    });

    test('supports partial updates', function () {
        $token = $this->createUserWithToken('admin@example.com', 'Admin', 'password123', 'Admin');

        $company = $this->createCompany([
            'name' => 'Original Name',
            'description' => 'Original Description',
        ]);

        $response = $this->put("/api/manage/companies/{$company['id']}", [
            'description' => 'New Description Only',
        ], $this->authHeader($token));

        $updated = Company::find($company['id']);

        expect($response->getStatusCode())->toBe(200)
            ->and($updated->name)->toBe('Original Name')
            ->and($updated->description)->toBe('New Description Only');
    });
});

describe('DELETE /api/manage/companies/{id}', function () {
    test('Admin can delete company', function () {
        $token = $this->createUserWithToken('admin@example.com', 'Admin', 'password123', 'Admin');

        $company = $this->createCompany(['name' => 'Company to Delete']);

        $response = $this->delete("/api/manage/companies/{$company['id']}", $this->authHeader($token));

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(200)
            ->and($data['message'])->toBe('Company deleted successfully');

        // Verify deleted from database
        $deleted = Company::find($company['id']);
        expect($deleted)->toBeNull();
    });

    test('Manager can delete company', function () {
        $token = $this->createUserWithToken('manager@example.com', 'Manager', 'password123', 'Manager');

        $company = $this->createCompany(['name' => 'Manager Delete']);

        $response = $this->delete("/api/manage/companies/{$company['id']}", $this->authHeader($token));

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(200)
            ->and($data['message'])->toBe('Company deleted successfully');
    });

    test('Tester cannot delete company', function () {
        $token = $this->createUserWithToken('tester@example.com', 'Tester', 'password123', 'Tester');

        $company = $this->createCompany(['name' => 'Test Company']);

        $response = $this->delete("/api/manage/companies/{$company['id']}", $this->authHeader($token));

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(403)
            ->and($data['error'])->toBe('Forbidden');
    });

    test('Viewer cannot delete company', function () {
        $token = $this->createUserWithToken('viewer@example.com', 'Viewer', 'password123', 'Viewer');

        $company = $this->createCompany(['name' => 'Test Company']);

        $response = $this->delete("/api/manage/companies/{$company['id']}", $this->authHeader($token));

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(403)
            ->and($data['error'])->toBe('Forbidden');
    });
});
