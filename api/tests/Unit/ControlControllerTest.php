<?php

declare(strict_types=1);

use AssurKit\Controllers\ControlController;
use AssurKit\Models\Control;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Message\StreamInterface;

beforeEach(function () {
    $this->controller = new ControlController();

    // Mock PSR-7 Request
    $this->request = Mockery::mock(ServerRequestInterface::class);

    // Mock PSR-7 Response
    $this->response = Mockery::mock(ResponseInterface::class);
    $this->stream = Mockery::mock(StreamInterface::class);

    // Setup default response chain
    $this->response->shouldReceive('getBody')
        ->andReturn($this->stream);

    $this->response->shouldReceive('withStatus')
        ->andReturnSelf();

    $this->response->shouldReceive('withHeader')
        ->andReturnSelf();
});

describe('ControlController::index', function () {
    test('returns paginated controls list', function () {
        $control1 = $this->createControl(['name' => 'Test Control 1']);
        $control2 = $this->createControl(['name' => 'Test Control 2']);

        $this->request->shouldReceive('getQueryParams')
            ->andReturn([]);

        $this->stream->shouldReceive('write')
            ->once()
            ->with(Mockery::on(function ($json) {
                $data = json_decode($json, true);

                return isset($data['data'])
                    && isset($data['pagination'])
                    && isset($data['filters'])
                    && $data['pagination']['page'] === 1;
            }));

        $response = $this->controller->index($this->request, $this->response);

        expect($response)->toBeInstanceOf(ResponseInterface::class);
    });

    test('filters controls by search term', function () {
        $control1 = $this->createControl(['name' => 'Access Control System']);
        $control2 = $this->createControl(['name' => 'Segregation of Duties']);

        $this->request->shouldReceive('getQueryParams')
            ->andReturn(['search' => 'Access']);

        $this->stream->shouldReceive('write')
            ->once()
            ->with(Mockery::on(function ($json) {
                $data = json_decode($json, true);
                $names = array_column($data['data'], 'name');

                return in_array('Access Control System', $names, true)
                    && !in_array('Segregation of Duties', $names, true);
            }));

        $response = $this->controller->index($this->request, $this->response);

        expect($response)->toBeInstanceOf(ResponseInterface::class);
    });

    test('filters controls by control type', function () {
        $preventive = $this->createControl(['control_type' => 'Preventive']);
        $detective = $this->createControl(['control_type' => 'Detective']);

        $this->request->shouldReceive('getQueryParams')
            ->andReturn(['control_type' => 'Preventive']);

        $this->stream->shouldReceive('write')
            ->once()
            ->with(Mockery::on(function ($json) {
                $data = json_decode($json, true);
                foreach ($data['data'] as $control) {
                    if ($control['control_type'] !== 'Preventive') {
                        return false;
                    }
                }

                return true;
            }));

        $response = $this->controller->index($this->request, $this->response);

        expect($response)->toBeInstanceOf(ResponseInterface::class);
    });

    test('filters controls by frequency', function () {
        $monthly = $this->createControl(['frequency' => 'Monthly']);
        $quarterly = $this->createControl(['frequency' => 'Quarterly']);

        $this->request->shouldReceive('getQueryParams')
            ->andReturn(['frequency' => 'Monthly']);

        $this->stream->shouldReceive('write')
            ->once()
            ->with(Mockery::on(function ($json) {
                $data = json_decode($json, true);
                foreach ($data['data'] as $control) {
                    if ($control['frequency'] !== 'Monthly') {
                        return false;
                    }
                }

                return true;
            }));

        $response = $this->controller->index($this->request, $this->response);

        expect($response)->toBeInstanceOf(ResponseInterface::class);
    });

    test('filters controls by automation level', function () {
        $manual = $this->createControl(['automation_level' => 'Manual']);
        $automated = $this->createControl(['automation_level' => 'Automated']);

        $this->request->shouldReceive('getQueryParams')
            ->andReturn(['automation_level' => 'Automated']);

        $this->stream->shouldReceive('write')
            ->once()
            ->with(Mockery::on(function ($json) {
                $data = json_decode($json, true);
                foreach ($data['data'] as $control) {
                    if ($control['automation_level'] !== 'Automated') {
                        return false;
                    }
                }

                return true;
            }));

        $response = $this->controller->index($this->request, $this->response);

        expect($response)->toBeInstanceOf(ResponseInterface::class);
    });

    test('filters controls by key control status', function () {
        $keyControl = $this->createControl(['is_key_control' => true]);
        $nonKeyControl = $this->createControl(['is_key_control' => false]);

        $this->request->shouldReceive('getQueryParams')
            ->andReturn(['is_key_control' => '1']);

        $this->stream->shouldReceive('write')
            ->once()
            ->with(Mockery::on(function ($json) {
                $data = json_decode($json, true);
                foreach ($data['data'] as $control) {
                    if (!$control['is_key_control']) {
                        return false;
                    }
                }

                return true;
            }));

        $response = $this->controller->index($this->request, $this->response);

        expect($response)->toBeInstanceOf(ResponseInterface::class);
    });

    test('includes frequency weight and automation score in response', function () {
        $control = $this->createControl([
            'frequency' => 'Daily',
            'automation_level' => 'Automated',
        ]);

        $this->request->shouldReceive('getQueryParams')
            ->andReturn([]);

        $this->stream->shouldReceive('write')
            ->once()
            ->with(Mockery::on(function ($json) {
                $data = json_decode($json, true);
                if (empty($data['data'])) {
                    return false;
                }
                $firstControl = $data['data'][0];

                return isset($firstControl['frequency_weight'])
                    && isset($firstControl['automation_score']);
            }));

        $response = $this->controller->index($this->request, $this->response);

        expect($response)->toBeInstanceOf(ResponseInterface::class);
    });
});

