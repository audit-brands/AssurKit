<?php

declare(strict_types=1);

use AssurKit\Models\Subprocess;
use AssurKit\Tests\Integration\IntegrationTestCase;

uses(IntegrationTestCase::class);

describe('GET /api/subprocesses', function () {
    test('returns paginated subprocesses list', function () {
        $token = $this->createUserWithToken('viewer@example.com', 'Viewer', 'password123', 'Viewer');

        $company = $this->createCompany(['name' => 'Test Company']);
        $process = $this->createProcess(['name' => 'Test Process', 'company_id' => $company['id']]);
        $this->createSubprocess(['name' => 'Subprocess A', 'process_id' => $process['id']]);
        $this->createSubprocess(['name' => 'Subprocess B', 'process_id' => $process['id']]);

        $response = $this->get('/api/subprocesses', $this->authHeader($token));

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(200)
            ->and($data)->toHaveKey('data')
            ->and($data)->toHaveKey('pagination')
            ->and(count($data['data']))->toBeGreaterThanOrEqual(2);
    });

    test('supports search filtering', function () {
        $token = $this->createUserWithToken('viewer@example.com', 'Viewer', 'password123', 'Viewer');

        $company = $this->createCompany(['name' => 'Test Company']);
        $process = $this->createProcess(['name' => 'Test Process', 'company_id' => $company['id']]);
        $this->createSubprocess(['name' => 'Revenue Recognition', 'process_id' => $process['id']]);
        $this->createSubprocess(['name' => 'Account Reconciliation', 'process_id' => $process['id']]);

        $response = $this->get('/api/subprocesses', $this->authHeader($token), ['search' => 'Revenue']);

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(200)
            ->and(count($data['data']))->toBeGreaterThanOrEqual(1);
    });

    test('filters by process', function () {
        $token = $this->createUserWithToken('viewer@example.com', 'Viewer', 'password123', 'Viewer');

        $company = $this->createCompany(['name' => 'Test Company']);
        $process1 = $this->createProcess(['name' => 'Process A', 'company_id' => $company['id']]);
        $process2 = $this->createProcess(['name' => 'Process B', 'company_id' => $company['id']]);
        $this->createSubprocess(['name' => 'Subprocess A1', 'process_id' => $process1['id']]);
        $this->createSubprocess(['name' => 'Subprocess B1', 'process_id' => $process2['id']]);

        $response = $this->get('/api/subprocesses', $this->authHeader($token), ['process_id' => $process1['id']]);

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(200);

        foreach ($data['data'] as $subprocess) {
            expect($subprocess['process_id'])->toBe($process1['id']);
        }
    });

    test('requires authentication', function () {
        $response = $this->get('/api/subprocesses');

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(401)
            ->and($data['error'])->toBe('Unauthorized');
    });
});

describe('GET /api/subprocesses/{id}', function () {
    test('returns subprocess with risks', function () {
        $token = $this->createUserWithToken('viewer@example.com', 'Viewer', 'password123', 'Viewer');

        $company = $this->createCompany(['name' => 'Test Company']);
        $process = $this->createProcess(['name' => 'Test Process', 'company_id' => $company['id']]);
        $subprocess = $this->createSubprocess(['name' => 'Test Subprocess', 'process_id' => $process['id']]);

        $response = $this->get("/api/subprocesses/{$subprocess['id']}", $this->authHeader($token));

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(200)
            ->and($data['id'])->toBe($subprocess['id'])
            ->and($data['name'])->toBe('Test Subprocess')
            ->and($data)->toHaveKey('risks')
            ->and($data)->toHaveKey('process');
    });

    test('returns 404 for non-existent subprocess', function () {
        $token = $this->createUserWithToken('viewer@example.com', 'Viewer', 'password123', 'Viewer');

        $response = $this->get('/api/subprocesses/00000000-0000-0000-0000-000000000000', $this->authHeader($token));

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(404)
            ->and($data['error'])->toBe(true);
    });
});

