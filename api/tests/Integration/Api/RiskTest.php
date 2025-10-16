<?php

declare(strict_types=1);

use AssurKit\Models\Risk;
use AssurKit\Tests\Integration\IntegrationTestCase;

uses(IntegrationTestCase::class);

describe('GET /api/risks', function () {
    test('returns paginated risks list', function () {
        $token = $this->createUserWithToken('viewer@example.com', 'Viewer', 'password123', 'Viewer');

        $company = $this->createCompany(['name' => 'Test Company']);
        $process = $this->createProcess(['name' => 'Test Process', 'company_id' => $company['id']]);
        $subprocess = $this->createSubprocess(['name' => 'Test Subprocess', 'process_id' => $process['id']]);
        $this->createRisk(['name' => 'Risk A', 'subprocess_id' => $subprocess['id']]);
        $this->createRisk(['name' => 'Risk B', 'subprocess_id' => $subprocess['id']]);

        $response = $this->get('/api/risks', $this->authHeader($token));

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
        $subprocess = $this->createSubprocess(['name' => 'Test Subprocess', 'process_id' => $process['id']]);
        $this->createRisk(['name' => 'Data Breach Risk', 'subprocess_id' => $subprocess['id']]);
        $this->createRisk(['name' => 'Financial Misstatement', 'subprocess_id' => $subprocess['id']]);

        $response = $this->get('/api/risks', $this->authHeader($token), ['search' => 'Data Breach']);

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(200)
            ->and(count($data['data']))->toBeGreaterThanOrEqual(1);
    });

    test('filters by subprocess', function () {
        $token = $this->createUserWithToken('viewer@example.com', 'Viewer', 'password123', 'Viewer');

        $company = $this->createCompany(['name' => 'Test Company']);
        $process = $this->createProcess(['name' => 'Test Process', 'company_id' => $company['id']]);
        $subprocess1 = $this->createSubprocess(['name' => 'Subprocess A', 'process_id' => $process['id']]);
        $subprocess2 = $this->createSubprocess(['name' => 'Subprocess B', 'process_id' => $process['id']]);
        $this->createRisk(['name' => 'Risk A1', 'subprocess_id' => $subprocess1['id']]);
        $this->createRisk(['name' => 'Risk B1', 'subprocess_id' => $subprocess2['id']]);

        $response = $this->get('/api/risks', $this->authHeader($token), ['subprocess_id' => $subprocess1['id']]);

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(200);

        foreach ($data['data'] as $risk) {
            expect($risk['subprocess_id'])->toBe($subprocess1['id']);
        }
    });

    test('filters by severity', function () {
        $token = $this->createUserWithToken('viewer@example.com', 'Viewer', 'password123', 'Viewer');

        $company = $this->createCompany(['name' => 'Test Company']);
        $process = $this->createProcess(['name' => 'Test Process', 'company_id' => $company['id']]);
        $subprocess = $this->createSubprocess(['name' => 'Test Subprocess', 'process_id' => $process['id']]);
        $this->createRisk(['name' => 'High Risk', 'subprocess_id' => $subprocess['id'], 'severity' => 'High']);
        $this->createRisk(['name' => 'Low Risk', 'subprocess_id' => $subprocess['id'], 'severity' => 'Low']);

        $response = $this->get('/api/risks', $this->authHeader($token), ['severity' => 'High']);

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(200);

        foreach ($data['data'] as $risk) {
            expect($risk['severity'])->toBe('High');
        }
    });

    test('requires authentication', function () {
        $response = $this->get('/api/risks');

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(401)
            ->and($data['error'])->toBe('Unauthorized');
    });
});

