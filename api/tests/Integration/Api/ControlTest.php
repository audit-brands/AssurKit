<?php

declare(strict_types=1);

use AssurKit\Models\Control;
use AssurKit\Models\Risk;
use AssurKit\Tests\Integration\IntegrationTestCase;

uses(IntegrationTestCase::class);

describe('GET /api/controls', function () {
    test('returns paginated controls list', function () {
        $token = $this->createUserWithToken('viewer@example.com', 'Viewer', 'password123', 'Viewer');

        $this->createControl(['name' => 'Control A']);
        $this->createControl(['name' => 'Control B']);

        $response = $this->get('/api/controls', $this->authHeader($token));

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(200)
            ->and($data)->toHaveKey('data')
            ->and($data)->toHaveKey('pagination')
            ->and($data)->toHaveKey('filters')
            ->and(count($data['data']))->toBeGreaterThanOrEqual(2);
    });

    test('supports search filtering', function () {
        $token = $this->createUserWithToken('viewer@example.com', 'Viewer', 'password123', 'Viewer');

        $this->createControl(['name' => 'Access Control System']);
        $this->createControl(['name' => 'Segregation of Duties']);

        $response = $this->get('/api/controls', $this->authHeader($token), ['search' => 'Access']);

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(200)
            ->and(count($data['data']))->toBeGreaterThanOrEqual(1);
    });

    test('filters by control type', function () {
        $token = $this->createUserWithToken('viewer@example.com', 'Viewer', 'password123', 'Viewer');

        $this->createControl(['name' => 'Preventive Control', 'control_type' => 'Preventive']);
        $this->createControl(['name' => 'Detective Control', 'control_type' => 'Detective']);

        $response = $this->get('/api/controls', $this->authHeader($token), ['control_type' => 'Preventive']);

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(200)
            ->and(count($data['data']))->toBeGreaterThanOrEqual(1);

        foreach ($data['data'] as $control) {
            expect($control['control_type'])->toBe('Preventive');
        }
    });

    test('filters by key control status', function () {
        $token = $this->createUserWithToken('viewer@example.com', 'Viewer', 'password123', 'Viewer');

        $this->createControl(['name' => 'Key Control', 'is_key_control' => true]);
        $this->createControl(['name' => 'Non-Key Control', 'is_key_control' => false]);

        $response = $this->get('/api/controls', $this->authHeader($token), ['is_key_control' => '1']);

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(200);

        foreach ($data['data'] as $control) {
            expect($control['is_key_control'])->toBeTrue();
        }
    });

    test('includes calculated fields in response', function () {
        $token = $this->createUserWithToken('viewer@example.com', 'Viewer', 'password123', 'Viewer');

        $this->createControl([
            'name' => 'Daily Automated Control',
            'frequency' => 'Daily',
            'automation_level' => 'Automated',
        ]);

        $response = $this->get('/api/controls', $this->authHeader($token));

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(200);

        $control = $data['data'][0];
        expect($control)->toHaveKey('frequency_weight')
            ->and($control)->toHaveKey('automation_score');
    });
});

describe('GET /api/controls/{id}', function () {
    test('returns control with risk associations', function () {
        $token = $this->createUserWithToken('viewer@example.com', 'Viewer', 'password123', 'Viewer');

        $control = $this->createControl(['name' => 'Test Control']);

        $response = $this->get("/api/controls/{$control['id']}", $this->authHeader($token));

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(200)
            ->and($data['id'])->toBe($control['id'])
            ->and($data['name'])->toBe('Test Control')
            ->and($data)->toHaveKey('risks')
            ->and($data)->toHaveKey('available_options');
    });

    test('returns 404 for non-existent control', function () {
        $token = $this->createUserWithToken('viewer@example.com', 'Viewer', 'password123', 'Viewer');

        $response = $this->get('/api/controls/non-existent-id', $this->authHeader($token));

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(404)
            ->and($data['error'])->toBe(true);
    });
});