describe('POST /api/manage/subprocesses', function () {
    test('Admin can create subprocess', function () {
        $token = $this->createUserWithToken('admin@example.com', 'Admin', 'password123', 'Admin');

        $company = $this->createCompany(['name' => 'Test Company']);
        $process = $this->createProcess(['name' => 'Test Process', 'company_id' => $company['id']]);

        $response = $this->post('/api/manage/subprocesses', [
            'process_id' => $process['id'],
            'name' => 'New Subprocess',
            'description' => 'Test subprocess description',
            'owner_email' => 'owner@example.com',
        ], $this->authHeader($token));

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(201)
            ->and($data['message'])->toBe('Subprocess created successfully')
            ->and($data['subprocess']['name'])->toBe('New Subprocess');

        // Verify in database
        $subprocess = Subprocess::where('name', 'New Subprocess')->first();
        expect($subprocess)->not->toBeNull()
            ->and($subprocess->process_id)->toBe($process['id']);
    });

    test('Manager can create subprocess', function () {
        $token = $this->createUserWithToken('manager@example.com', 'Manager', 'password123', 'Manager');

        $company = $this->createCompany(['name' => 'Test Company']);
        $process = $this->createProcess(['name' => 'Test Process', 'company_id' => $company['id']]);

        $response = $this->post('/api/manage/subprocesses', [
            'process_id' => $process['id'],
            'name' => 'Manager Subprocess',
            'description' => 'Test',
            'owner_email' => 'owner@example.com',
        ], $this->authHeader($token));

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(201)
            ->and($data['message'])->toBe('Subprocess created successfully');
    });

    test('Tester cannot create subprocess', function () {
        $token = $this->createUserWithToken('tester@example.com', 'Tester', 'password123', 'Tester');

        $company = $this->createCompany(['name' => 'Test Company']);
        $process = $this->createProcess(['name' => 'Test Process', 'company_id' => $company['id']]);

        $response = $this->post('/api/manage/subprocesses', [
            'process_id' => $process['id'],
            'name' => 'Test Subprocess',
            'owner_email' => 'owner@example.com',
        ], $this->authHeader($token));

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(403)
            ->and($data['error'])->toBe('Forbidden');
    });

    test('Viewer cannot create subprocess', function () {
        $token = $this->createUserWithToken('viewer@example.com', 'Viewer', 'password123', 'Viewer');

        $company = $this->createCompany(['name' => 'Test Company']);
        $process = $this->createProcess(['name' => 'Test Process', 'company_id' => $company['id']]);

        $response = $this->post('/api/manage/subprocesses', [
            'process_id' => $process['id'],
            'name' => 'Test Subprocess',
            'owner_email' => 'owner@example.com',
        ], $this->authHeader($token));

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(403)
            ->and($data['error'])->toBe('Forbidden');
    });

    test('validates required fields', function () {
        $token = $this->createUserWithToken('admin@example.com', 'Admin', 'password123', 'Admin');

        $response = $this->post('/api/manage/subprocesses', [
            'name' => 'Incomplete Subprocess',
            // Missing process_id
        ], $this->authHeader($token));

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(400)
            ->and($data['error'])->toBe(true);
    });

    test('validates process exists', function () {
        $token = $this->createUserWithToken('admin@example.com', 'Admin', 'password123', 'Admin');

        $response = $this->post('/api/manage/subprocesses', [
            'process_id' => 'non-existent-process-id',
            'name' => 'Test Subprocess',
            'owner_email' => 'owner@example.com',
        ], $this->authHeader($token));

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(400)
            ->and($data['error'])->toBe(true);
    });

    test('validates email format', function () {
        $token = $this->createUserWithToken('admin@example.com', 'Admin', 'password123', 'Admin');

        $company = $this->createCompany(['name' => 'Test Company']);
        $process = $this->createProcess(['name' => 'Test Process', 'company_id' => $company['id']]);

        $response = $this->post('/api/manage/subprocesses', [
            'process_id' => $process['id'],
            'name' => 'Test Subprocess',
            'owner_email' => 'not-an-email',
        ], $this->authHeader($token));

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(400)
            ->and($data['error'])->toBe(true);
    });
});

