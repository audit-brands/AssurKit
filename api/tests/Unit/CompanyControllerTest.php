<?php

declare(strict_types=1);

use AssurKit\Controllers\CompanyController;
use AssurKit\Models\Company;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Message\StreamInterface;

beforeEach(function () {
    $this->controller = new CompanyController();

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

describe('CompanyController::index', function () {
    test('returns paginated companies list', function () {
        // Create test companies
        $company1 = $this->createCompany(['name' => 'Test Company 1']);
        $company2 = $this->createCompany(['name' => 'Test Company 2']);

        $this->request->shouldReceive('getQueryParams')
            ->andReturn([]);

        $this->stream->shouldReceive('write')
            ->once()
            ->with(Mockery::on(function ($json) {
                $data = json_decode($json, true);

                return isset($data['data'])
                    && isset($data['pagination'])
                    && $data['pagination']['page'] === 1;
            }));

        $response = $this->controller->index($this->request, $this->response);

        expect($response)->toBeInstanceOf(ResponseInterface::class);
    });

    test('filters companies by search term', function () {
        $company1 = $this->createCompany(['name' => 'Acme Corporation']);
        $company2 = $this->createCompany(['name' => 'Beta Industries']);

        $this->request->shouldReceive('getQueryParams')
            ->andReturn(['search' => 'Acme']);

        $this->stream->shouldReceive('write')
            ->once()
            ->with(Mockery::on(function ($json) {
                $data = json_decode($json, true);

                return count($data['data']) === 1
                    && $data['data'][0]['name'] === 'Acme Corporation';
            }));

        $response = $this->controller->index($this->request, $this->response);

        expect($response)->toBeInstanceOf(ResponseInterface::class);
    });

    test('filters companies by active status', function () {
        $activeCompany = $this->createCompany(['name' => 'Active Co', 'is_active' => true]);
        $inactiveCompany = $this->createCompany(['name' => 'Inactive Co', 'is_active' => false]);

        $this->request->shouldReceive('getQueryParams')
            ->andReturn(['active' => '1']);

        $this->stream->shouldReceive('write')
            ->once()
            ->with(Mockery::on(function ($json) {
                $data = json_decode($json, true);
                // All returned companies should be active
                foreach ($data['data'] as $company) {
                    if (!$company['is_active']) {
                        return false;
                    }
                }

                return true;
            }));

        $response = $this->controller->index($this->request, $this->response);

        expect($response)->toBeInstanceOf(ResponseInterface::class);
    });

    test('respects pagination parameters', function () {
        // Create 25 companies
        for ($i = 1; $i <= 25; $i++) {
            $this->createCompany(['name' => "Company $i"]);
        }

        $this->request->shouldReceive('getQueryParams')
            ->andReturn(['page' => 2, 'limit' => 10]);

        $this->stream->shouldReceive('write')
            ->once()
            ->with(Mockery::on(function ($json) {
                $data = json_decode($json, true);

                return $data['pagination']['page'] === 2
                    && $data['pagination']['limit'] === 10
                    && count($data['data']) <= 10;
            }));

        $response = $this->controller->index($this->request, $this->response);

        expect($response)->toBeInstanceOf(ResponseInterface::class);
    });

    test('limits maximum page size to 100', function () {
        $this->request->shouldReceive('getQueryParams')
            ->andReturn(['limit' => 500]); // Try to get 500 items

        $this->stream->shouldReceive('write')
            ->once()
            ->with(Mockery::on(function ($json) {
                $data = json_decode($json, true);
                // Should be capped at 100

                return $data['pagination']['limit'] === 100;
            }));

        $response = $this->controller->index($this->request, $this->response);

        expect($response)->toBeInstanceOf(ResponseInterface::class);
    });
});

describe('CompanyController::show', function () {
    test('returns company with processes and subprocesses', function () {
        $company = $this->createCompany(['name' => 'Test Company']);

        $this->stream->shouldReceive('write')
            ->once()
            ->with(Mockery::on(function ($json) use ($company) {
                $data = json_decode($json, true);

                return $data['id'] === $company['id']
                    && $data['name'] === $company['name']
                    && isset($data['processes']);
            }));

        $response = $this->controller->show(
            $this->request,
            $this->response,
            ['id' => $company['id']]
        );

        expect($response)->toBeInstanceOf(ResponseInterface::class);
    });

    test('returns 404 for non-existent company', function () {
        $this->stream->shouldReceive('write')
            ->once()
            ->with(Mockery::on(function ($json) {
                $data = json_decode($json, true);

                return $data['error'] === true
                    && in_array('Company not found', $data['errors'], true);
            }));

        $response = $this->controller->show(
            $this->request,
            $this->response,
            ['id' => '00000000-0000-0000-0000-000000000000']
        );

        expect($response)->toBeInstanceOf(ResponseInterface::class);
    });
});

describe('CompanyController::create', function () {
    test('creates company with valid data', function () {
        $companyData = [
            'name' => 'New Company',
            'description' => 'A new test company',
            'ticker_symbol' => 'NEWCO',
            'industry' => 'Technology',
            'is_active' => true,
        ];

        $this->request->shouldReceive('getParsedBody')
            ->andReturn($companyData);

        $this->stream->shouldReceive('write')
            ->once()
            ->with(Mockery::on(function ($json) {
                $data = json_decode($json, true);

                return $data['message'] === 'Company created successfully'
                    && isset($data['company']['id'])
                    && $data['company']['name'] === 'New Company';
            }));

        $response = $this->controller->create($this->request, $this->response);

        expect($response)->toBeInstanceOf(ResponseInterface::class);

        // Verify company was created in database
        $company = Company::where('name', 'New Company')->first();
        expect($company)->not->toBeNull()
            ->and($company->description)->toBe('A new test company')
            ->and($company->ticker_symbol)->toBe('NEWCO');
    });

    test('rejects company with missing name', function () {
        $invalidData = [
            'description' => 'Missing name',
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

    test('rejects company with name too short', function () {
        $invalidData = [
            'name' => 'A', // Only 1 character, min is 2
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

    test('rejects company with invalid ticker symbol', function () {
        $invalidData = [
            'name' => 'Valid Company',
            'ticker_symbol' => 'TOOLONGSYMBOL', // More than 10 characters
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

    test('rejects company with invalid metadata format', function () {
        $invalidData = [
            'name' => 'Valid Company',
            'metadata' => 'not an array', // Should be array
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

    test('sets default is_active to true when not provided', function () {
        $companyData = [
            'name' => 'Default Active Company',
        ];

        $this->request->shouldReceive('getParsedBody')
            ->andReturn($companyData);

        $this->stream->shouldReceive('write')
            ->once();

        $this->controller->create($this->request, $this->response);

        $company = Company::where('name', 'Default Active Company')->first();
        expect($company->is_active)->toBeTrue();
    });
});

describe('CompanyController::update', function () {
    test('updates company with valid data', function () {
        $company = $this->createCompany(['name' => 'Original Name']);

        $updateData = [
            'name' => 'Updated Name',
            'description' => 'Updated description',
        ];

        $this->request->shouldReceive('getParsedBody')
            ->andReturn($updateData);

        $this->stream->shouldReceive('write')
            ->once()
            ->with(Mockery::on(function ($json) {
                $data = json_decode($json, true);

                return $data['message'] === 'Company updated successfully'
                    && $data['company']['name'] === 'Updated Name';
            }));

        $response = $this->controller->update(
            $this->request,
            $this->response,
            ['id' => $company['id']]
        );

        expect($response)->toBeInstanceOf(ResponseInterface::class);

        // Verify company was updated
        $updated = Company::find($company['id']);
        expect($updated->name)->toBe('Updated Name')
            ->and($updated->description)->toBe('Updated description');
    });

    test('returns 404 for non-existent company', function () {
        $this->request->shouldReceive('getParsedBody')
            ->andReturn(['name' => 'New Name']);

        $this->stream->shouldReceive('write')
            ->once()
            ->with(Mockery::on(function ($json) {
                $data = json_decode($json, true);

                return $data['error'] === true
                    && in_array('Company not found', $data['errors'], true);
            }));

        $response = $this->controller->update(
            $this->request,
            $this->response,
            ['id' => '00000000-0000-0000-0000-000000000000']
        );

        expect($response)->toBeInstanceOf(ResponseInterface::class);
    });

    test('allows partial updates', function () {
        $company = $this->createCompany([
            'name' => 'Original Name',
            'description' => 'Original Description',
        ]);

        // Only update description
        $updateData = [
            'description' => 'New Description Only',
        ];

        $this->request->shouldReceive('getParsedBody')
            ->andReturn($updateData);

        $this->stream->shouldReceive('write')->once();

        $this->controller->update(
            $this->request,
            $this->response,
            ['id' => $company['id']]
        );

        $updated = Company::find($company['id']);
        expect($updated->name)->toBe('Original Name') // Unchanged
            ->and($updated->description)->toBe('New Description Only');
    });

    test('can deactivate company', function () {
        $company = $this->createCompany(['is_active' => true]);

        $updateData = [
            'is_active' => false,
        ];

        $this->request->shouldReceive('getParsedBody')
            ->andReturn($updateData);

        $this->stream->shouldReceive('write')->once();

        $this->controller->update(
            $this->request,
            $this->response,
            ['id' => $company['id']]
        );

        $updated = Company::find($company['id']);
        expect($updated->is_active)->toBeFalse();
    });
});

describe('CompanyController::delete', function () {
    test('deletes existing company', function () {
        $company = $this->createCompany(['name' => 'Company to Delete']);

        $this->stream->shouldReceive('write')
            ->once()
            ->with(Mockery::on(function ($json) {
                $data = json_decode($json, true);

                return $data['message'] === 'Company deleted successfully';
            }));

        $response = $this->controller->delete(
            $this->request,
            $this->response,
            ['id' => $company['id']]
        );

        expect($response)->toBeInstanceOf(ResponseInterface::class);

        // Verify company was deleted
        $deleted = Company::find($company['id']);
        expect($deleted)->toBeNull();
    });

    test('returns 404 when deleting non-existent company', function () {
        $this->stream->shouldReceive('write')
            ->once()
            ->with(Mockery::on(function ($json) {
                $data = json_decode($json, true);

                return $data['error'] === true
                    && in_array('Company not found', $data['errors'], true);
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
