<?php

declare(strict_types=1);

namespace AssurKit\Controllers;

use AssurKit\Models\Control;
use AssurKit\Models\Risk;
use Illuminate\Database\Eloquent\Builder;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Respect\Validation\Validator as v;

class RiskControlMatrixController
{
    public function index(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $queryParams = $request->getQueryParams();

        $page = max(1, (int) ($queryParams['page'] ?? 1));
        $limit = min(100, max(10, (int) ($queryParams['limit'] ?? 20)));
        $riskId = $queryParams['risk_id'] ?? '';
        $controlId = $queryParams['control_id'] ?? '';
        $effectiveness = $queryParams['effectiveness'] ?? '';
        $companyId = $queryParams['company_id'] ?? '';

        $query = Risk::with(['controls', 'subprocess.process.company']);

        if ($riskId) {
            $query->where('id', $riskId);
        }

        if ($companyId) {
            $query->whereHas('subprocess.process', function (Builder $q) use ($companyId): void {
                $q->where('company_id', $companyId);
            });
        }

        if ($controlId || $effectiveness) {
            $query->whereHas('controls', function (Builder $q) use ($controlId, $effectiveness): void {
                if ($controlId) {
                    $q->where('controls.id', $controlId);
                }
                if ($effectiveness) {
                    $q->where('risk_control_matrix.effectiveness', $effectiveness);
                }
            });
        }

        $total = $query->count();
        $risks = $query->skip(($page - 1) * $limit)
                      ->take($limit)
                      ->get();

        /** @var array<array{risk_id: string, risk_name: string, risk_type: string, risk_level: string, subprocess: array{id: string, name: string, process: array{id: string, name: string, company: array{id: string, name: string}}}, controls: array<array{control_id: string, control_name: string, control_type: string, frequency: string, is_key_control: bool, effectiveness: string|null, rationale: string|null, last_updated: string}>}> $data */
        $data = [];
        foreach ($risks as $risk) {
            $controlsData = [];
            foreach ($risk->controls as $control) {
                $controlsData[] = [
                    'control_id' => $control->id,
                    'control_name' => $control->name,
                    'control_business_id' => $control->control_id,
                    'control_type' => $control->control_type,
                    'frequency' => $control->frequency,
                    'is_key_control' => $control->is_key_control,
                    'effectiveness' => $control->pivot->effectiveness ?? null,
                    'rationale' => $control->pivot->rationale ?? null,
                    'last_updated' => $control->pivot->updated_at?->toISOString() ?? null,
                ];
            }

            $data[] = [
                'risk_id' => $risk->id,
                'risk_name' => $risk->name,
                'risk_type' => $risk->risk_type,
                'risk_level' => $risk->risk_level,
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
                'controls' => $controlsData,
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
            'effectiveness_options' => ['Not Effective', 'Partially Effective', 'Effective'],
        ];

        return $this->jsonResponse($response, $responseData);
    }

    public function assignControl(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $data = $request->getParsedBody();

        $validation = $this->validateAssignmentData($data);
        if (!$validation['valid']) {
            return $this->errorResponse($response, $validation['errors'], 400);
        }

        $risk = Risk::find($data['risk_id']);
        if (!$risk) {
            return $this->errorResponse($response, ['Risk not found'], 404);
        }

        $control = Control::find($data['control_id']);
        if (!$control) {
            return $this->errorResponse($response, ['Control not found'], 404);
        }

        // Check if relationship already exists
        if ($risk->controls()->where('control_id', $data['control_id'])->exists()) {
            return $this->errorResponse($response, ['Control is already assigned to this risk'], 409);
        }

        // Create the relationship
        $risk->controls()->attach($data['control_id'], [
            'effectiveness' => $data['effectiveness'] ?? 'Not Effective',
            'rationale' => $data['rationale'] ?? null,
            'metadata' => $data['metadata'] ?? null,
            'created_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s'),
        ]);

        $responseData = [
            'message' => 'Control assigned to risk successfully',
            'assignment' => [
                'risk_id' => $risk->id,
                'risk_name' => $risk->name,
                'control_id' => $control->id,
                'control_name' => $control->name,
                'control_business_id' => $control->control_id,
                'effectiveness' => $data['effectiveness'] ?? 'Not Effective',
                'rationale' => $data['rationale'] ?? null,
            ],
        ];

        return $this->jsonResponse($response, $responseData, 201);
    }