describe('POST /api/manage/controls', function () {
    test('Admin can create control', function () {
        $token = $this->createUserWithToken('admin@example.com', 'Admin', 'password123', 'Admin');

        $response = $this->post('/api/manage/controls', [
            'name' => 'New Control',
            'description' => 'Test control description',
            'control_type' => 'Preventive',
            'frequency' => 'Monthly',
            'automation_level' => 'Manual',
            'is_key_control' => true,
            'owner_email' => 'owner@example.com',
        ], $this->authHeader($token));

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(201)
            ->and($data['message'])->toBe('Control created successfully')
            ->and($data['control']['name'])->toBe('New Control')
            ->and($data['control'])->toHaveKey('control_id'); // Auto-generated business ID

        // Verify in database
        $control = Control::where('name', 'New Control')->first();
        expect($control)->not->toBeNull()
            ->and($control->control_type)->toBe('Preventive');
    });

    test('Manager can create control', function () {
        $token = $this->createUserWithToken('manager@example.com', 'Manager', 'password123', 'Manager');

        $response = $this->post('/api/manage/controls', [
            'name' => 'Manager Control',
            'description' => 'Test',
            'control_type' => 'Detective',
            'frequency' => 'Quarterly',
            'automation_level' => 'Automated',
            'owner_email' => 'owner@example.com',
        ], $this->authHeader($token));

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(201)
            ->and($data['message'])->toBe('Control created successfully');
    });

    test('Tester can create control', function () {
        $token = $this->createUserWithToken('tester@example.com', 'Tester', 'password123', 'Tester');

        $response = $this->post('/api/manage/controls', [
            'name' => 'Tester Control',
            'description' => 'Test',
            'control_type' => 'Corrective',
            'frequency' => 'Annual',
            'automation_level' => 'Manual',
            'owner_email' => 'owner@example.com',
        ], $this->authHeader($token));

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(201)
            ->and($data['message'])->toBe('Control created successfully');
    });

    test('Viewer cannot create control', function () {
        $token = $this->createUserWithToken('viewer@example.com', 'Viewer', 'password123', 'Viewer');

        $response = $this->post('/api/manage/controls', [
            'name' => 'Test Control',
            'control_type' => 'Preventive',
            'frequency' => 'Monthly',
            'automation_level' => 'Manual',
            'owner_email' => 'owner@example.com',
        ], $this->authHeader($token));

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(403)
            ->and($data['error'])->toBe('Forbidden');
    });

    test('validates required fields', function () {
        $token = $this->createUserWithToken('admin@example.com', 'Admin', 'password123', 'Admin');

        $response = $this->post('/api/manage/controls', [
            'name' => 'Incomplete Control',
            // Missing required fields
        ], $this->authHeader($token));

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(400)
            ->and($data['error'])->toBe(true);
    });

    test('validates control type enum', function () {
        $token = $this->createUserWithToken('admin@example.com', 'Admin', 'password123', 'Admin');

        $response = $this->post('/api/manage/controls', [
            'name' => 'Invalid Control',
            'description' => 'Test',
            'control_type' => 'InvalidType',
            'frequency' => 'Monthly',
            'automation_level' => 'Manual',
            'owner_email' => 'owner@example.com',
        ], $this->authHeader($token));

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(400)
            ->and($data['error'])->toBe(true);
    });

    test('validates email format', function () {
        $token = $this->createUserWithToken('admin@example.com', 'Admin', 'password123', 'Admin');

        $response = $this->post('/api/manage/controls', [
            'name' => 'Invalid Email Control',
            'description' => 'Test',
            'control_type' => 'Preventive',
            'frequency' => 'Monthly',
            'automation_level' => 'Manual',
            'owner_email' => 'not-an-email',
        ], $this->authHeader($token));

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(400)
            ->and($data['error'])->toBe(true);
    });
});

