<?php

declare(strict_types=1);

namespace AssurKit\Controllers;

use AssurKit\Models\Risk;
use AssurKit\Models\Subprocess;
use Illuminate\Database\Eloquent\Builder;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Respect\Validation\Validator as v;

class RiskController
{
    public function index(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $queryParams = $request->getQueryParams();

        $page = max(1, (int) ($queryParams['page'] ?? 1));
        $limit = min(100, max(10, (int) ($queryParams['limit'] ?? 20)));
        $search = $queryParams['search'] ?? '';
        $subprocessId = $queryParams['subprocess_id'] ?? '';
        $riskType = $queryParams['risk_type'] ?? '';
        $likelihood = $queryParams['likelihood'] ?? '';
        $impact = $queryParams['impact'] ?? '';
        $riskLevel = $queryParams['risk_level'] ?? '';
        $active = $queryParams['active'] ?? '';

        $query = Risk::with(['subprocess.process.company', 'controls']);

        if ($subprocessId) {
            $query->where('subprocess_id', $subprocessId);
        }

        if ($search) {
            $query->where(function (Builder $q) use ($search): void {
                $q->where('name', 'ILIKE', "%{$search}%")
                  ->orWhere('description', 'ILIKE', "%{$search}%");
            });
        }

        if ($riskType) {
            $query->where('risk_type', $riskType);
        }

        if ($likelihood) {
            $query->where('likelihood', $likelihood);
        }

        if ($impact) {
            $query->where('impact', $impact);
        }

        if ($active !== '') {
            $query->where('is_active', (bool) $active);
        }

        $total = $query->count();
        $risks = $query->skip(($page - 1) * $limit)
                      ->take($limit)
                      ->orderBy('name')
                      ->get();

        // Filter by calculated risk level if specified
        if ($riskLevel) {
            $risks = $risks->filter(function ($risk) use ($riskLevel) {
                return $risk->risk_level === $riskLevel;
            });
        }

        /** @var array<array{id: string, name: string, description: string, risk_type: string, likelihood: string, impact: string, risk_level: string, calculated_risk_score: int, assertions: array<string>|null, subprocess: array{id: string, name: string, process: array{id: string, name: string, company: array{id: string, name: string}}}, controls_count: int, is_active: bool, created_at: string}> $data */
        $data = [];
        foreach ($risks as $risk) {
            $data[] = [
                'id' => $risk->id,
                'name' => $risk->name,
                'description' => $risk->description,
                'risk_type' => $risk->risk_type,
                'likelihood' => $risk->likelihood,
                'impact' => $risk->impact,
                'risk_level' => $risk->risk_level,
                'calculated_risk_score' => $risk->calculated_risk_score,
                'assertions' => $risk->assertions,
                'subprocess' => [
                    'id' => $risk->subprocess->id,
                    'name' => $risk->subprocess->name,
                    'process' => [
                        'id' => $risk->subprocess->process->id,
                        'name' => $risk->subprocess->process->name,
                        'company' => [
                            'id' => $risk->subprocess->process->company->id,
                            'name' => $risk->subprocess->process->company->name,
                        ],
                    ],
                ],
                'controls_count' => $risk->controls->count(),
                'is_active' => $risk->is_active,
                'created_at' => $risk->created_at->toISOString(),
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
            'filters' => [
                'available_risk_types' => Risk::getAvailableRiskTypes(),
                'available_levels' => Risk::getAvailableLevels(),
                'available_assertions' => Risk::getAvailableAssertions(),
            ],
        ];

        return $this->jsonResponse($response, $responseData);
    }

    public function show(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $riskId = $args['id'];
        $risk = Risk::with(['subprocess.process.company', 'controls'])->find($riskId);

        if (!$risk) {
            return $this->errorResponse($response, ['Risk not found'], 404);
        }

        $responseData = [
            'id' => $risk->id,
            'name' => $risk->name,
            'description' => $risk->description,
            'risk_type' => $risk->risk_type,
            'likelihood' => $risk->likelihood,
            'impact' => $risk->impact,
            'risk_level' => $risk->risk_level,
            'calculated_risk_score' => $risk->calculated_risk_score,
            'assertions' => $risk->assertions,
            'metadata' => $risk->metadata,
            'is_active' => $risk->is_active,
            'subprocess' => [
                'id' => $risk->subprocess->id,
                'name' => $risk->subprocess->name,
                'process' => [
                    'id' => $risk->subprocess->process->id,
                    'name' => $risk->subprocess->process->name,
                    'company' => [
                        'id' => $risk->subprocess->process->company->id,
                        'name' => $risk->subprocess->process->company->name,
                    ],
                ],
            ],
            'controls' => $risk->controls->map(function ($control): array {
                return [
                    'id' => $control->id,
                    'control_id' => $control->control_id,
                    'name' => $control->name,
                    'control_type' => $control->control_type,
                    'frequency' => $control->frequency,
                    'is_key_control' => $control->is_key_control,
                    'effectiveness' => $control->pivot->effectiveness ?? null,
                    'rationale' => $control->pivot->rationale ?? null,
                ];
            }),
            'available_options' => [
                'risk_types' => Risk::getAvailableRiskTypes(),
                'levels' => Risk::getAvailableLevels(),
                'assertions' => Risk::getAvailableAssertions(),
            ],
            'created_at' => $risk->created_at->toISOString(),
            'updated_at' => $risk->updated_at->toISOString(),
        ];

        return $this->jsonResponse($response, $responseData);
    }

    public function create(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $data = $request->getParsedBody();

        $validation = $this->validateRiskData($data);
        if (!$validation['valid']) {
            return $this->errorResponse($response, $validation['errors'], 400);
        }

        // Verify subprocess exists
        $subprocess = Subprocess::find($data['subprocess_id']);
        if (!$subprocess) {
            return $this->errorResponse($response, ['Subprocess not found'], 404);
        }

        $risk = Risk::create([
            'subprocess_id' => $data['subprocess_id'],
            'name' => $data['name'],
            'description' => $data['description'],
            'risk_type' => $data['risk_type'],
            'likelihood' => $data['likelihood'],
            'impact' => $data['impact'],
            'assertions' => $data['assertions'] ?? null,
            'metadata' => $data['metadata'] ?? null,
            'is_active' => $data['is_active'] ?? true,
        ]);

        $risk->load('subprocess.process.company');

        $responseData = [
            'message' => 'Risk created successfully',
            'risk' => [
                'id' => $risk->id,
                'name' => $risk->name,
                'description' => $risk->description,
                'risk_type' => $risk->risk_type,
                'likelihood' => $risk->likelihood,
                'impact' => $risk->impact,
                'risk_level' => $risk->risk_level,
                'calculated_risk_score' => $risk->calculated_risk_score,
                'assertions' => $risk->assertions,
                'subprocess' => [
                    'id' => $risk->subprocess->id,
                    'name' => $risk->subprocess->name,
                    'process' => [
                        'id' => $risk->subprocess->process->id,
                        'name' => $risk->subprocess->process->name,
                        'company' => [
                            'id' => $risk->subprocess->process->company->id,
                            'name' => $risk->subprocess->process->company->name,
                        ],
                    ],
                ],
                'is_active' => $risk->is_active,
                'created_at' => $risk->created_at->toISOString(),
            ],
        ];

        return $this->jsonResponse($response, $responseData, 201);
    }

    public function update(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $riskId = $args['id'];
        $risk = Risk::find($riskId);

        if (!$risk) {
            return $this->errorResponse($response, ['Risk not found'], 404);
        }

        $data = $request->getParsedBody();

        $validation = $this->validateRiskData($data, false);
        if (!$validation['valid']) {
            return $this->errorResponse($response, $validation['errors'], 400);
        }

        if (isset($data['subprocess_id']) && $data['subprocess_id'] !== $risk->subprocess_id) {
            $subprocess = Subprocess::find($data['subprocess_id']);
            if (!$subprocess) {
                return $this->errorResponse($response, ['Subprocess not found'], 404);
            }
            $risk->subprocess_id = $data['subprocess_id'];
        }

        $updateFields = ['name', 'description', 'risk_type', 'likelihood', 'impact', 'assertions', 'metadata'];
        foreach ($updateFields as $field) {
            if (isset($data[$field])) {
                $risk->$field = $data[$field];
            }
        }

        if (isset($data['is_active'])) {
            $risk->is_active = (bool) $data['is_active'];
        }

        $risk->save();
        $risk->load('subprocess.process.company');

        $responseData = [
            'message' => 'Risk updated successfully',
            'risk' => [
                'id' => $risk->id,
                'name' => $risk->name,
                'description' => $risk->description,
                'risk_type' => $risk->risk_type,
                'likelihood' => $risk->likelihood,
                'impact' => $risk->impact,
                'risk_level' => $risk->risk_level,
                'calculated_risk_score' => $risk->calculated_risk_score,
                'assertions' => $risk->assertions,
                'subprocess' => [
                    'id' => $risk->subprocess->id,
                    'name' => $risk->subprocess->name,
                    'process' => [
                        'id' => $risk->subprocess->process->id,
                        'name' => $risk->subprocess->process->name,
                        'company' => [
                            'id' => $risk->subprocess->process->company->id,
                            'name' => $risk->subprocess->process->company->name,
                        ],
                    ],
                ],
                'is_active' => $risk->is_active,
                'updated_at' => $risk->updated_at->toISOString(),
            ],
        ];

        return $this->jsonResponse($response, $responseData);
    }

    public function delete(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $riskId = $args['id'];
        $risk = Risk::find($riskId);

        if (!$risk) {
            return $this->errorResponse($response, ['Risk not found'], 404);
        }

        // Check if risk has associated controls
        if ($risk->controls()->count() > 0) {
            return $this->errorResponse($response, ['Cannot delete risk with associated controls. Remove control associations first.'], 400);
        }

        $risk->delete();

        return $this->jsonResponse($response, ['message' => 'Risk deleted successfully']);
    }

    private function validateRiskData(?array $data, bool $isCreate = true): array
    {
        if (!$data) {
            return ['valid' => false, 'errors' => ['No data provided']];
        }

        $errors = [];

        if ($isCreate || isset($data['subprocess_id'])) {
            if (!v::uuid()->validate($data['subprocess_id'] ?? '')) {
                $errors[] = 'Valid subprocess ID is required';
            }
        }

        if ($isCreate || isset($data['name'])) {
            if (!v::stringType()->notEmpty()->length(2, 255)->validate($data['name'] ?? '')) {
                $errors[] = 'Name is required and must be between 2 and 255 characters';
            }
        }

        if ($isCreate || isset($data['description'])) {
            if (!v::stringType()->notEmpty()->validate($data['description'] ?? '')) {
                $errors[] = 'Description is required';
            }
        }

        if ($isCreate || isset($data['risk_type'])) {
            $validTypes = Risk::getAvailableRiskTypes();
            if (!in_array($data['risk_type'] ?? '', $validTypes, true)) {
                $errors[] = 'Invalid risk type. Valid options: ' . implode(', ', $validTypes);
            }
        }

        if ($isCreate || isset($data['likelihood'])) {
            $validLevels = Risk::getAvailableLevels();
            if (!in_array($data['likelihood'] ?? '', $validLevels, true)) {
                $errors[] = 'Invalid likelihood. Valid options: ' . implode(', ', $validLevels);
            }
        }

        if ($isCreate || isset($data['impact'])) {
            $validLevels = Risk::getAvailableLevels();
            if (!in_array($data['impact'] ?? '', $validLevels, true)) {
                $errors[] = 'Invalid impact. Valid options: ' . implode(', ', $validLevels);
            }
        }

        if (isset($data['assertions']) && $data['assertions'] !== null) {
            if (!is_array($data['assertions'])) {
                $errors[] = 'Assertions must be an array';
            } else {
                $validAssertions = array_keys(Risk::getAvailableAssertions());
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