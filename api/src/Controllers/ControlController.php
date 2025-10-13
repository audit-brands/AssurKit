<?php

declare(strict_types=1);

namespace AssurKit\Controllers;

use AssurKit\Models\Control;
use AssurKit\Models\Risk;
use Illuminate\Database\Eloquent\Builder;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Respect\Validation\Validator as v;

class ControlController
{
    public function index(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $queryParams = $request->getQueryParams();

        $page = max(1, (int) ($queryParams['page'] ?? 1));
        $limit = min(100, max(10, (int) ($queryParams['limit'] ?? 20)));
        $search = $queryParams['search'] ?? '';
        $controlType = $queryParams['control_type'] ?? '';
        $frequency = $queryParams['frequency'] ?? '';
        $automationLevel = $queryParams['automation_level'] ?? '';
        $status = $queryParams['status'] ?? '';
        $isKeyControl = $queryParams['is_key_control'] ?? '';
        $ownerEmail = $queryParams['owner_email'] ?? '';

        $query = Control::with(['risks.subprocess.process.company']);

        if ($search) {
            $query->where(function (Builder $q) use ($search): void {
                $q->where('name', 'ILIKE', "%{$search}%")
                  ->orWhere('description', 'ILIKE', "%{$search}%")
                  ->orWhere('control_id', 'ILIKE', "%{$search}%");
            });
        }

        if ($controlType) {
            $query->where('control_type', $controlType);
        }

        if ($frequency) {
            $query->where('frequency', $frequency);
        }

        if ($automationLevel) {
            $query->where('automation_level', $automationLevel);
        }

        if ($status) {
            $query->where('status', $status);
        }

        if ($isKeyControl !== '') {
            $query->where('is_key_control', (bool) $isKeyControl);
        }

        if ($ownerEmail) {
            $query->where('owner_email', 'ILIKE', "%{$ownerEmail}%");
        }

        $total = $query->count();
        $controls = $query->skip(($page - 1) * $limit)
                         ->take($limit)
                         ->orderBy('control_id')
                         ->get();

        /** @var array<array{id: string, control_id: string, name: string, description: string, control_type: string, frequency: string, automation_level: string, is_key_control: bool, owner_email: string, reviewer_email: string|null, status: string, risks_count: int, frequency_weight: int, automation_score: int, created_at: string}> $data */
        $data = [];
        foreach ($controls as $control) {
            $data[] = [
                'id' => $control->id,
                'control_id' => $control->control_id,
                'name' => $control->name,
                'description' => $control->description,
                'control_type' => $control->control_type,
                'frequency' => $control->frequency,
                'automation_level' => $control->automation_level,
                'is_key_control' => $control->is_key_control,
                'owner_email' => $control->owner_email,
                'reviewer_email' => $control->reviewer_email,
                'status' => $control->status,
                'risks_count' => $control->risks->count(),
                'frequency_weight' => $control->frequency_weight,
                'automation_score' => $control->automation_score,
                'created_at' => $control->created_at->toISOString(),
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
                'available_types' => Control::getAvailableTypes(),
                'available_frequencies' => Control::getAvailableFrequencies(),
                'available_automation_levels' => Control::getAvailableAutomationLevels(),
                'available_statuses' => Control::getAvailableStatuses(),
            ],
        ];

        return $this->jsonResponse($response, $responseData);
    }

    public function show(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $controlId = $args['id'];
        $control = Control::with(['risks.subprocess.process.company'])->find($controlId);

        if (!$control) {
            return $this->errorResponse($response, ['Control not found'], 404);
        }

        $responseData = [
            'id' => $control->id,
            'control_id' => $control->control_id,
            'name' => $control->name,
            'description' => $control->description,
            'control_type' => $control->control_type,
            'frequency' => $control->frequency,
            'automation_level' => $control->automation_level,
            'is_key_control' => $control->is_key_control,
            'owner_email' => $control->owner_email,
            'reviewer_email' => $control->reviewer_email,
            'evidence_requirements' => $control->evidence_requirements,
            'metadata' => $control->metadata,
            'status' => $control->status,
            'frequency_weight' => $control->frequency_weight,
            'automation_score' => $control->automation_score,
            'risks' => $control->risks->map(function ($risk): array {
                return [
                    'id' => $risk->id,
                    'name' => $risk->name,
                    'risk_type' => $risk->risk_type,
                    'likelihood' => $risk->likelihood,
                    'impact' => $risk->impact,
                    'risk_level' => $risk->risk_level,
                    'effectiveness' => $risk->pivot->effectiveness ?? null,
                    'rationale' => $risk->pivot->rationale ?? null,
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
                ];
            }),
            'available_options' => [
                'types' => Control::getAvailableTypes(),
                'frequencies' => Control::getAvailableFrequencies(),
                'automation_levels' => Control::getAvailableAutomationLevels(),
                'statuses' => Control::getAvailableStatuses(),
            ],
            'created_at' => $control->created_at->toISOString(),
            'updated_at' => $control->updated_at->toISOString(),
        ];

        return $this->jsonResponse($response, $responseData);
    }

