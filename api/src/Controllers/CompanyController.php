<?php

declare(strict_types=1);

namespace AssurKit\Controllers;

use AssurKit\Models\Company;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Respect\Validation\Validator as v;

class CompanyController
{
    public function index(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $queryParams = $request->getQueryParams();

        $page = max(1, (int) ($queryParams['page'] ?? 1));
        $limit = min(100, max(10, (int) ($queryParams['limit'] ?? 20)));
        $search = $queryParams['search'] ?? '';
        $active = $queryParams['active'] ?? '';

        $query = Company::with(['processes' => function ($q): void {
            $q->where('is_active', true)->with(['subprocesses' => function ($sq): void {
                $sq->where('is_active', true);
            }]);
        }]);

        if ($search) {
            $query->where(function ($q) use ($search): void {
                $q->where('name', 'ILIKE', "%{$search}%")
                  ->orWhere('ticker_symbol', 'ILIKE', "%{$search}%");
            });
        }

        if ($active !== '') {
            $query->where('is_active', (bool) $active);
        }

        $total = $query->count();
        $companies = $query->skip(($page - 1) * $limit)
                          ->take($limit)
                          ->orderBy('name')
                          ->get();

        $responseData = [
            'data' => $companies->map(function ($company): array {
                return [
                    'id' => $company->id,
                    'name' => $company->name,
                    'description' => $company->description,
                    'ticker_symbol' => $company->ticker_symbol,
                    'industry' => $company->industry,
                    'is_active' => $company->is_active,
                    'processes_count' => $company->processes->count(),
                    'subprocesses_count' => $company->processes->sum(function ($process): int {
                        return $process->subprocesses->count();
                    }),
                    'created_at' => $company->created_at->toISOString(),
                ];
            }),
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'pages' => ceil($total / $limit),
            ],
        ];

        return $this->jsonResponse($response, $responseData);
    }

    public function show(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $companyId = $args['id'];
        $company = Company::with(['processes.subprocesses'])->find($companyId);

        if (!$company) {
            return $this->errorResponse($response, ['Company not found'], 404);
        }

        $responseData = [
            'id' => $company->id,
            'name' => $company->name,
            'description' => $company->description,
            'ticker_symbol' => $company->ticker_symbol,
            'industry' => $company->industry,
            'metadata' => $company->metadata,
            'is_active' => $company->is_active,
            'processes' => $company->processes->map(function ($process): array {
                return [
                    'id' => $process->id,
                    'name' => $process->name,
                    'description' => $process->description,
                    'owner_email' => $process->owner_email,
                    'is_active' => $process->is_active,
                    'subprocesses' => $process->subprocesses->map(function ($subprocess): array {
                        return [
                            'id' => $subprocess->id,
                            'name' => $subprocess->name,
                            'description' => $subprocess->description,
                            'owner_email' => $subprocess->owner_email,
                            'assertions' => $subprocess->assertions,
                            'is_active' => $subprocess->is_active,
                        ];
                    }),
                ];
            }),
            'created_at' => $company->created_at->toISOString(),
            'updated_at' => $company->updated_at->toISOString(),
        ];

        return $this->jsonResponse($response, $responseData);
    }

    public function create(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $data = $request->getParsedBody();

        $validation = $this->validateCompanyData($data);
        if (!$validation['valid']) {
            return $this->errorResponse($response, $validation['errors'], 400);
        }

        $company = Company::create([
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'ticker_symbol' => $data['ticker_symbol'] ?? null,
            'industry' => $data['industry'] ?? null,
            'metadata' => $data['metadata'] ?? null,
            'is_active' => $data['is_active'] ?? true,
        ]);

        $responseData = [
            'message' => 'Company created successfully',
            'company' => [
                'id' => $company->id,
                'name' => $company->name,
                'description' => $company->description,
                'ticker_symbol' => $company->ticker_symbol,
                'industry' => $company->industry,
                'is_active' => $company->is_active,
                'created_at' => $company->created_at->toISOString(),
            ],
        ];

        return $this->jsonResponse($response, $responseData, 201);
    }

    public function update(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $companyId = $args['id'];
        $company = Company::find($companyId);

        if (!$company) {
            return $this->errorResponse($response, ['Company not found'], 404);
        }

        $data = $request->getParsedBody();

        $validation = $this->validateCompanyData($data, false);
        if (!$validation['valid']) {
            return $this->errorResponse($response, $validation['errors'], 400);
        }

        if (isset($data['name'])) {
            $company->name = $data['name'];
        }

        if (isset($data['description'])) {
            $company->description = $data['description'];
        }

        if (isset($data['ticker_symbol'])) {
            $company->ticker_symbol = $data['ticker_symbol'];
        }

        if (isset($data['industry'])) {
            $company->industry = $data['industry'];
        }

        if (isset($data['metadata'])) {
            $company->metadata = $data['metadata'];
        }

        if (isset($data['is_active'])) {
            $company->is_active = (bool) $data['is_active'];
        }

        $company->save();

        $responseData = [
            'message' => 'Company updated successfully',
            'company' => [
                'id' => $company->id,
                'name' => $company->name,
                'description' => $company->description,
                'ticker_symbol' => $company->ticker_symbol,
                'industry' => $company->industry,
                'is_active' => $company->is_active,
                'updated_at' => $company->updated_at->toISOString(),
            ],
        ];

        return $this->jsonResponse($response, $responseData);
    }

    public function delete(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $companyId = $args['id'];
        $company = Company::find($companyId);

        if (!$company) {
            return $this->errorResponse($response, ['Company not found'], 404);
        }

        $company->delete();

        return $this->jsonResponse($response, ['message' => 'Company deleted successfully']);
    }

    private function validateCompanyData(?array $data, bool $isCreate = true): array
    {
        if (!$data) {
            return ['valid' => false, 'errors' => ['No data provided']];
        }

        $errors = [];

        if ($isCreate || isset($data['name'])) {
            if (!v::stringType()->notEmpty()->length(2, 255)->validate($data['name'] ?? '')) {
                $errors[] = 'Name is required and must be between 2 and 255 characters';
            }
        }

        if (isset($data['ticker_symbol']) && $data['ticker_symbol'] !== null) {
            if (!v::stringType()->length(1, 10)->validate($data['ticker_symbol'])) {
                $errors[] = 'Ticker symbol must be between 1 and 10 characters';
            }
        }

        if (isset($data['metadata']) && $data['metadata'] !== null) {
            if (!is_array($data['metadata'])) {
                $errors[] = 'Metadata must be an object/array';
            }
        }

        return ['valid' => empty($errors), 'errors' => $errors];
    }

    private function jsonResponse(ResponseInterface $response, array $data, int $status = 200): ResponseInterface
    {
        $response->getBody()->write(json_encode($data));

        return $response
            ->withStatus($status)
            ->withHeader('Content-Type', 'application/json');
    }

    private function errorResponse(ResponseInterface $response, array $errors, int $status = 400): ResponseInterface
    {
        $data = [
            'error' => true,
            'message' => 'Request failed',
            'errors' => $errors,
        ];

        return $this->jsonResponse($response, $data, $status);
    }
}
