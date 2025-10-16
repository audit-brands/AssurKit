<?php

declare(strict_types=1);

use AssurKit\Models\RiskControlAssignment;
use AssurKit\Tests\Integration\IntegrationTestCase;

uses(IntegrationTestCase::class);

describe('POST /api/manage/risk-control-matrix/assign', function () {
    test('Admin can assign control to risk', function () {
        $token = $this->createUserWithToken('admin@example.com', 'Admin', 'password123', 'Admin');

        $company = $this->createCompany(['name' => 'Test Company']);
        $process = $this->createProcess(['name' => 'Test Process', 'company_id' => $company['id']]);
        $subprocess = $this->createSubprocess(['name' => 'Test Subprocess', 'process_id' => $process['id']]);
        $risk = $this->createRisk(['name' => 'Test Risk', 'subprocess_id' => $subprocess['id']]);
        $control = $this->createControl(['name' => 'Test Control']);

        $response = $this->post('/api/manage/risk-control-matrix/assign', [
            'risk_id' => $risk['id'],
            'control_id' => $control['id'],
            'effectiveness_rating' => 'Effective',
            'notes' => 'Control effectively mitigates this risk',
        ], $this->authHeader($token));

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(201)
            ->and($data['message'])->toBe('Control assigned to risk successfully')
            ->and($data['assignment']['effectiveness_rating'])->toBe('Effective');

        // Verify in database
        $assignment = RiskControlAssignment::where('risk_id', $risk['id'])
            ->where('control_id', $control['id'])
            ->first();
        expect($assignment)->not->toBeNull();
    });

    test('Manager can assign control to risk', function () {
        $token = $this->createUserWithToken('manager@example.com', 'Manager', 'password123', 'Manager');

        $company = $this->createCompany(['name' => 'Test Company']);
        $process = $this->createProcess(['name' => 'Test Process', 'company_id' => $company['id']]);
        $subprocess = $this->createSubprocess(['name' => 'Test Subprocess', 'process_id' => $process['id']]);
        $risk = $this->createRisk(['name' => 'Test Risk', 'subprocess_id' => $subprocess['id']]);
        $control = $this->createControl(['name' => 'Test Control']);

        $response = $this->post('/api/manage/risk-control-matrix/assign', [
            'risk_id' => $risk['id'],
            'control_id' => $control['id'],
            'effectiveness_rating' => 'Partially Effective',
        ], $this->authHeader($token));

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(201)
            ->and($data['message'])->toBe('Control assigned to risk successfully');
    });

    test('Tester cannot assign control to risk', function () {
        $token = $this->createUserWithToken('tester@example.com', 'Tester', 'password123', 'Tester');

        $company = $this->createCompany(['name' => 'Test Company']);
        $process = $this->createProcess(['name' => 'Test Process', 'company_id' => $company['id']]);
        $subprocess = $this->createSubprocess(['name' => 'Test Subprocess', 'process_id' => $process['id']]);
        $risk = $this->createRisk(['name' => 'Test Risk', 'subprocess_id' => $subprocess['id']]);
        $control = $this->createControl(['name' => 'Test Control']);

        $response = $this->post('/api/manage/risk-control-matrix/assign', [
            'risk_id' => $risk['id'],
            'control_id' => $control['id'],
        ], $this->authHeader($token));

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(403)
            ->and($data['error'])->toBe('Forbidden');
    });

    test('Viewer cannot assign control to risk', function () {
        $token = $this->createUserWithToken('viewer@example.com', 'Viewer', 'password123', 'Viewer');

        $company = $this->createCompany(['name' => 'Test Company']);
        $process = $this->createProcess(['name' => 'Test Process', 'company_id' => $company['id']]);
        $subprocess = $this->createSubprocess(['name' => 'Test Subprocess', 'process_id' => $process['id']]);
        $risk = $this->createRisk(['name' => 'Test Risk', 'subprocess_id' => $subprocess['id']]);
        $control = $this->createControl(['name' => 'Test Control']);

        $response = $this->post('/api/manage/risk-control-matrix/assign', [
            'risk_id' => $risk['id'],
            'control_id' => $control['id'],
        ], $this->authHeader($token));

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(403)
            ->and($data['error'])->toBe('Forbidden');
    });

    test('validates required fields', function () {
        $token = $this->createUserWithToken('admin@example.com', 'Admin', 'password123', 'Admin');

        $response = $this->post('/api/manage/risk-control-matrix/assign', [
            'risk_id' => 'some-risk-id',
            // Missing control_id
        ], $this->authHeader($token));

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(400)
            ->and($data['error'])->toBe(true);
    });

    test('validates risk exists', function () {
        $token = $this->createUserWithToken('admin@example.com', 'Admin', 'password123', 'Admin');

        $control = $this->createControl(['name' => 'Test Control']);

        $response = $this->post('/api/manage/risk-control-matrix/assign', [
            'risk_id' => 'non-existent-risk-id',
            'control_id' => $control['id'],
        ], $this->authHeader($token));

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(400)
            ->and($data['error'])->toBe(true);
    });

    test('validates control exists', function () {
        $token = $this->createUserWithToken('admin@example.com', 'Admin', 'password123', 'Admin');

        $company = $this->createCompany(['name' => 'Test Company']);
        $process = $this->createProcess(['name' => 'Test Process', 'company_id' => $company['id']]);
        $subprocess = $this->createSubprocess(['name' => 'Test Subprocess', 'process_id' => $process['id']]);
        $risk = $this->createRisk(['name' => 'Test Risk', 'subprocess_id' => $subprocess['id']]);

        $response = $this->post('/api/manage/risk-control-matrix/assign', [
            'risk_id' => $risk['id'],
            'control_id' => 'non-existent-control-id',
        ], $this->authHeader($token));

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(400)
            ->and($data['error'])->toBe(true);
    });

    test('validates effectiveness rating enum', function () {
        $token = $this->createUserWithToken('admin@example.com', 'Admin', 'password123', 'Admin');

        $company = $this->createCompany(['name' => 'Test Company']);
        $process = $this->createProcess(['name' => 'Test Process', 'company_id' => $company['id']]);
        $subprocess = $this->createSubprocess(['name' => 'Test Subprocess', 'process_id' => $process['id']]);
        $risk = $this->createRisk(['name' => 'Test Risk', 'subprocess_id' => $subprocess['id']]);
        $control = $this->createControl(['name' => 'Test Control']);

        $response = $this->post('/api/manage/risk-control-matrix/assign', [
            'risk_id' => $risk['id'],
            'control_id' => $control['id'],
            'effectiveness_rating' => 'InvalidRating',
        ], $this->authHeader($token));

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(400)
            ->and($data['error'])->toBe(true);
    });

    test('prevents duplicate assignment', function () {
        $token = $this->createUserWithToken('admin@example.com', 'Admin', 'password123', 'Admin');

        $company = $this->createCompany(['name' => 'Test Company']);
        $process = $this->createProcess(['name' => 'Test Process', 'company_id' => $company['id']]);
        $subprocess = $this->createSubprocess(['name' => 'Test Subprocess', 'process_id' => $process['id']]);
        $risk = $this->createRisk(['name' => 'Test Risk', 'subprocess_id' => $subprocess['id']]);
        $control = $this->createControl(['name' => 'Test Control']);

        // First assignment
        $this->post('/api/manage/risk-control-matrix/assign', [
            'risk_id' => $risk['id'],
            'control_id' => $control['id'],
            'effectiveness_rating' => 'Effective',
        ], $this->authHeader($token));

        // Duplicate assignment
        $response = $this->post('/api/manage/risk-control-matrix/assign', [
            'risk_id' => $risk['id'],
            'control_id' => $control['id'],
            'effectiveness_rating' => 'Effective',
        ], $this->authHeader($token));

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(409)
            ->and($data['error'])->toBe(true);
    });
});