describe('GET /api/risks/{id}', function () {
    test('returns risk with controls', function () {
        $token = $this->createUserWithToken('viewer@example.com', 'Viewer', 'password123', 'Viewer');

        $company = $this->createCompany(['name' => 'Test Company']);
        $process = $this->createProcess(['name' => 'Test Process', 'company_id' => $company['id']]);
        $subprocess = $this->createSubprocess(['name' => 'Test Subprocess', 'process_id' => $process['id']]);
        $risk = $this->createRisk(['name' => 'Test Risk', 'subprocess_id' => $subprocess['id']]);

        $response = $this->get("/api/risks/{$risk['id']}", $this->authHeader($token));

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(200)
            ->and($data['id'])->toBe($risk['id'])
            ->and($data['name'])->toBe('Test Risk')
            ->and($data)->toHaveKey('controls')
            ->and($data)->toHaveKey('subprocess');
    });

    test('returns 404 for non-existent risk', function () {
        $token = $this->createUserWithToken('viewer@example.com', 'Viewer', 'password123', 'Viewer');

        $response = $this->get('/api/risks/non-existent-id', $this->authHeader($token));

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(404)
            ->and($data['error'])->toBe(true);
    });
});

describe('POST /api/manage/risks', function () {
    test('Admin can create risk', function () {
        $token = $this->createUserWithToken('admin@example.com', 'Admin', 'password123', 'Admin');

        $company = $this->createCompany(['name' => 'Test Company']);
        $process = $this->createProcess(['name' => 'Test Process', 'company_id' => $company['id']]);
        $subprocess = $this->createSubprocess(['name' => 'Test Subprocess', 'process_id' => $process['id']]);

        $response = $this->post('/api/manage/risks', [
            'subprocess_id' => $subprocess['id'],
            'name' => 'New Risk',
            'description' => 'Test risk description',
            'severity' => 'High',
            'likelihood' => 'Medium',
            'impact' => 'High',
        ], $this->authHeader($token));

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(201)
            ->and($data['message'])->toBe('Risk created successfully')
            ->and($data['risk']['name'])->toBe('New Risk');

        // Verify in database
        $risk = Risk::where('name', 'New Risk')->first();
        expect($risk)->not->toBeNull()
            ->and($risk->subprocess_id)->toBe($subprocess['id'])
            ->and($risk->severity)->toBe('High');
    });

    test('Manager can create risk', function () {
        $token = $this->createUserWithToken('manager@example.com', 'Manager', 'password123', 'Manager');

        $company = $this->createCompany(['name' => 'Test Company']);
        $process = $this->createProcess(['name' => 'Test Process', 'company_id' => $company['id']]);
        $subprocess = $this->createSubprocess(['name' => 'Test Subprocess', 'process_id' => $process['id']]);

        $response = $this->post('/api/manage/risks', [
            'subprocess_id' => $subprocess['id'],
            'name' => 'Manager Risk',
            'description' => 'Test',
            'severity' => 'Medium',
        ], $this->authHeader($token));

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(201)
            ->and($data['message'])->toBe('Risk created successfully');
    });

    test('Tester cannot create risk', function () {
        $token = $this->createUserWithToken('tester@example.com', 'Tester', 'password123', 'Tester');

        $company = $this->createCompany(['name' => 'Test Company']);
        $process = $this->createProcess(['name' => 'Test Process', 'company_id' => $company['id']]);
        $subprocess = $this->createSubprocess(['name' => 'Test Subprocess', 'process_id' => $process['id']]);

        $response = $this->post('/api/manage/risks', [
            'subprocess_id' => $subprocess['id'],
            'name' => 'Test Risk',
            'severity' => 'Low',
        ], $this->authHeader($token));

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(403)
            ->and($data['error'])->toBe('Forbidden');
    });

    test('Viewer cannot create risk', function () {
        $token = $this->createUserWithToken('viewer@example.com', 'Viewer', 'password123', 'Viewer');

        $company = $this->createCompany(['name' => 'Test Company']);
        $process = $this->createProcess(['name' => 'Test Process', 'company_id' => $company['id']]);
        $subprocess = $this->createSubprocess(['name' => 'Test Subprocess', 'process_id' => $process['id']]);

        $response = $this->post('/api/manage/risks', [
            'subprocess_id' => $subprocess['id'],
            'name' => 'Test Risk',
            'severity' => 'Low',
        ], $this->authHeader($token));

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(403)
            ->and($data['error'])->toBe('Forbidden');
    });

    test('validates required fields', function () {
        $token = $this->createUserWithToken('admin@example.com', 'Admin', 'password123', 'Admin');

        $response = $this->post('/api/manage/risks', [
            'name' => 'Incomplete Risk',
            // Missing subprocess_id
        ], $this->authHeader($token));

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(400)
            ->and($data['error'])->toBe(true);
    });

    test('validates subprocess exists', function () {
        $token = $this->createUserWithToken('admin@example.com', 'Admin', 'password123', 'Admin');

        $response = $this->post('/api/manage/risks', [
            'subprocess_id' => 'non-existent-subprocess-id',
            'name' => 'Test Risk',
            'severity' => 'Low',
        ], $this->authHeader($token));

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(400)
            ->and($data['error'])->toBe(true);
    });

    test('validates severity enum', function () {
        $token = $this->createUserWithToken('admin@example.com', 'Admin', 'password123', 'Admin');

        $company = $this->createCompany(['name' => 'Test Company']);
        $process = $this->createProcess(['name' => 'Test Process', 'company_id' => $company['id']]);
        $subprocess = $this->createSubprocess(['name' => 'Test Subprocess', 'process_id' => $process['id']]);

        $response = $this->post('/api/manage/risks', [
            'subprocess_id' => $subprocess['id'],
            'name' => 'Test Risk',
            'severity' => 'InvalidSeverity',
        ], $this->authHeader($token));

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(400)
            ->and($data['error'])->toBe(true);
    });
});

