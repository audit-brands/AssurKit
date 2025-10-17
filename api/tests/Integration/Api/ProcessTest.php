<?php

declare(strict_types=1);

use AssurKit\Models\Process;
use AssurKit\Tests\Integration\IntegrationTestCase;

uses(IntegrationTestCase::class);

describe('GET /api/processes', function () {
    test('returns paginated processes list', function () {
        $token = $this->createUserWithToken('viewer@example.com', 'Viewer', 'password123', 'Viewer');

        $company = $this->createCompany(['name' => 'Test Company']);
        $this->createProcess(['name' => 'Process A', 'company_id' => $company['id']]);
        $this->createProcess(['name' => 'Process B', 'company_id' => $company['id']]);

        $response = $this->get('/api/processes', $this->authHeader($token));

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(200)
            ->and($data)->toHaveKey('data')
            ->and($data)->toHaveKey('pagination')
            ->and(count($data['data']))->toBeGreaterThanOrEqual(2);
    });

    test('supports search filtering', function () {
        $token = $this->createUserWithToken('viewer@example.com', 'Viewer', 'password123', 'Viewer');

        $company = $this->createCompany(['name' => 'Test Company']);
        $this->createProcess(['name' => 'Financial Reporting', 'company_id' => $company['id']]);
        $this->createProcess(['name' => 'IT Operations', 'company_id' => $company['id']]);

        $response = $this->get('/api/processes', $this->authHeader($token), ['search' => 'Financial']);

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(200)
            ->and(count($data['data']))->toBeGreaterThanOrEqual(1);
    });

    test('filters by company', function () {
        $token = $this->createUserWithToken('viewer@example.com', 'Viewer', 'password123', 'Viewer');

        $company1 = $this->createCompany(['name' => 'Company A']);
        $company2 = $this->createCompany(['name' => 'Company B']);
        $this->createProcess(['name' => 'Process A1', 'company_id' => $company1['id']]);
        $this->createProcess(['name' => 'Process B1', 'company_id' => $company2['id']]);

        $response = $this->get('/api/processes', $this->authHeader($token), ['company_id' => $company1['id']]);

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(200);

        foreach ($data['data'] as $process) {
            expect($process['company_id'])->toBe($company1['id']);
        }
    });

    test('requires authentication', function () {
        $response = $this->get('/api/processes');

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(401)
            ->and($data['error'])->toBe('Unauthorized');
    });
});

describe('GET /api/processes/{id}', function () {
    test('returns process with subprocesses', function () {
        $token = $this->createUserWithToken('viewer@example.com', 'Viewer', 'password123', 'Viewer');

        $company = $this->createCompany(['name' => 'Test Company']);
        $process = $this->createProcess(['name' => 'Test Process', 'company_id' => $company['id']]);

        $response = $this->get("/api/processes/{$process['id']}", $this->authHeader($token));

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(200)
            ->and($data['id'])->toBe($process['id'])
            ->and($data['name'])->toBe('Test Process')
            ->and($data)->toHaveKey('subprocesses')
            ->and($data)->toHaveKey('company');
    });

    test('returns 404 for non-existent process', function () {
        $token = $this->createUserWithToken('viewer@example.com', 'Viewer', 'password123', 'Viewer');

        $response = $this->get('/api/processes/00000000-0000-0000-0000-000000000000', $this->authHeader($token));

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(404)
            ->and($data['error'])->toBe(true);
    });
});

describe('POST /api/manage/processes', function () {
    test('Admin can create process', function () {
        $token = $this->createUserWithToken('admin@example.com', 'Admin', 'password123', 'Admin');

        $company = $this->createCompany(['name' => 'Test Company']);

        $response = $this->post('/api/manage/processes', [
            'company_id' => $company['id'],
            'name' => 'New Process',
            'description' => 'Test process description',
            'owner_email' => 'owner@example.com',
        ], $this->authHeader($token));

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(201)
            ->and($data['message'])->toBe('Process created successfully')
            ->and($data['process']['name'])->toBe('New Process');

        // Verify in database
        $process = Process::where('name', 'New Process')->first();
        expect($process)->not->toBeNull()
            ->and($process->company_id)->toBe($company['id']);
    });

    test('Manager can create process', function () {
        $token = $this->createUserWithToken('manager@example.com', 'Manager', 'password123', 'Manager');

        $company = $this->createCompany(['name' => 'Test Company']);

        $response = $this->post('/api/manage/processes', [
            'company_id' => $company['id'],
            'name' => 'Manager Process',
            'description' => 'Test',
            'owner_email' => 'owner@example.com',
        ], $this->authHeader($token));

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(201)
            ->and($data['message'])->toBe('Process created successfully');
    });

    test('Tester cannot create process', function () {
        $token = $this->createUserWithToken('tester@example.com', 'Tester', 'password123', 'Tester');

        $company = $this->createCompany(['name' => 'Test Company']);

        $response = $this->post('/api/manage/processes', [
            'company_id' => $company['id'],
            'name' => 'Test Process',
            'owner_email' => 'owner@example.com',
        ], $this->authHeader($token));

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(403)
            ->and($data['error'])->toBe('Forbidden');
    });

    test('Viewer cannot create process', function () {
        $token = $this->createUserWithToken('viewer@example.com', 'Viewer', 'password123', 'Viewer');

        $company = $this->createCompany(['name' => 'Test Company']);

        $response = $this->post('/api/manage/processes', [
            'company_id' => $company['id'],
            'name' => 'Test Process',
            'owner_email' => 'owner@example.com',
        ], $this->authHeader($token));

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(403)
            ->and($data['error'])->toBe('Forbidden');
    });

    test('validates required fields', function () {
        $token = $this->createUserWithToken('admin@example.com', 'Admin', 'password123', 'Admin');

        $response = $this->post('/api/manage/processes', [
            'name' => 'Incomplete Process',
            // Missing company_id
        ], $this->authHeader($token));

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(400)
            ->and($data['error'])->toBe(true);
    });

    test('validates company exists', function () {
        $token = $this->createUserWithToken('admin@example.com', 'Admin', 'password123', 'Admin');

        $response = $this->post('/api/manage/processes', [
            'company_id' => 'non-existent-company-id',
            'name' => 'Test Process',
            'owner_email' => 'owner@example.com',
        ], $this->authHeader($token));

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(400)
            ->and($data['error'])->toBe(true);
    });

    test('validates email format', function () {
        $token = $this->createUserWithToken('admin@example.com', 'Admin', 'password123', 'Admin');

        $company = $this->createCompany(['name' => 'Test Company']);

        $response = $this->post('/api/manage/processes', [
            'company_id' => $company['id'],
            'name' => 'Test Process',
            'owner_email' => 'not-an-email',
        ], $this->authHeader($token));

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(400)
            ->and($data['error'])->toBe(true);
    });
});