describe('PUT /api/manage/subprocesses/{id}', function () {
    test('Admin can update subprocess', function () {
        $token = $this->createUserWithToken('admin@example.com', 'Admin', 'password123', 'Admin');

        $company = $this->createCompany(['name' => 'Test Company']);
        $process = $this->createProcess(['name' => 'Test Process', 'company_id' => $company['id']]);
        $subprocess = $this->createSubprocess(['name' => 'Original Subprocess', 'process_id' => $process['id']]);

        $response = $this->put("/api/manage/subprocesses/{$subprocess['id']}", [
            'name' => 'Updated Subprocess',
            'description' => 'Updated description',
        ], $this->authHeader($token));

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(200)
            ->and($data['message'])->toBe('Subprocess updated successfully')
            ->and($data['subprocess']['name'])->toBe('Updated Subprocess');

        // Verify in database
        $updated = Subprocess::find($subprocess['id']);
        expect($updated->name)->toBe('Updated Subprocess');
    });

    test('Manager can update subprocess', function () {
        $token = $this->createUserWithToken('manager@example.com', 'Manager', 'password123', 'Manager');

        $company = $this->createCompany(['name' => 'Test Company']);
        $process = $this->createProcess(['name' => 'Test Process', 'company_id' => $company['id']]);
        $subprocess = $this->createSubprocess(['name' => 'Original Subprocess', 'process_id' => $process['id']]);

        $response = $this->put("/api/manage/subprocesses/{$subprocess['id']}", [
            'name' => 'Manager Updated',
        ], $this->authHeader($token));

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(200)
            ->and($data['message'])->toBe('Subprocess updated successfully');
    });

    test('Tester cannot update subprocess', function () {
        $token = $this->createUserWithToken('tester@example.com', 'Tester', 'password123', 'Tester');

        $company = $this->createCompany(['name' => 'Test Company']);
        $process = $this->createProcess(['name' => 'Test Process', 'company_id' => $company['id']]);
        $subprocess = $this->createSubprocess(['name' => 'Test Subprocess', 'process_id' => $process['id']]);

        $response = $this->put("/api/manage/subprocesses/{$subprocess['id']}", [
            'name' => 'Updated Name',
        ], $this->authHeader($token));

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(403)
            ->and($data['error'])->toBe('Forbidden');
    });

    test('supports partial updates', function () {
        $token = $this->createUserWithToken('admin@example.com', 'Admin', 'password123', 'Admin');

        $company = $this->createCompany(['name' => 'Test Company']);
        $process = $this->createProcess(['name' => 'Test Process', 'company_id' => $company['id']]);
        $subprocess = $this->createSubprocess([
            'name' => 'Original Name',
            'description' => 'Original Description',
            'process_id' => $process['id'],
        ]);

        $response = $this->put("/api/manage/subprocesses/{$subprocess['id']}", [
            'description' => 'New Description Only',
        ], $this->authHeader($token));

        $updated = Subprocess::find($subprocess['id']);

        expect($response->getStatusCode())->toBe(200)
            ->and($updated->name)->toBe('Original Name')
            ->and($updated->description)->toBe('New Description Only');
    });
});

describe('DELETE /api/manage/subprocesses/{id}', function () {
    test('Admin can delete subprocess', function () {
        $token = $this->createUserWithToken('admin@example.com', 'Admin', 'password123', 'Admin');

        $company = $this->createCompany(['name' => 'Test Company']);
        $process = $this->createProcess(['name' => 'Test Process', 'company_id' => $company['id']]);
        $subprocess = $this->createSubprocess(['name' => 'Subprocess to Delete', 'process_id' => $process['id']]);

        $response = $this->delete("/api/manage/subprocesses/{$subprocess['id']}", $this->authHeader($token));

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(200)
            ->and($data['message'])->toBe('Subprocess deleted successfully');

        // Verify deleted from database
        $deleted = Subprocess::find($subprocess['id']);
        expect($deleted)->toBeNull();
    });

    test('Manager can delete subprocess', function () {
        $token = $this->createUserWithToken('manager@example.com', 'Manager', 'password123', 'Manager');

        $company = $this->createCompany(['name' => 'Test Company']);
        $process = $this->createProcess(['name' => 'Test Process', 'company_id' => $company['id']]);
        $subprocess = $this->createSubprocess(['name' => 'Manager Delete', 'process_id' => $process['id']]);

        $response = $this->delete("/api/manage/subprocesses/{$subprocess['id']}", $this->authHeader($token));

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(200)
            ->and($data['message'])->toBe('Subprocess deleted successfully');
    });

    test('Tester cannot delete subprocess', function () {
        $token = $this->createUserWithToken('tester@example.com', 'Tester', 'password123', 'Tester');

        $company = $this->createCompany(['name' => 'Test Company']);
        $process = $this->createProcess(['name' => 'Test Process', 'company_id' => $company['id']]);
        $subprocess = $this->createSubprocess(['name' => 'Test Subprocess', 'process_id' => $process['id']]);

        $response = $this->delete("/api/manage/subprocesses/{$subprocess['id']}", $this->authHeader($token));

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(403)
            ->and($data['error'])->toBe('Forbidden');
    });

    test('Viewer cannot delete subprocess', function () {
        $token = $this->createUserWithToken('viewer@example.com', 'Viewer', 'password123', 'Viewer');

        $company = $this->createCompany(['name' => 'Test Company']);
        $process = $this->createProcess(['name' => 'Test Process', 'company_id' => $company['id']]);
        $subprocess = $this->createSubprocess(['name' => 'Test Subprocess', 'process_id' => $process['id']]);

        $response = $this->delete("/api/manage/subprocesses/{$subprocess['id']}", $this->authHeader($token));

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(403)
            ->and($data['error'])->toBe('Forbidden');
    });
});