describe('PUT /api/manage/controls/{id}', function () {
    test('Admin can update control', function () {
        $token = $this->createUserWithToken('admin@example.com', 'Admin', 'password123', 'Admin');

        $control = $this->createControl(['name' => 'Original Control']);

        $response = $this->put("/api/manage/controls/{$control['id']}", [
            'name' => 'Updated Control',
            'description' => 'Updated description',
        ], $this->authHeader($token));

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(200)
            ->and($data['message'])->toBe('Control updated successfully')
            ->and($data['control']['name'])->toBe('Updated Control');

        // Verify in database
        $updated = Control::find($control['id']);
        expect($updated->name)->toBe('Updated Control');
    });

    test('supports partial updates', function () {
        $token = $this->createUserWithToken('admin@example.com', 'Admin', 'password123', 'Admin');

        $control = $this->createControl([
            'name' => 'Original Name',
            'frequency' => 'Monthly',
        ]);

        $response = $this->put("/api/manage/controls/{$control['id']}", [
            'frequency' => 'Quarterly',
        ], $this->authHeader($token));

        $updated = Control::find($control['id']);

        expect($response->getStatusCode())->toBe(200)
            ->and($updated->name)->toBe('Original Name')
            ->and($updated->frequency)->toBe('Quarterly');
    });

    test('can change control status', function () {
        $token = $this->createUserWithToken('admin@example.com', 'Admin', 'password123', 'Admin');

        $control = $this->createControl(['status' => 'Draft']);

        $response = $this->put("/api/manage/controls/{$control['id']}", [
            'status' => 'Active',
        ], $this->authHeader($token));

        $updated = Control::find($control['id']);

        expect($response->getStatusCode())->toBe(200)
            ->and($updated->status)->toBe('Active');
    });
});

describe('DELETE /api/manage/controls/{id}', function () {
    test('Admin can delete control', function () {
        $token = $this->createUserWithToken('admin@example.com', 'Admin', 'password123', 'Admin');

        $control = $this->createControl(['name' => 'Control to Delete']);

        $response = $this->delete("/api/manage/controls/{$control['id']}", $this->authHeader($token));

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(200)
            ->and($data['message'])->toBe('Control deleted successfully');

        // Verify deleted from database
        $deleted = Control::find($control['id']);
        expect($deleted)->toBeNull();
    });

    test('Viewer cannot delete control', function () {
        $token = $this->createUserWithToken('viewer@example.com', 'Viewer', 'password123', 'Viewer');

        $control = $this->createControl(['name' => 'Test Control']);

        $response = $this->delete("/api/manage/controls/{$control['id']}", $this->authHeader($token));

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(403)
            ->and($data['error'])->toBe('Forbidden');
    });
});

describe('GET /api/risk-control-matrix', function () {
    test('returns RCM data with risk-control relationships', function () {
        $token = $this->createUserWithToken('viewer@example.com', 'Viewer', 'password123', 'Viewer');

        // Create test data
        $company = $this->createCompany(['name' => 'Test Company']);
        $process = $this->createProcess(['name' => 'Test Process', 'company_id' => $company['id']]);
        $subprocess = $this->createSubprocess(['name' => 'Test Subprocess', 'process_id' => $process['id']]);
        $risk = Risk::create([
            'id' => \Ramsey\Uuid\Uuid::uuid4()->toString(),
            'subprocess_id' => $subprocess['id'],
            'name' => 'Test Risk',
            'description' => 'Test risk description',
        ]);

        $response = $this->get('/api/risk-control-matrix', $this->authHeader($token));

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(200)
            ->and($data)->toHaveKey('data')
            ->and($data)->toHaveKey('pagination')
            ->and($data)->toHaveKey('statistics');
    });

    test('supports filtering by subprocess', function () {
        $token = $this->createUserWithToken('viewer@example.com', 'Viewer', 'password123', 'Viewer');

        $company = $this->createCompany(['name' => 'Test Company']);
        $process = $this->createProcess(['name' => 'Test Process', 'company_id' => $company['id']]);
        $subprocess = $this->createSubprocess(['name' => 'Test Subprocess', 'process_id' => $process['id']]);

        $response = $this->get('/api/risk-control-matrix', $this->authHeader($token), [
            'subprocess_id' => $subprocess['id'],
        ]);

        $data = $this->parseJsonResponse($response);

        expect($response->getStatusCode())->toBe(200)
            ->and($data)->toHaveKey('data');
    });
});