describe('PUT /api/manage/processes/{id}', function () {
    test('Admin can update process', function () {
        $token = $this->createUserWithToken('admin@example.com', 'Admin', 'password123', 'Admin');

        $company = $this->createCompany(['name' => 'Test Company']);
        $process = $this->createProcess(['name' => 'Original Process', 'company_id' => $company['id']]);

        $response = $this->put("/api/manage/processes/{$process['id']}", [
            'name' => 'Updated Process',
            'description' => 'Updated description',
        ], $this->authHeader($token));

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(200)
            ->and($data['message'])->toBe('Process updated successfully')
            ->and($data['process']['name'])->toBe('Updated Process');

        // Verify in database
        $updated = Process::find($process['id']);
        expect($updated->name)->toBe('Updated Process');
    });

    test('Manager can update process', function () {
        $token = $this->createUserWithToken('manager@example.com', 'Manager', 'password123', 'Manager');

        $company = $this->createCompany(['name' => 'Test Company']);
        $process = $this->createProcess(['name' => 'Original Process', 'company_id' => $company['id']]);

        $response = $this->put("/api/manage/processes/{$process['id']}", [
            'name' => 'Manager Updated',
        ], $this->authHeader($token));

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(200)
            ->and($data['message'])->toBe('Process updated successfully');
    });

    test('Tester cannot update process', function () {
        $token = $this->createUserWithToken('tester@example.com', 'Tester', 'password123', 'Tester');

        $company = $this->createCompany(['name' => 'Test Company']);
        $process = $this->createProcess(['name' => 'Test Process', 'company_id' => $company['id']]);

        $response = $this->put("/api/manage/processes/{$process['id']}", [
            'name' => 'Updated Name',
        ], $this->authHeader($token));

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(403)
            ->and($data['error'])->toBe('Forbidden');
    });

    test('supports partial updates', function () {
        $token = $this->createUserWithToken('admin@example.com', 'Admin', 'password123', 'Admin');

        $company = $this->createCompany(['name' => 'Test Company']);
        $process = $this->createProcess([
            'name' => 'Original Name',
            'description' => 'Original Description',
            'company_id' => $company['id'],
        ]);

        $response = $this->put("/api/manage/processes/{$process['id']}", [
            'description' => 'New Description Only',
        ], $this->authHeader($token));

        $updated = Process::find($process['id']);

        expect($response->getStatusCode())->toBe(200)
            ->and($updated->name)->toBe('Original Name')
            ->and($updated->description)->toBe('New Description Only');
    });
});

describe('DELETE /api/manage/processes/{id}', function () {
    test('Admin can delete process', function () {
        $token = $this->createUserWithToken('admin@example.com', 'Admin', 'password123', 'Admin');

        $company = $this->createCompany(['name' => 'Test Company']);
        $process = $this->createProcess(['name' => 'Process to Delete', 'company_id' => $company['id']]);

        $response = $this->delete("/api/manage/processes/{$process['id']}", $this->authHeader($token));

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(200)
            ->and($data['message'])->toBe('Process deleted successfully');

        // Verify deleted from database
        $deleted = Process::find($process['id']);
        expect($deleted)->toBeNull();
    });

    test('Manager can delete process', function () {
        $token = $this->createUserWithToken('manager@example.com', 'Manager', 'password123', 'Manager');

        $company = $this->createCompany(['name' => 'Test Company']);
        $process = $this->createProcess(['name' => 'Manager Delete', 'company_id' => $company['id']]);

        $response = $this->delete("/api/manage/processes/{$process['id']}", $this->authHeader($token));

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(200)
            ->and($data['message'])->toBe('Process deleted successfully');
    });

    test('Tester cannot delete process', function () {
        $token = $this->createUserWithToken('tester@example.com', 'Tester', 'password123', 'Tester');

        $company = $this->createCompany(['name' => 'Test Company']);
        $process = $this->createProcess(['name' => 'Test Process', 'company_id' => $company['id']]);

        $response = $this->delete("/api/manage/processes/{$process['id']}", $this->authHeader($token));

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(403)
            ->and($data['error'])->toBe('Forbidden');
    });

    test('Viewer cannot delete process', function () {
        $token = $this->createUserWithToken('viewer@example.com', 'Viewer', 'password123', 'Viewer');

        $company = $this->createCompany(['name' => 'Test Company']);
        $process = $this->createProcess(['name' => 'Test Process', 'company_id' => $company['id']]);

        $response = $this->delete("/api/manage/processes/{$process['id']}", $this->authHeader($token));

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(403)
            ->and($data['error'])->toBe('Forbidden');
    });
});