    public function create(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $data = $request->getParsedBody();

        $validation = $this->validateControlData($data);
        if (!$validation['valid']) {
            return $this->errorResponse($response, $validation['errors'], 400);
        }

        $control = Control::create([
            'control_id' => $data['control_id'] ?? null, // Auto-generated if not provided
            'name' => $data['name'],
            'description' => $data['description'],
            'control_type' => $data['control_type'],
            'frequency' => $data['frequency'],
            'automation_level' => $data['automation_level'],
            'is_key_control' => $data['is_key_control'] ?? false,
            'owner_email' => $data['owner_email'],
            'reviewer_email' => $data['reviewer_email'] ?? null,
            'evidence_requirements' => $data['evidence_requirements'] ?? null,
            'metadata' => $data['metadata'] ?? null,
            'status' => $data['status'] ?? 'Draft',
        ]);

        $responseData = [
            'message' => 'Control created successfully',
            'control' => [
                'id' => $control->id,
                'control_id' => $control->control_id,
                'name' => $control->name,
                'description' => $control->description,
                'control_type' => $control->control_type,
                'frequency' => $control->frequency,
                'automation_level' => $control->automation_level,
                'is_key_control' => $control->is_key_control,
                'owner_email' => $control->owner_email,
                'reviewer_email' => $control->reviewer_email,
                'status' => $control->status,
                'frequency_weight' => $control->frequency_weight,
                'automation_score' => $control->automation_score,
                'created_at' => $control->created_at->toISOString(),
            ],
        ];

        return $this->jsonResponse($response, $responseData, 201);
    }

    public function update(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $controlId = $args['id'];
        $control = Control::find($controlId);

        if (!$control) {
            return $this->errorResponse($response, ['Control not found'], 404);
        }

        $data = $request->getParsedBody();

        $validation = $this->validateControlData($data, false);
        if (!$validation['valid']) {
            return $this->errorResponse($response, $validation['errors'], 400);
        }

        $updateFields = [
            'name', 'description', 'control_type', 'frequency', 'automation_level',
            'owner_email', 'reviewer_email', 'evidence_requirements', 'metadata', 'status'
        ];

        foreach ($updateFields as $field) {
            if (isset($data[$field])) {
                $control->$field = $data[$field];
            }
        }

        if (isset($data['is_key_control'])) {
            $control->is_key_control = (bool) $data['is_key_control'];
        }

        $control->save();

        $responseData = [
            'message' => 'Control updated successfully',
            'control' => [
                'id' => $control->id,
                'control_id' => $control->control_id,
                'name' => $control->name,
                'description' => $control->description,
                'control_type' => $control->control_type,
                'frequency' => $control->frequency,
                'automation_level' => $control->automation_level,
                'is_key_control' => $control->is_key_control,
                'owner_email' => $control->owner_email,
                'reviewer_email' => $control->reviewer_email,
                'status' => $control->status,
                'frequency_weight' => $control->frequency_weight,
                'automation_score' => $control->automation_score,
                'updated_at' => $control->updated_at->toISOString(),
            ],
        ];

        return $this->jsonResponse($response, $responseData);
    }

    public function delete(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $controlId = $args['id'];
        $control = Control::find($controlId);

        if (!$control) {
            return $this->errorResponse($response, ['Control not found'], 404);
        }

        // Check if control has risk associations
        if ($control->risks()->count() > 0) {
            return $this->errorResponse($response, ['Cannot delete control with associated risks. Remove risk associations first.'], 400);
        }

        $control->delete();

        return $this->jsonResponse($response, ['message' => 'Control deleted successfully']);
    }

    private function validateControlData(?array $data, bool $isCreate = true): array
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

        if ($isCreate || isset($data['description'])) {
            if (!v::stringType()->notEmpty()->validate($data['description'] ?? '')) {
                $errors[] = 'Description is required';
            }
        }

        if ($isCreate || isset($data['control_type'])) {
            $validTypes = Control::getAvailableTypes();
            if (!in_array($data['control_type'] ?? '', $validTypes, true)) {
                $errors[] = 'Invalid control type. Valid options: ' . implode(', ', $validTypes);
            }
        }

        if ($isCreate || isset($data['frequency'])) {
            $validFrequencies = Control::getAvailableFrequencies();
            if (!in_array($data['frequency'] ?? '', $validFrequencies, true)) {
                $errors[] = 'Invalid frequency. Valid options: ' . implode(', ', $validFrequencies);
            }
        }

        if ($isCreate || isset($data['automation_level'])) {
            $validLevels = Control::getAvailableAutomationLevels();
            if (!in_array($data['automation_level'] ?? '', $validLevels, true)) {
                $errors[] = 'Invalid automation level. Valid options: ' . implode(', ', $validLevels);
            }
        }

        if ($isCreate || isset($data['owner_email'])) {
            if (!v::email()->validate($data['owner_email'] ?? '')) {
                $errors[] = 'Valid owner email is required';
            }
        }

        if (isset($data['reviewer_email']) && $data['reviewer_email'] !== null) {
            if (!v::email()->validate($data['reviewer_email'])) {
                $errors[] = 'Valid reviewer email is required';
            }
        }

        if (isset($data['status'])) {
            $validStatuses = Control::getAvailableStatuses();
            if (!in_array($data['status'], $validStatuses, true)) {
                $errors[] = 'Invalid status. Valid options: ' . implode(', ', $validStatuses);
            }
        }

        if (isset($data['evidence_requirements']) && $data['evidence_requirements'] !== null) {
            if (!is_array($data['evidence_requirements'])) {
                $errors[] = 'Evidence requirements must be an array';
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