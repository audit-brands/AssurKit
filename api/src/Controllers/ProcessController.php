<?php

declare(strict_types=1);

namespace AssurKit\Controllers;

use AssurKit\Models\Company;
use AssurKit\Models\Process;
use Illuminate\Database\Eloquent\Builder;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Respect\Validation\Validator as v;

class ProcessController
{
    public function index(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $queryParams = $request->getQueryParams();

        $page = max(1, (int) ($queryParams['page'] ?? 1));
        $limit = min(100, max(10, (int) ($queryParams['limit'] ?? 20)));
        $search = $queryParams['search'] ?? '';
        $companyId = $queryParams['company_id'] ?? '';
        $active = $queryParams['active'] ?? '';

        $query = Process::with(['company', 'subprocesses' => function ($q): void {
            $q->where('is_active', true);
        }]);

        if ($companyId) {
            $query->where('company_id', $companyId);
        }

        if ($search) {
            $query->where(function (Builder $q) use ($search): void {
                $q->where('name', 'ILIKE', "%{$search}%")
                  ->orWhere('description', 'ILIKE', "%{$search}%")
                  ->orWhere('owner_email', 'ILIKE', "%{$search}%");
            });
        }

        if ($active !== '') {
            $query->where('is_active', (bool) $active);
        }

        $total = $query->count();
        $processes = $query->skip(($page - 1) * $limit)
                          ->take($limit)
                          ->orderBy('name')
                          ->get();

        /** @var array<array{id: string, name: string, description: string|null, owner_email: string|null, company: array{id: string, name: string}, subprocesses_count: int, is_active: bool, created_at: string}> $data */
        $data = [];
        foreach ($processes as $process) {
            $data[] = [
                'id' => $process->id,
                'name' => $process->name,
                'description' => $process->description,
                'owner_email' => $process->owner_email,
                'company' => [
                    'id' => $process->company->id,
                    'name' => $process->company->name,
                ],
                'subprocesses_count' => $process->subprocesses->count(),
                'is_active' => $process->is_active,
                'created_at' => $process->created_at->toISOString(),
            ];
        }

        $responseData = [
            'data' => $data,
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
        $processId = $args['id'];
        $process = Process::with(['company', 'subprocesses.risks'])->find($processId);

        if (!$process) {
            return $this->errorResponse($response, ['Process not found'], 404);
        }

        $responseData = [
            'id' => $process->id,
            'name' => $process->name,
            'description' => $process->description,
            'owner_email' => $process->owner_email,
            'metadata' => $process->metadata,
            'is_active' => $process->is_active,
            'company' => [
                'id' => $process->company->id,
                'name' => $process->company->name,
            ],
            'subprocesses' => $process->subprocesses->map(function ($subprocess): array {
                return [
                    'id' => $subprocess->id,
                    'name' => $subprocess->name,
                    'description' => $subprocess->description,
                    'owner_email' => $subprocess->owner_email,
                    'assertions' => $subprocess->assertions,
                    'risks_count' => $subprocess->risks->count(),
                    'is_active' => $subprocess->is_active,
                ];
            }),
            'created_at' => $process->created_at->toISOString(),
            'updated_at' => $process->updated_at->toISOString(),
        ];

        return $this->jsonResponse($response, $responseData);
    }

    public function create(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $data = $request->getParsedBody();

        $validation = $this->validateProcessData($data);
        if (!$validation['valid']) {
            return $this->errorResponse($response, $validation['errors'], 400);
        }

        // Verify company exists
        $company = Company::find($data['company_id']);
        if (!$company) {
            return $this->errorResponse($response, ['Company not found'], 404);
        }

        $process = Process::create([
            'company_id' => $data['company_id'],
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'owner_email' => $data['owner_email'] ?? null,
            'metadata' => $data['metadata'] ?? null,
            'is_active' => $data['is_active'] ?? true,
        ]);

        $process->load('company');

        $responseData = [
            'message' => 'Process created successfully',
            'process' => [
                'id' => $process->id,
                'name' => $process->name,
                'description' => $process->description,
                'owner_email' => $process->owner_email,
                'company' => [
                    'id' => $process->company->id,
                    'name' => $process->company->name,
                ],
                'is_active' => $process->is_active,
                'created_at' => $process->created_at->toISOString(),
            ],
        ];

        return $this->jsonResponse($response, $responseData, 201);
    }

    public function update(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $processId = $args['id'];
        $process = Process::find($processId);

        if (!$process) {
            return $this->errorResponse($response, ['Process not found'], 404);
        }

        $data = $request->getParsedBody();

        $validation = $this->validateProcessData($data, false);
        if (!$validation['valid']) {
            return $this->errorResponse($response, $validation['errors'], 400);
        }

        if (isset($data['company_id']) && $data['company_id'] !== $process->company_id) {
            $company = Company::find($data['company_id']);
            if (!$company) {
                return $this->errorResponse($response, ['Company not found'], 404);
            }
            $process->company_id = $data['company_id'];
        }

        if (isset($data['name'])) {
            $process->name = $data['name'];
        }

        if (isset($data['description'])) {
            $process->description = $data['description'];
        }

        if (isset($data['owner_email'])) {
            $process->owner_email = $data['owner_email'];
        }

        if (isset($data['metadata'])) {
            $process->metadata = $data['metadata'];
        }

        if (isset($data['is_active'])) {
            $process->is_active = (bool) $data['is_active'];
        }

        $process->save();
        $process->load('company');

        $responseData = [
            'message' => 'Process updated successfully',
            'process' => [
                'id' => $process->id,
                'name' => $process->name,
                'description' => $process->description,
                'owner_email' => $process->owner_email,
                'company' => [
                    'id' => $process->company->id,
                    'name' => $process->company->name,
                ],
                'is_active' => $process->is_active,
                'updated_at' => $process->updated_at->toISOString(),
            ],
        ];

        return $this->jsonResponse($response, $responseData);
    }

    public function delete(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $processId = $args['id'];
        $process = Process::find($processId);

        if (!$process) {
            return $this->errorResponse($response, ['Process not found'], 404);
        }

        // Check if process has active subprocesses
        if ($process->activeSubprocesses()->count() > 0) {
            return $this->errorResponse($response, ['Cannot delete process with active subprocesses'], 400);
        }

        $process->delete();

        return $this->jsonResponse($response, ['message' => 'Process deleted successfully']);
    }

    private function validateProcessData(?array $data, bool $isCreate = true): array
    {
        if (!$data) {
            return ['valid' => false, 'errors' => ['No data provided']];
        }

        $errors = [];

        if ($isCreate || isset($data['company_id'])) {
            if (!v::uuid()->validate($data['company_id'] ?? '')) {
                $errors[] = 'Valid company ID is required';
            }
        }

        if ($isCreate || isset($data['name'])) {
            if (!v::stringType()->notEmpty()->length(2, 255)->validate($data['name'] ?? '')) {
                $errors[] = 'Name is required and must be between 2 and 255 characters';
            }
        }

        if (isset($data['owner_email']) && $data['owner_email'] !== null) {
            if (!v::email()->validate($data['owner_email'])) {
                $errors[] = 'Valid owner email is required';
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