describe('ControlController::show', function () {
    test('returns control with all relationships', function () {
        $control = $this->createControl(['name' => 'Test Control']);

        $this->stream->shouldReceive('write')
            ->once()
            ->with(Mockery::on(function ($json) use ($control) {
                $data = json_decode($json, true);

                return $data['id'] === $control['id']
                    && $data['name'] === $control['name']
                    && isset($data['risks'])
                    && isset($data['available_options']);
            }));

        $response = $this->controller->show(
            $this->request,
            $this->response,
            ['id' => $control['id']]
        );

        expect($response)->toBeInstanceOf(ResponseInterface::class);
    });

    test('returns 404 for non-existent control', function () {
        $this->stream->shouldReceive('write')
            ->once()
            ->with(Mockery::on(function ($json) {
                $data = json_decode($json, true);

                return $data['error'] === true
                    && in_array('Control not found', $data['errors'], true);
            }));

        $response = $this->controller->show(
            $this->request,
            $this->response,
            ['id' => '00000000-0000-0000-0000-000000000000']
        );

        expect($response)->toBeInstanceOf(ResponseInterface::class);
    });
});

describe('ControlController::create', function () {
    test('creates control with valid data', function () {
        $controlData = [
            'name' => 'New Control',
            'description' => 'Test control description',
            'control_type' => 'Preventive',
            'frequency' => 'Monthly',
            'automation_level' => 'Manual',
            'is_key_control' => true,
            'owner_email' => 'owner@example.com',
            'reviewer_email' => 'reviewer@example.com',
        ];

        $this->request->shouldReceive('getParsedBody')
            ->andReturn($controlData);

        $this->stream->shouldReceive('write')
            ->once()
            ->with(Mockery::on(function ($json) {
                $data = json_decode($json, true);

                return $data['message'] === 'Control created successfully'
                    && isset($data['control']['id'])
                    && isset($data['control']['control_id'])
                    && $data['control']['name'] === 'New Control';
            }));

        $response = $this->controller->create($this->request, $this->response);

        expect($response)->toBeInstanceOf(ResponseInterface::class);

        // Verify control was created
        $control = Control::where('name', 'New Control')->first();
        expect($control)->not->toBeNull()
            ->and($control->control_type)->toBe('Preventive')
            ->and($control->frequency)->toBe('Monthly')
            ->and($control->automation_level)->toBe('Manual')
            ->and($control->is_key_control)->toBeTrue();
    });

    test('auto-generates control_id when not provided', function () {
        $controlData = [
            'name' => 'Auto ID Control',
            'description' => 'Test',
            'control_type' => 'Preventive',
            'frequency' => 'Monthly',
            'automation_level' => 'Manual',
            'owner_email' => 'owner@example.com',
        ];

        $this->request->shouldReceive('getParsedBody')
            ->andReturn($controlData);

        $this->stream->shouldReceive('write')
            ->once()
            ->with(Mockery::on(function ($json) {
                $data = json_decode($json, true);
                // Should have a control_id like CTL-001

                return isset($data['control']['control_id'])
                    && preg_match('/CTL-\d{3}/', $data['control']['control_id']);
            }));

        $response = $this->controller->create($this->request, $this->response);

        expect($response)->toBeInstanceOf(ResponseInterface::class);
    });

    test('rejects control with missing required fields', function () {
        $invalidData = [
            'name' => 'Incomplete Control',
            // Missing description, control_type, frequency, automation_level, owner_email
        ];

        $this->request->shouldReceive('getParsedBody')
            ->andReturn($invalidData);

        $this->stream->shouldReceive('write')
            ->once()
            ->with(Mockery::on(function ($json) {
                $data = json_decode($json, true);

                return $data['error'] === true
                    && !empty($data['errors']);
            }));

        $response = $this->controller->create($this->request, $this->response);

        expect($response)->toBeInstanceOf(ResponseInterface::class);
    });

    test('rejects control with invalid control type', function () {
        $invalidData = [
            'name' => 'Invalid Control',
            'description' => 'Test',
            'control_type' => 'InvalidType', // Not in [Preventive, Detective, Corrective]
            'frequency' => 'Monthly',
            'automation_level' => 'Manual',
            'owner_email' => 'owner@example.com',
        ];

        $this->request->shouldReceive('getParsedBody')
            ->andReturn($invalidData);

        $this->stream->shouldReceive('write')
            ->once()
            ->with(Mockery::on(function ($json) {
                $data = json_decode($json, true);

                return $data['error'] === true
                    && count(array_filter($data['errors'], function ($error) {
                        return str_contains($error, 'Invalid control type');
                    })) > 0;
            }));

        $response = $this->controller->create($this->request, $this->response);

        expect($response)->toBeInstanceOf(ResponseInterface::class);
    });

    test('rejects control with invalid frequency', function () {
        $invalidData = [
            'name' => 'Invalid Control',
            'description' => 'Test',
            'control_type' => 'Preventive',
            'frequency' => 'InvalidFrequency', // Not in [Daily, Weekly, Monthly, etc.]
            'automation_level' => 'Manual',
            'owner_email' => 'owner@example.com',
        ];

        $this->request->shouldReceive('getParsedBody')
            ->andReturn($invalidData);

        $this->stream->shouldReceive('write')
            ->once()
            ->with(Mockery::on(function ($json) {
                $data = json_decode($json, true);

                return $data['error'] === true;
            }));

        $response = $this->controller->create($this->request, $this->response);

        expect($response)->toBeInstanceOf(ResponseInterface::class);
    });

    test('rejects control with invalid automation level', function () {
        $invalidData = [
            'name' => 'Invalid Control',
            'description' => 'Test',
            'control_type' => 'Preventive',
            'frequency' => 'Monthly',
            'automation_level' => 'InvalidLevel', // Not in [Manual, Semi-automated, Automated]
            'owner_email' => 'owner@example.com',
        ];

        $this->request->shouldReceive('getParsedBody')
            ->andReturn($invalidData);

        $this->stream->shouldReceive('write')
            ->once()
            ->with(Mockery::on(function ($json) {
                $data = json_decode($json, true);

                return $data['error'] === true;
            }));

        $response = $this->controller->create($this->request, $this->response);

        expect($response)->toBeInstanceOf(ResponseInterface::class);
    });

    test('rejects control with invalid owner email', function () {
        $invalidData = [
            'name' => 'Invalid Control',
            'description' => 'Test',
            'control_type' => 'Preventive',
            'frequency' => 'Monthly',
            'automation_level' => 'Manual',
            'owner_email' => 'not-an-email', // Invalid email format
        ];

        $this->request->shouldReceive('getParsedBody')
            ->andReturn($invalidData);

        $this->stream->shouldReceive('write')
            ->once()
            ->with(Mockery::on(function ($json) {
                $data = json_decode($json, true);

                return $data['error'] === true
                    && count(array_filter($data['errors'], function ($error) {
                        return str_contains($error, 'email');
                    })) > 0;
            }));

        $response = $this->controller->create($this->request, $this->response);

        expect($response)->toBeInstanceOf(ResponseInterface::class);
    });

    test('rejects control with invalid reviewer email', function () {
        $invalidData = [
            'name' => 'Invalid Control',
            'description' => 'Test',
            'control_type' => 'Preventive',
            'frequency' => 'Monthly',
            'automation_level' => 'Manual',
            'owner_email' => 'owner@example.com',
            'reviewer_email' => 'not-an-email', // Invalid email format
        ];

        $this->request->shouldReceive('getParsedBody')
            ->andReturn($invalidData);

        $this->stream->shouldReceive('write')
            ->once()
            ->with(Mockery::on(function ($json) {
                $data = json_decode($json, true);

                return $data['error'] === true;
            }));

        $response = $this->controller->create($this->request, $this->response);

        expect($response)->toBeInstanceOf(ResponseInterface::class);
    });

    test('sets default status to Draft when not provided', function () {
        $controlData = [
            'name' => 'Default Status Control',
            'description' => 'Test',
            'control_type' => 'Preventive',
            'frequency' => 'Monthly',
            'automation_level' => 'Manual',
            'owner_email' => 'owner@example.com',
        ];

        $this->request->shouldReceive('getParsedBody')
            ->andReturn($controlData);

        $this->stream->shouldReceive('write')->once();

        $this->controller->create($this->request, $this->response);

        $control = Control::where('name', 'Default Status Control')->first();
        expect($control->status)->toBe('Draft');
    });

    test('accepts evidence requirements as array', function () {
        $controlData = [
            'name' => 'Control with Evidence Req',
            'description' => 'Test',
            'control_type' => 'Preventive',
            'frequency' => 'Monthly',
            'automation_level' => 'Manual',
            'owner_email' => 'owner@example.com',
            'evidence_requirements' => ['screenshots', 'logs', 'reports'],
        ];

        $this->request->shouldReceive('getParsedBody')
            ->andReturn($controlData);

        $this->stream->shouldReceive('write')->once();

        $this->controller->create($this->request, $this->response);

        $control = Control::where('name', 'Control with Evidence Req')->first();
        expect($control->evidence_requirements)->toBeArray()
            ->and($control->evidence_requirements)->toContain('screenshots', 'logs', 'reports');
    });
});

