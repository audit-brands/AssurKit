<?php

declare(strict_types=1);

namespace AssurKit\Controllers;

use AssurKit\Models\Process;
use AssurKit\Models\Subprocess;
use Illuminate\Database\Eloquent\Builder;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Respect\Validation\Validator as v;

class SubprocessController
{
    public function index(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $queryParams = $request->getQueryParams();

        $page = max(1, (int) ($queryParams['page'] ?? 1));
        $limit = min(100, max(10, (int) ($queryParams['limit'] ?? 20)));
        $search = $queryParams['search'] ?? '';
        $processId = $queryParams['process_id'] ?? '';
        $assertion = $queryParams['assertion'] ?? '';
        $active = $queryParams['active'] ?? '';

        $query = Subprocess::with(['process.company', 'risks']);

        if ($processId) {
            $query->where('process_id', $processId);
        }

        if ($search) {
            $query->where(function (Builder $q) use ($search): void {
                $q->where('name', 'ILIKE', "%{$search}%")
                  ->orWhere('description', 'ILIKE', "%{$search}%")
                  ->orWhere('owner_email', 'ILIKE', "%{$search}%");
            });
        }

        if ($assertion) {
            $query->where('assertions', 'like', "%{$assertion}%");
        }

        if ($active !== '') {
            $query->where('is_active', (bool) $active);
        }

        $total = $query->count();
        $subprocesses = $query->skip(($page - 1) * $limit)
                            ->take($limit)
                            ->orderBy('name')
                            ->get();

        /** @var array<array{id: string, name: string, description: string|null, owner_email: string|null, assertions: array<string>|null, process: array{id: string, name: string, company: array{id: string, name: string}}, risks_count: int, is_active: bool, created_at: string}> $data */
        $data = [];
        foreach ($subprocesses as $subprocess) {
            $data[] = [
                'id' => $subprocess->id,
                'name' => $subprocess->name,
                'description' => $subprocess->description,
                'owner_email' => $subprocess->owner_email,
                'assertions' => $subprocess->assertions,
                'process' => [
                    'id' => $subprocess->process->id,
                    'name' => $subprocess->process->name,
                    'company' => [
                        'id' => $subprocess->process->company->id,
                        'name' => $subprocess->process->company->name,
                    ],
                ],
                'risks_count' => $subprocess->risks->count(),
                'is_active' => $subprocess->is_active,
                'created_at' => $subprocess->created_at->toISOString(),
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
        $subprocessId = $args['id'];
        $subprocess = Subprocess::with(['process.company', 'risks.controls'])->find($subprocessId);

        if (!$subprocess) {
            return $this->errorResponse($response, ['Subprocess not found'], 404);
        }

        $responseData = [
            'id' => $subprocess->id,
            'name' => $subprocess->name,
            'description' => $subprocess->description,
            'owner_email' => $subprocess->owner_email,
            'assertions' => $subprocess->assertions,
            'metadata' => $subprocess->metadata,
            'is_active' => $subprocess->is_active,
            'process' => [
                'id' => $subprocess->process->id,
                'name' => $subprocess->process->name,
                'company' => [
                    'id' => $subprocess->process->company->id,
                    'name' => $subprocess->process->company->name,
                ],
            ],
            'risks' => $subprocess->risks->map(function ($risk): array {
                return [
                    'id' => $risk->id,
                    'name' => $risk->name,
                    'risk_type' => $risk->risk_type,
                    'likelihood' => $risk->likelihood,
                    'impact' => $risk->impact,
                    'risk_level' => $risk->risk_level,
                    'controls_count' => $risk->controls->count(),
                    'is_active' => $risk->is_active,
                ];
            }),
            'available_assertions' => Subprocess::getAvailableAssertions(),
            'created_at' => $subprocess->created_at->toISOString(),
            'updated_at' => $subprocess->updated_at->toISOString(),
        ];

        return $this->jsonResponse($response, $responseData);
    }

    public function create(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $data = $request->getParsedBody();

        $validation = $this->validateSubprocessData($data);
        if (!$validation['valid']) {
            return $this->errorResponse($response, $validation['errors'], 400);
        }

        // Verify process exists
        $process = Process::find($data['process_id']);
        if (!$process) {
            return $this->errorResponse($response, ['Process not found'], 404);
        }

        $subprocess = Subprocess::create([
            'process_id' => $data['process_id'],
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'owner_email' => $data['owner_email'] ?? null,
            'assertions' => $data['assertions'] ?? null,
            'metadata' => $data['metadata'] ?? null,
            'is_active' => $data['is_active'] ?? true,
        ]);

        $subprocess->load('process.company');

        $responseData = [
            'message' => 'Subprocess created successfully',
            'subprocess' => [
                'id' => $subprocess->id,
                'name' => $subprocess->name,
                'description' => $subprocess->description,
                'owner_email' => $subprocess->owner_email,
                'assertions' => $subprocess->assertions,
                'process' => [
                    'id' => $subprocess->process->id,
                    'name' => $subprocess->process->name,
                    'company' => [
                        'id' => $subprocess->process->company->id,
                        'name' => $subprocess->process->company->name,
                    ],
                ],
                'is_active' => $subprocess->is_active,
                'created_at' => $subprocess->created_at->toISOString(),
            ],
        ];

        return $this->jsonResponse($response, $responseData, 201);
    }

    public function update(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $subprocessId = $args['id'];
        $subprocess = Subprocess::find($subprocessId);

        if (!$subprocess) {
            return $this->errorResponse($response, ['Subprocess not found'], 404);
        }

        $data = $request->getParsedBody();

        $validation = $this->validateSubprocessData($data, false);
        if (!$validation['valid']) {
            return $this->errorResponse($response, $validation['errors'], 400);
        }

        if (isset($data['process_id']) && $data['process_id'] !== $subprocess->process_id) {
            $process = Process::find($data['process_id']);
            if (!$process) {
                return $this->errorResponse($response, ['Process not found'], 404);
            }
            $subprocess->process_id = $data['process_id'];
        }

        if (isset($data['name'])) {
            $subprocess->name = $data['name'];
        }

        if (isset($data['description'])) {
            $subprocess->description = $data['description'];
        }

        if (isset($data['owner_email'])) {
            $subprocess->owner_email = $data['owner_email'];
        }

        if (isset($data['assertions'])) {
            $subprocess->assertions = $data['assertions'];
        }

        if (isset($data['metadata'])) {
            $subprocess->metadata = $data['metadata'];
        }

        if (isset($data['is_active'])) {
            $subprocess->is_active = (bool) $data['is_active'];
        }

        $subprocess->save();
        $subprocess->load('process.company');

        $responseData = [
            'message' => 'Subprocess updated successfully',
            'subprocess' => [
                'id' => $subprocess->id,
                'name' => $subprocess->name,
                'description' => $subprocess->description,
                'owner_email' => $subprocess->owner_email,
                'assertions' => $subprocess->assertions,
                'process' => [
                    'id' => $subprocess->process->id,
                    'name' => $subprocess->process->name,
                    'company' => [
                        'id' => $subprocess->process->company->id,
                        'name' => $subprocess->process->company->name,
                    ],
                ],
                'is_active' => $subprocess->is_active,
                'updated_at' => $subprocess->updated_at->toISOString(),
            ],
        ];

        return $this->jsonResponse($response, $responseData);
    }

    public function delete(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $subprocessId = $args['id'];
        $subprocess = Subprocess::find($subprocessId);

        if (!$subprocess) {
            return $this->errorResponse($response, ['Subprocess not found'], 404);
        }

        // Check if subprocess has active risks
        if ($subprocess->activeRisks()->count() > 0) {
            return $this->errorResponse($response, ['Cannot delete subprocess with active risks'], 400);
        }

        $subprocess->delete();

        return $this->jsonResponse($response, ['message' => 'Subprocess deleted successfully']);
    }

    private function validateSubprocessData(?array $data, bool $isCreate = true): array
    {
        if (!$data) {
            return ['valid' => false, 'errors' => ['No data provided']];
        }

        $errors = [];

        if ($isCreate || isset($data['process_id'])) {
            if (!v::uuid()->validate($data['process_id'] ?? '')) {
                $errors[] = 'Valid process ID is required';
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

        if (isset($data['assertions']) && $data['assertions'] !== null) {
            if (!is_array($data['assertions'])) {
                $errors[] = 'Assertions must be an array';
            } else {
                $validAssertions = array_keys(Subprocess::getAvailableAssertions());
                foreach ($data['assertions'] as $assertion) {
                    if (!in_array($assertion, $validAssertions, true)) {
                        $errors[] = "Invalid assertion: {$assertion}";
                    }
                }
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