describe('PUT /api/manage/risk-control-matrix/update', function () {
    test('Admin can update assignment', function () {
        $token = $this->createUserWithToken('admin@example.com', 'Admin', 'password123', 'Admin');

        $company = $this->createCompany(['name' => 'Test Company']);
        $process = $this->createProcess(['name' => 'Test Process', 'company_id' => $company['id']]);
        $subprocess = $this->createSubprocess(['name' => 'Test Subprocess', 'process_id' => $process['id']]);
        $risk = $this->createRisk(['name' => 'Test Risk', 'subprocess_id' => $subprocess['id']]);
        $control = $this->createControl(['name' => 'Test Control']);

        // Create assignment
        $this->post('/api/manage/risk-control-matrix/assign', [
            'risk_id' => $risk['id'],
            'control_id' => $control['id'],
            'effectiveness_rating' => 'Partially Effective',
        ], $this->authHeader($token));

        // Update assignment
        $response = $this->put('/api/manage/risk-control-matrix/update', [
            'risk_id' => $risk['id'],
            'control_id' => $control['id'],
            'effectiveness_rating' => 'Effective',
            'notes' => 'Updated effectiveness rating after review',
        ], $this->authHeader($token));

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(200)
            ->and($data['message'])->toBe('Assignment updated successfully')
            ->and($data['assignment']['effectiveness_rating'])->toBe('Effective');

        // Verify in database
        $assignment = RiskControlAssignment::where('risk_id', $risk['id'])
            ->where('control_id', $control['id'])
            ->first();
        expect($assignment->effectiveness_rating)->toBe('Effective');
    });

    test('Manager can update assignment', function () {
        $token = $this->createUserWithToken('manager@example.com', 'Manager', 'password123', 'Manager');

        $company = $this->createCompany(['name' => 'Test Company']);
        $process = $this->createProcess(['name' => 'Test Process', 'company_id' => $company['id']]);
        $subprocess = $this->createSubprocess(['name' => 'Test Subprocess', 'process_id' => $process['id']]);
        $risk = $this->createRisk(['name' => 'Test Risk', 'subprocess_id' => $subprocess['id']]);
        $control = $this->createControl(['name' => 'Test Control']);

        // Create assignment
        $this->post('/api/manage/risk-control-matrix/assign', [
            'risk_id' => $risk['id'],
            'control_id' => $control['id'],
            'effectiveness_rating' => 'Not Effective',
        ], $this->authHeader($token));

        // Update assignment
        $response = $this->put('/api/manage/risk-control-matrix/update', [
            'risk_id' => $risk['id'],
            'control_id' => $control['id'],
            'effectiveness_rating' => 'Partially Effective',
        ], $this->authHeader($token));

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(200)
            ->and($data['message'])->toBe('Assignment updated successfully');
    });

    test('Tester cannot update assignment', function () {
        $token = $this->createUserWithToken('tester@example.com', 'Tester', 'password123', 'Tester');

        $company = $this->createCompany(['name' => 'Test Company']);
        $process = $this->createProcess(['name' => 'Test Process', 'company_id' => $company['id']]);
        $subprocess = $this->createSubprocess(['name' => 'Test Subprocess', 'process_id' => $process['id']]);
        $risk = $this->createRisk(['name' => 'Test Risk', 'subprocess_id' => $subprocess['id']]);
        $control = $this->createControl(['name' => 'Test Control']);

        // Create assignment as admin
        $adminToken = $this->createUserWithToken('admin@example.com', 'Admin', 'password123', 'Admin');
        $this->post('/api/manage/risk-control-matrix/assign', [
            'risk_id' => $risk['id'],
            'control_id' => $control['id'],
            'effectiveness_rating' => 'Effective',
        ], $this->authHeader($adminToken));

        // Try to update as tester
        $response = $this->put('/api/manage/risk-control-matrix/update', [
            'risk_id' => $risk['id'],
            'control_id' => $control['id'],
            'effectiveness_rating' => 'Not Effective',
        ], $this->authHeader($token));

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(403)
            ->and($data['error'])->toBe('Forbidden');
    });

    test('returns 404 for non-existent assignment', function () {
        $token = $this->createUserWithToken('admin@example.com', 'Admin', 'password123', 'Admin');

        $company = $this->createCompany(['name' => 'Test Company']);
        $process = $this->createProcess(['name' => 'Test Process', 'company_id' => $company['id']]);
        $subprocess = $this->createSubprocess(['name' => 'Test Subprocess', 'process_id' => $process['id']]);
        $risk = $this->createRisk(['name' => 'Test Risk', 'subprocess_id' => $subprocess['id']]);
        $control = $this->createControl(['name' => 'Test Control']);

        $response = $this->put('/api/manage/risk-control-matrix/update', [
            'risk_id' => $risk['id'],
            'control_id' => $control['id'],
            'effectiveness_rating' => 'Effective',
        ], $this->authHeader($token));

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(404)
            ->and($data['error'])->toBe(true);
    });
});