describe('ControlController::update', function () {
    test('updates control with valid data', function () {
        $control = $this->createControl(['name' => 'Original Name']);

        $updateData = [
            'name' => 'Updated Control Name',
            'description' => 'Updated description',
        ];

        $this->request->shouldReceive('getParsedBody')
            ->andReturn($updateData);

        $this->stream->shouldReceive('write')
            ->once()
            ->with(Mockery::on(function ($json) {
                $data = json_decode($json, true);

                return $data['message'] === 'Control updated successfully'
                    && $data['control']['name'] === 'Updated Control Name';
            }));

        $response = $this->controller->update(
            $this->request,
            $this->response,
            ['id' => $control['id']]
        );

        expect($response)->toBeInstanceOf(ResponseInterface::class);

        // Verify control was updated
        $updated = Control::find($control['id']);
        expect($updated->name)->toBe('Updated Control Name')
            ->and($updated->description)->toBe('Updated description');
    });

    test('returns 404 for non-existent control', function () {
        $this->request->shouldReceive('getParsedBody')
            ->andReturn(['name' => 'New Name']);

        $this->stream->shouldReceive('write')
            ->once()
            ->with(Mockery::on(function ($json) {
                $data = json_decode($json, true);

                return $data['error'] === true
                    && in_array('Control not found', $data['errors'], true);
            }));

        $response = $this->controller->update(
            $this->request,
            $this->response,
            ['id' => '00000000-0000-0000-0000-000000000000']
        );

        expect($response)->toBeInstanceOf(ResponseInterface::class);
    });

    test('allows partial updates', function () {
        $control = $this->createControl([
            'name' => 'Original Name',
            'frequency' => 'Monthly',
        ]);

        // Only update frequency
        $updateData = [
            'frequency' => 'Quarterly',
        ];

        $this->request->shouldReceive('getParsedBody')
            ->andReturn($updateData);

        $this->stream->shouldReceive('write')->once();

        $this->controller->update(
            $this->request,
            $this->response,
            ['id' => $control['id']]
        );

        $updated = Control::find($control['id']);
        expect($updated->name)->toBe('Original Name') // Unchanged
            ->and($updated->frequency)->toBe('Quarterly');
    });

    test('can change control status', function () {
        $control = $this->createControl(['status' => 'Draft']);

        $updateData = [
            'status' => 'Active',
        ];

        $this->request->shouldReceive('getParsedBody')
            ->andReturn($updateData);

        $this->stream->shouldReceive('write')->once();

        $this->controller->update(
            $this->request,
            $this->response,
            ['id' => $control['id']]
        );

        $updated = Control::find($control['id']);
        expect($updated->status)->toBe('Active');
    });
});

describe('ControlController::delete', function () {
    test('deletes control without risk associations', function () {
        $control = $this->createControl(['name' => 'Control to Delete']);

        $this->stream->shouldReceive('write')
            ->once()
            ->with(Mockery::on(function ($json) {
                $data = json_decode($json, true);

                return $data['message'] === 'Control deleted successfully';
            }));

        $response = $this->controller->delete(
            $this->request,
            $this->response,
            ['id' => $control['id']]
        );

        expect($response)->toBeInstanceOf(ResponseInterface::class);

        // Verify control was deleted
        $deleted = Control::find($control['id']);
        expect($deleted)->toBeNull();
    });

    test('returns 404 when deleting non-existent control', function () {
        $this->stream->shouldReceive('write')
            ->once()
            ->with(Mockery::on(function ($json) {
                $data = json_decode($json, true);

                return $data['error'] === true
                    && in_array('Control not found', $data['errors'], true);
            }));

        $response = $this->controller->delete(
            $this->request,
            $this->response,
            ['id' => '00000000-0000-0000-0000-000000000000']
        );

        expect($response)->toBeInstanceOf(ResponseInterface::class);
    });
});

afterEach(function () {
    Mockery::close();
});