    public function updateAssignment(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $data = $request->getParsedBody();

        $validation = $this->validateAssignmentData($data, false);
        if (!$validation['valid']) {
            return $this->errorResponse($response, $validation['errors'], 400);
        }

        $risk = Risk::find($data['risk_id']);
        if (!$risk) {
            return $this->errorResponse($response, ['Risk not found'], 404);
        }

        $control = Control::find($data['control_id']);
        if (!$control) {
            return $this->errorResponse($response, ['Control not found'], 404);
        }

        // Check if relationship exists
        $relationship = $risk->controls()->where('control_id', $data['control_id'])->first();
        if (!$relationship) {
            return $this->errorResponse($response, ['Control is not assigned to this risk'], 404);
        }

        // Update the relationship
        $updateData = ['updated_at' => date('Y-m-d H:i:s')];
        if (isset($data['effectiveness'])) {
            $updateData['effectiveness'] = $data['effectiveness'];
        }
        if (isset($data['rationale'])) {
            $updateData['rationale'] = $data['rationale'];
        }
        if (isset($data['metadata'])) {
            $updateData['metadata'] = $data['metadata'];
        }

        $risk->controls()->updateExistingPivot($data['control_id'], $updateData);

        $responseData = [
            'message' => 'Risk-control assignment updated successfully',
            'assignment' => [
                'risk_id' => $risk->id,
                'risk_name' => $risk->name,
                'control_id' => $control->id,
                'control_name' => $control->name,
                'control_business_id' => $control->control_id,
                'effectiveness' => $data['effectiveness'] ?? $relationship->pivot->effectiveness,
                'rationale' => $data['rationale'] ?? $relationship->pivot->rationale,
            ],
        ];

        return $this->jsonResponse($response, $responseData);
    }

    public function removeAssignment(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $data = $request->getParsedBody();

        if (!isset($data['risk_id']) || !isset($data['control_id'])) {
            return $this->errorResponse($response, ['Risk ID and Control ID are required'], 400);
        }

        $risk = Risk::find($data['risk_id']);
        if (!$risk) {
            return $this->errorResponse($response, ['Risk not found'], 404);
        }

        $control = Control::find($data['control_id']);
        if (!$control) {
            return $this->errorResponse($response, ['Control not found'], 404);
        }

        // Check if relationship exists
        if (!$risk->controls()->where('control_id', $data['control_id'])->exists()) {
            return $this->errorResponse($response, ['Control is not assigned to this risk'], 404);
        }

        // Remove the relationship
        $risk->controls()->detach($data['control_id']);

        $responseData = [
            'message' => 'Control removed from risk successfully',
            'removed_assignment' => [
                'risk_id' => $risk->id,
                'risk_name' => $risk->name,
                'control_id' => $control->id,
                'control_name' => $control->name,
                'control_business_id' => $control->control_id,
            ],
        ];

        return $this->jsonResponse($response, $responseData);
    }

    public function getEffectivenessReport(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $queryParams = $request->getQueryParams();
        $companyId = $queryParams['company_id'] ?? '';

        $query = Risk::with(['controls', 'subprocess.process.company']);

        if ($companyId) {
            $query->whereHas('subprocess.process', function (Builder $q) use ($companyId): void {
                $q->where('company_id', $companyId);
            });
        }

        $risks = $query->get();

        $effectivenessStats = [
            'Not Effective' => 0,
            'Partially Effective' => 0,
            'Effective' => 0,
            'Unassigned' => 0,
        ];

        $totalRisks = $risks->count();
        $totalAssignments = 0;

        foreach ($risks as $risk) {
            if ($risk->controls->count() === 0) {
                $effectivenessStats['Unassigned']++;
            } else {
                foreach ($risk->controls as $control) {
                    $effectiveness = $control->pivot->effectiveness ?? 'Not Effective';
                    $effectivenessStats[$effectiveness]++;
                    $totalAssignments++;
                }
            }
        }

        $responseData = [
            'summary' => [
                'total_risks' => $totalRisks,
                'total_assignments' => $totalAssignments,
                'coverage_percentage' => $totalRisks > 0 ? round((($totalRisks - $effectivenessStats['Unassigned']) / $totalRisks) * 100, 2) : 0,
            ],
            'effectiveness_breakdown' => $effectivenessStats,
            'effectiveness_percentages' => [
                'Not Effective' => $totalAssignments > 0 ? round(($effectivenessStats['Not Effective'] / $totalAssignments) * 100, 2) : 0,
                'Partially Effective' => $totalAssignments > 0 ? round(($effectivenessStats['Partially Effective'] / $totalAssignments) * 100, 2) : 0,
                'Effective' => $totalAssignments > 0 ? round(($effectivenessStats['Effective'] / $totalAssignments) * 100, 2) : 0,
            ],
        ];

        return $this->jsonResponse($response, $responseData);
    }

    private function validateAssignmentData(?array $data, bool $requireIds = true): array
    {
        if (!$data) {
            return ['valid' => false, 'errors' => ['No data provided']];
        }

        $errors = [];

        if ($requireIds || isset($data['risk_id'])) {
            if (!v::uuid()->validate($data['risk_id'] ?? '')) {
                $errors[] = 'Valid risk ID is required';
            }
        }

        if ($requireIds || isset($data['control_id'])) {
            if (!v::uuid()->validate($data['control_id'] ?? '')) {
                $errors[] = 'Valid control ID is required';
            }
        }

        if (isset($data['effectiveness'])) {
            $validEffectiveness = ['Not Effective', 'Partially Effective', 'Effective'];
            if (!in_array($data['effectiveness'], $validEffectiveness, true)) {
                $errors[] = 'Invalid effectiveness. Valid options: ' . implode(', ', $validEffectiveness);
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