describe('DELETE /api/manage/risk-control-matrix/remove', function () {
    test('Admin can remove assignment', function () {
        $token = $this->createUserWithToken('admin@example.com', 'Admin', 'password123', 'Admin');

        $company = $this->createCompany(['name' => 'Test Company']);
        $process = $this->createProcess(['name' => 'Test Process', 'company_id' => $company['id']]);
        $subprocess = $this->createSubprocess(['name' => 'Test Subprocess', 'process_id' => $process['id']]);
        $risk = $this->createRisk(['name' => 'Test Risk', 'subprocess_id' => $subprocess['id']]);
        $control = $this->createControl(['name' => 'Test Control']);

        // Create assignment
        $this->post('/api/manage/risk-control-matrix/assign', [
            'risk_id' => $risk['id'],
            'control_id' => $control['id'],
            'effectiveness_rating' => 'Effective',
        ], $this->authHeader($token));

        // Remove assignment
        $response = $this->delete('/api/manage/risk-control-matrix/remove', $this->authHeader($token), [
            'risk_id' => $risk['id'],
            'control_id' => $control['id'],
        ]);

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(200)
            ->and($data['message'])->toBe('Assignment removed successfully');

        // Verify removed from database
        $assignment = RiskControlAssignment::where('risk_id', $risk['id'])
            ->where('control_id', $control['id'])
            ->first();
        expect($assignment)->toBeNull();
    });

    test('Manager can remove assignment', function () {
        $token = $this->createUserWithToken('manager@example.com', 'Manager', 'password123', 'Manager');

        $company = $this->createCompany(['name' => 'Test Company']);
        $process = $this->createProcess(['name' => 'Test Process', 'company_id' => $company['id']]);
        $subprocess = $this->createSubprocess(['name' => 'Test Subprocess', 'process_id' => $process['id']]);
        $risk = $this->createRisk(['name' => 'Test Risk', 'subprocess_id' => $subprocess['id']]);
        $control = $this->createControl(['name' => 'Test Control']);

        // Create assignment
        $this->post('/api/manage/risk-control-matrix/assign', [
            'risk_id' => $risk['id'],
            'control_id' => $control['id'],
            'effectiveness_rating' => 'Effective',
        ], $this->authHeader($token));

        // Remove assignment
        $response = $this->delete('/api/manage/risk-control-matrix/remove', $this->authHeader($token), [
            'risk_id' => $risk['id'],
            'control_id' => $control['id'],
        ]);

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(200)
            ->and($data['message'])->toBe('Assignment removed successfully');
    });

    test('Tester cannot remove assignment', function () {
        $token = $this->createUserWithToken('tester@example.com', 'Tester', 'password123', 'Tester');

        $company = $this->createCompany(['name' => 'Test Company']);
        $process = $this->createProcess(['name' => 'Test Process', 'company_id' => $company['id']]);
        $subprocess = $this->createSubprocess(['name' => 'Test Subprocess', 'process_id' => $process['id']]);
        $risk = $this->createRisk(['name' => 'Test Risk', 'subprocess_id' => $subprocess['id']]);
        $control = $this->createControl(['name' => 'Test Control']);

        // Create assignment as admin
        $adminToken = $this->createUserWithToken('admin@example.com', 'Admin', 'password123', 'Admin');
        $this->post('/api/manage/risk-control-matrix/assign', [
            'risk_id' => $risk['id'],
            'control_id' => $control['id'],
            'effectiveness_rating' => 'Effective',
        ], $this->authHeader($adminToken));

        // Try to remove as tester
        $response = $this->delete('/api/manage/risk-control-matrix/remove', $this->authHeader($token), [
            'risk_id' => $risk['id'],
            'control_id' => $control['id'],
        ]);

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(403)
            ->and($data['error'])->toBe('Forbidden');
    });

    test('Viewer cannot remove assignment', function () {
        $token = $this->createUserWithToken('viewer@example.com', 'Viewer', 'password123', 'Viewer');

        $company = $this->createCompany(['name' => 'Test Company']);
        $process = $this->createProcess(['name' => 'Test Process', 'company_id' => $company['id']]);
        $subprocess = $this->createSubprocess(['name' => 'Test Subprocess', 'process_id' => $process['id']]);
        $risk = $this->createRisk(['name' => 'Test Risk', 'subprocess_id' => $subprocess['id']]);
        $control = $this->createControl(['name' => 'Test Control']);

        // Create assignment as admin
        $adminToken = $this->createUserWithToken('admin@example.com', 'Admin', 'password123', 'Admin');
        $this->post('/api/manage/risk-control-matrix/assign', [
            'risk_id' => $risk['id'],
            'control_id' => $control['id'],
            'effectiveness_rating' => 'Effective',
        ], $this->authHeader($adminToken));

        // Try to remove as viewer
        $response = $this->delete('/api/manage/risk-control-matrix/remove', $this->authHeader($token), [
            'risk_id' => $risk['id'],
            'control_id' => $control['id'],
        ]);

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(403)
            ->and($data['error'])->toBe('Forbidden');
    });

    test('returns 404 for non-existent assignment', function () {
        $token = $this->createUserWithToken('admin@example.com', 'Admin', 'password123', 'Admin');

        $company = $this->createCompany(['name' => 'Test Company']);
        $process = $this->createProcess(['name' => 'Test Process', 'company_id' => $company['id']]);
        $subprocess = $this->createSubprocess(['name' => 'Test Subprocess', 'process_id' => $process['id']]);
        $risk = $this->createRisk(['name' => 'Test Risk', 'subprocess_id' => $subprocess['id']]);
        $control = $this->createControl(['name' => 'Test Control']);

        $response = $this->delete('/api/manage/risk-control-matrix/remove', $this->authHeader($token), [
            'risk_id' => $risk['id'],
            'control_id' => $control['id'],
        ]);

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(404)
            ->and($data['error'])->toBe(true);
    });
});