describe('PUT /api/manage/risks/{id}', function () {
    test('Admin can update risk', function () {
        $token = $this->createUserWithToken('admin@example.com', 'Admin', 'password123', 'Admin');

        $company = $this->createCompany(['name' => 'Test Company']);
        $process = $this->createProcess(['name' => 'Test Process', 'company_id' => $company['id']]);
        $subprocess = $this->createSubprocess(['name' => 'Test Subprocess', 'process_id' => $process['id']]);
        $risk = $this->createRisk(['name' => 'Original Risk', 'subprocess_id' => $subprocess['id']]);

        $response = $this->put("/api/manage/risks/{$risk['id']}", [
            'name' => 'Updated Risk',
            'description' => 'Updated description',
            'severity' => 'High',
        ], $this->authHeader($token));

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(200)
            ->and($data['message'])->toBe('Risk updated successfully')
            ->and($data['risk']['name'])->toBe('Updated Risk');

        // Verify in database
        $updated = Risk::find($risk['id']);
        expect($updated->name)->toBe('Updated Risk')
            ->and($updated->severity)->toBe('High');
    });

    test('Manager can update risk', function () {
        $token = $this->createUserWithToken('manager@example.com', 'Manager', 'password123', 'Manager');

        $company = $this->createCompany(['name' => 'Test Company']);
        $process = $this->createProcess(['name' => 'Test Process', 'company_id' => $company['id']]);
        $subprocess = $this->createSubprocess(['name' => 'Test Subprocess', 'process_id' => $process['id']]);
        $risk = $this->createRisk(['name' => 'Original Risk', 'subprocess_id' => $subprocess['id']]);

        $response = $this->put("/api/manage/risks/{$risk['id']}", [
            'name' => 'Manager Updated',
        ], $this->authHeader($token));

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(200)
            ->and($data['message'])->toBe('Risk updated successfully');
    });

    test('Tester cannot update risk', function () {
        $token = $this->createUserWithToken('tester@example.com', 'Tester', 'password123', 'Tester');

        $company = $this->createCompany(['name' => 'Test Company']);
        $process = $this->createProcess(['name' => 'Test Process', 'company_id' => $company['id']]);
        $subprocess = $this->createSubprocess(['name' => 'Test Subprocess', 'process_id' => $process['id']]);
        $risk = $this->createRisk(['name' => 'Test Risk', 'subprocess_id' => $subprocess['id']]);

        $response = $this->put("/api/manage/risks/{$risk['id']}", [
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
        $subprocess = $this->createSubprocess(['name' => 'Test Subprocess', 'process_id' => $process['id']]);
        $risk = $this->createRisk([
            'name' => 'Original Name',
            'description' => 'Original Description',
            'subprocess_id' => $subprocess['id'],
            'severity' => 'Low',
        ]);

        $response = $this->put("/api/manage/risks/{$risk['id']}", [
            'severity' => 'High',
        ], $this->authHeader($token));

        $updated = Risk::find($risk['id']);

        expect($response->getStatusCode())->toBe(200)
            ->and($updated->name)->toBe('Original Name')
            ->and($updated->severity)->toBe('High');
    });
});

describe('DELETE /api/manage/risks/{id}', function () {
    test('Admin can delete risk', function () {
        $token = $this->createUserWithToken('admin@example.com', 'Admin', 'password123', 'Admin');

        $company = $this->createCompany(['name' => 'Test Company']);
        $process = $this->createProcess(['name' => 'Test Process', 'company_id' => $company['id']]);
        $subprocess = $this->createSubprocess(['name' => 'Test Subprocess', 'process_id' => $process['id']]);
        $risk = $this->createRisk(['name' => 'Risk to Delete', 'subprocess_id' => $subprocess['id']]);

        $response = $this->delete("/api/manage/risks/{$risk['id']}", $this->authHeader($token));

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(200)
            ->and($data['message'])->toBe('Risk deleted successfully');

        // Verify deleted from database
        $deleted = Risk::find($risk['id']);
        expect($deleted)->toBeNull();
    });

    test('Manager can delete risk', function () {
        $token = $this->createUserWithToken('manager@example.com', 'Manager', 'password123', 'Manager');

        $company = $this->createCompany(['name' => 'Test Company']);
        $process = $this->createProcess(['name' => 'Test Process', 'company_id' => $company['id']]);
        $subprocess = $this->createSubprocess(['name' => 'Test Subprocess', 'process_id' => $process['id']]);
        $risk = $this->createRisk(['name' => 'Manager Delete', 'subprocess_id' => $subprocess['id']]);

        $response = $this->delete("/api/manage/risks/{$risk['id']}", $this->authHeader($token));

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(200)
            ->and($data['message'])->toBe('Risk deleted successfully');
    });

    test('Tester cannot delete risk', function () {
        $token = $this->createUserWithToken('tester@example.com', 'Tester', 'password123', 'Tester');

        $company = $this->createCompany(['name' => 'Test Company']);
        $process = $this->createProcess(['name' => 'Test Process', 'company_id' => $company['id']]);
        $subprocess = $this->createSubprocess(['name' => 'Test Subprocess', 'process_id' => $process['id']]);
        $risk = $this->createRisk(['name' => 'Test Risk', 'subprocess_id' => $subprocess['id']]);

        $response = $this->delete("/api/manage/risks/{$risk['id']}", $this->authHeader($token));

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(403)
            ->and($data['error'])->toBe('Forbidden');
    });

    test('Viewer cannot delete risk', function () {
        $token = $this->createUserWithToken('viewer@example.com', 'Viewer', 'password123', 'Viewer');

        $company = $this->createCompany(['name' => 'Test Company']);
        $process = $this->createProcess(['name' => 'Test Process', 'company_id' => $company['id']]);
        $subprocess = $this->createSubprocess(['name' => 'Test Subprocess', 'process_id' => $process['id']]);
        $risk = $this->createRisk(['name' => 'Test Risk', 'subprocess_id' => $subprocess['id']]);

        $response = $this->delete("/api/manage/risks/{$risk['id']}", $this->authHeader($token));

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(403)
            ->and($data['error'])->toBe('Forbidden');
    });
});