describe('GET /api/risk-control-matrix/effectiveness-report', function () {
    test('returns effectiveness summary report', function () {
        $token = $this->createUserWithToken('viewer@example.com', 'Viewer', 'password123', 'Viewer');

        $company = $this->createCompany(['name' => 'Test Company']);
        $process = $this->createProcess(['name' => 'Test Process', 'company_id' => $company['id']]);
        $subprocess = $this->createSubprocess(['name' => 'Test Subprocess', 'process_id' => $process['id']]);
        $risk = $this->createRisk(['name' => 'Test Risk', 'subprocess_id' => $subprocess['id']]);
        $control = $this->createControl(['name' => 'Test Control']);

        // Create assignment
        $adminToken = $this->createUserWithToken('admin@example.com', 'Admin', 'password123', 'Admin');
        $this->post('/api/manage/risk-control-matrix/assign', [
            'risk_id' => $risk['id'],
            'control_id' => $control['id'],
            'effectiveness_rating' => 'Effective',
        ], $this->authHeader($adminToken));

        $response = $this->get('/api/risk-control-matrix/effectiveness-report', $this->authHeader($token));

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(200)
            ->and($data)->toHaveKey('summary')
            ->and($data)->toHaveKey('by_subprocess')
            ->and($data)->toHaveKey('by_process');
    });

    test('requires authentication', function () {
        $response = $this->get('/api/risk-control-matrix/effectiveness-report');

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(401)
            ->and($data['error'])->toBe('Unauthorized');
    });
});
