<?php

declare(strict_types=1);

namespace AssurKit\Controllers;

use AssurKit\Models\Control;
use AssurKit\Models\Test;
use Illuminate\Database\Eloquent\Builder;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Respect\Validation\Validator as v;

class TestController
{
    public function index(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $queryParams = $request->getQueryParams();

        $page = max(1, (int) ($queryParams['page'] ?? 1));
        $limit = min(100, max(10, (int) ($queryParams['limit'] ?? 20)));
        $search = $queryParams['search'] ?? '';
        $controlId = $queryParams['control_id'] ?? '';
        $status = $queryParams['status'] ?? '';
        $conclusion = $queryParams['conclusion'] ?? '';
        $testerEmail = $queryParams['tester_email'] ?? '';
        $testMethod = $queryParams['test_method'] ?? '';
        $periodStart = $queryParams['period_start'] ?? '';
        $periodEnd = $queryParams['period_end'] ?? '';
        $overdue = $queryParams['overdue'] ?? '';

        $query = Test::with(['control.risks.subprocess.process.company']);

        if ($controlId) {
            $query->where('control_id', $controlId);
        }

        if ($search) {
            $query->where(function (Builder $q) use ($search): void {
                $q->where('name', 'ILIKE', "%{$search}%")
                  ->orWhere('description', 'ILIKE', "%{$search}%")
                  ->orWhere('test_id', 'ILIKE', "%{$search}%")
                  ->orWhere('tester_email', 'ILIKE', "%{$search}%");
            });
        }

        if ($status) {
            $query->where('status', $status);
        }

        if ($conclusion) {
            $query->where('conclusion', $conclusion);
        }

        if ($testerEmail) {
            $query->byTester($testerEmail);
        }

        if ($testMethod) {
            $query->where('test_method', $testMethod);
        }

        if ($periodStart && $periodEnd) {
            $query->forPeriod($periodStart, $periodEnd);
        }

        $total = $query->count();
        $tests = $query->skip(($page - 1) * $limit)
                      ->take($limit)
                      ->orderBy('created_at', 'desc')
                      ->get();

        // Filter overdue tests if requested
        if ($overdue) {
            $tests = $tests->filter(function ($test) {
                return $test->is_overdue;
            });
        }

        /** @var array<array{id: string, test_id: string, name: string, description: string|null, test_method: string, test_scope: string, sample_size: int|null, period_start: string, period_end: string, tester_email: string, reviewer_email: string|null, status: string, conclusion: string|null, control: array{id: string, control_id: string, name: string, is_key_control: bool}, risk_level: string, test_duration: int|null, is_overdue: bool, created_at: string}> $data */
        $data = [];
        foreach ($tests as $test) {
            $data[] = [
                'id' => $test->id,
                'test_id' => $test->test_id,
                'name' => $test->name,
                'description' => $test->description,
                'test_method' => $test->test_method,
                'test_scope' => $test->test_scope,
                'sample_size' => $test->sample_size,
                'period_start' => $test->period_start->format('Y-m-d'),
                'period_end' => $test->period_end->format('Y-m-d'),
                'tester_email' => $test->tester_email,
                'reviewer_email' => $test->reviewer_email,
                'status' => $test->status,
                'conclusion' => $test->conclusion,
                'control' => [
                    'id' => $test->control->id,
                    'control_id' => $test->control->control_id,
                    'name' => $test->control->name,
                    'is_key_control' => $test->control->is_key_control,
                ],
                'risk_level' => $test->risk_level,
                'test_duration' => $test->test_duration,
                'is_overdue' => $test->is_overdue,
                'created_at' => $test->created_at->toISOString(),
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
                'available_methods' => Test::getAvailableMethods(),
                'available_scopes' => Test::getAvailableScopes(),
                'available_statuses' => Test::getAvailableStatuses(),
                'available_conclusions' => Test::getAvailableConclusions(),
            ],
        ];

        return $this->jsonResponse($response, $responseData);
    }

    public function show(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $testId = $args['id'];
        $test = Test::with(['control.risks.subprocess.process.company'])->find($testId);

        if (!$test) {
            return $this->errorResponse($response, ['Test not found'], 404);
        }

        $responseData = [
            'id' => $test->id,
            'test_id' => $test->test_id,
            'name' => $test->name,
            'description' => $test->description,
            'test_method' => $test->test_method,
            'test_scope' => $test->test_scope,
            'sample_size' => $test->sample_size,
            'sample_criteria' => $test->sample_criteria,
            'period_start' => $test->period_start->format('Y-m-d'),
            'period_end' => $test->period_end->format('Y-m-d'),
            'tester_email' => $test->tester_email,
            'reviewer_email' => $test->reviewer_email,
            'status' => $test->status,
            'test_procedures' => $test->test_procedures,
            'test_results' => $test->test_results,
            'conclusion' => $test->conclusion,
            'deficiency_description' => $test->deficiency_description,
            'management_response' => $test->management_response,
            'evidence_references' => $test->evidence_references,
            'metadata' => $test->metadata,
            'control' => [
                'id' => $test->control->id,
                'control_id' => $test->control->control_id,
                'name' => $test->control->name,
                'control_type' => $test->control->control_type,
                'frequency' => $test->control->frequency,
                'is_key_control' => $test->control->is_key_control,
                'owner_email' => $test->control->owner_email,
            ],
            'workflow_timestamps' => [
                'started_at' => $test->started_at?->toISOString(),
                'submitted_at' => $test->submitted_at?->toISOString(),
                'reviewed_at' => $test->reviewed_at?->toISOString(),
                'concluded_at' => $test->concluded_at?->toISOString(),
            ],
            'risk_level' => $test->risk_level,
            'test_duration' => $test->test_duration,
            'is_overdue' => $test->is_overdue,
            'available_transitions' => $this->getAvailableTransitions($test),
            'available_options' => [
                'methods' => Test::getAvailableMethods(),
                'scopes' => Test::getAvailableScopes(),
                'statuses' => Test::getAvailableStatuses(),
                'conclusions' => Test::getAvailableConclusions(),
            ],
            'created_at' => $test->created_at->toISOString(),
            'updated_at' => $test->updated_at->toISOString(),
        ];

        return $this->jsonResponse($response, $responseData);
    }

    public function create(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $data = $request->getParsedBody();

        $validation = $this->validateTestData($data);
        if (!$validation['valid']) {
            return $this->errorResponse($response, $validation['errors'], 400);
        }

        // Verify control exists
        $control = Control::find($data['control_id']);
        if (!$control) {
            return $this->errorResponse($response, ['Control not found'], 404);
        }

        $test = Test::create([
            'control_id' => $data['control_id'],
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'test_method' => $data['test_method'],
            'test_scope' => $data['test_scope'],
            'sample_size' => $data['sample_size'] ?? null,
            'sample_criteria' => $data['sample_criteria'] ?? null,
            'period_start' => $data['period_start'],
            'period_end' => $data['period_end'],
            'tester_email' => $data['tester_email'],
            'reviewer_email' => $data['reviewer_email'] ?? null,
            'test_procedures' => $data['test_procedures'] ?? null,
            'metadata' => $data['metadata'] ?? null,
            'status' => 'Planned',
        ]);

        $test->load('control');

        $responseData = [
            'message' => 'Test created successfully',
            'test' => [
                'id' => $test->id,
                'test_id' => $test->test_id,
                'name' => $test->name,
                'test_method' => $test->test_method,
                'test_scope' => $test->test_scope,
                'period_start' => $test->period_start->format('Y-m-d'),
                'period_end' => $test->period_end->format('Y-m-d'),
                'tester_email' => $test->tester_email,
                'status' => $test->status,
                'control' => [
                    'id' => $test->control->id,
                    'control_id' => $test->control->control_id,
                    'name' => $test->control->name,
                ],
                'created_at' => $test->created_at->toISOString(),
            ],
        ];

        return $this->jsonResponse($response, $responseData, 201);
    }

    public function update(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $testId = $args['id'];
        $test = Test::find($testId);

        if (!$test) {
            return $this->errorResponse($response, ['Test not found'], 404);
        }

        $data = $request->getParsedBody();

        $validation = $this->validateTestData($data, false);
        if (!$validation['valid']) {
            return $this->errorResponse($response, $validation['errors'], 400);
        }

        // Validate status transitions
        if (isset($data['status']) && $data['status'] !== $test->status) {
            if (!$test->canTransitionTo($data['status'])) {
                return $this->errorResponse($response, ["Cannot transition from {$test->status} to {$data['status']}"], 400);
            }
        }

        $updateFields = [
            'name', 'description', 'test_method', 'test_scope', 'sample_size',
            'sample_criteria', 'period_start', 'period_end', 'tester_email',
            'reviewer_email', 'test_procedures', 'test_results', 'conclusion',
            'deficiency_description', 'management_response', 'evidence_references', 'metadata',
        ];

        foreach ($updateFields as $field) {
            if (isset($data[$field])) {
                $test->$field = $data[$field];
            }
        }

        // Handle status change separately to trigger workflow timestamps
        if (isset($data['status'])) {
            $test->status = $data['status'];
        }

        $test->save();
        $test->load('control');

        $responseData = [
            'message' => 'Test updated successfully',
            'test' => [
                'id' => $test->id,
                'test_id' => $test->test_id,
                'name' => $test->name,
                'status' => $test->status,
                'conclusion' => $test->conclusion,
                'control' => [
                    'id' => $test->control->id,
                    'control_id' => $test->control->control_id,
                    'name' => $test->control->name,
                ],
                'updated_at' => $test->updated_at->toISOString(),
            ],
        ];

        return $this->jsonResponse($response, $responseData);
    }

    public function delete(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $testId = $args['id'];
        $test = Test::find($testId);

        if (!$test) {
            return $this->errorResponse($response, ['Test not found'], 404);
        }

        // Only allow deletion of tests that haven't started
        if ($test->status !== 'Planned') {
            return $this->errorResponse($response, ['Cannot delete test that has been started'], 400);
        }

        $test->delete();

        return $this->jsonResponse($response, ['message' => 'Test deleted successfully']);
    }

    public function getTestingDashboard(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $queryParams = $request->getQueryParams();
        $companyId = $queryParams['company_id'] ?? '';

        $query = Test::with(['control.risks.subprocess.process.company']);

        if ($companyId) {
            $query->whereHas('control.risks.subprocess.process', function (Builder $q) use ($companyId): void {
                $q->where('company_id', $companyId);
            });
        }

        $tests = $query->get();

        $statusBreakdown = [
            'Planned' => 0,
            'In Progress' => 0,
            'Submitted' => 0,
            'In Review' => 0,
            'Concluded' => 0,
        ];

        $conclusionBreakdown = [
            'Effective' => 0,
            'Deficient' => 0,
            'Not Tested' => 0,
            'Pending' => 0,
        ];

        $overdueCount = 0;
        $keyControlTests = 0;
        $deficientKeyControls = 0;

        foreach ($tests as $test) {
            $statusBreakdown[$test->status]++;

            if ($test->conclusion) {
                $conclusionBreakdown[$test->conclusion]++;
            } else {
                $conclusionBreakdown['Pending']++;
            }

            if ($test->is_overdue) {
                $overdueCount++;
            }

            if ($test->control->is_key_control) {
                $keyControlTests++;
                if ($test->conclusion === 'Deficient') {
                    $deficientKeyControls++;
                }
            }
        }

        $totalTests = $tests->count();
        $concludedTests = $statusBreakdown['Concluded'];

        $responseData = [
            'summary' => [
                'total_tests' => $totalTests,
                'concluded_tests' => $concludedTests,
                'completion_percentage' => $totalTests > 0 ? round(($concludedTests / $totalTests) * 100, 2) : 0,
                'overdue_tests' => $overdueCount,
                'key_control_tests' => $keyControlTests,
                'deficient_key_controls' => $deficientKeyControls,
            ],
            'status_breakdown' => $statusBreakdown,
            'conclusion_breakdown' => $conclusionBreakdown,
            'effectiveness_rate' => $concludedTests > 0 ? round(($conclusionBreakdown['Effective'] / $concludedTests) * 100, 2) : 0,
            'deficiency_rate' => $concludedTests > 0 ? round(($conclusionBreakdown['Deficient'] / $concludedTests) * 100, 2) : 0,
        ];

        return $this->jsonResponse($response, $responseData);
    }

    private function getAvailableTransitions(Test $test): array
    {
        $transitions = [];
        $allStatuses = Test::getAvailableStatuses();

        foreach ($allStatuses as $status) {
            if ($test->canTransitionTo($status)) {
                $transitions[] = $status;
            }
        }

        return $transitions;
    }

    private function validateTestData(?array $data, bool $isCreate = true): array
    {
        if (!$data) {
            return ['valid' => false, 'errors' => ['No data provided']];
        }

        $errors = [];

        if ($isCreate || isset($data['control_id'])) {
            if (!v::uuid()->validate($data['control_id'] ?? '')) {
                $errors[] = 'Valid control ID is required';
            }
        }

        if ($isCreate || isset($data['name'])) {
            if (!v::stringType()->notEmpty()->length(2, 255)->validate($data['name'] ?? '')) {
                $errors[] = 'Name is required and must be between 2 and 255 characters';
            }
        }

        if ($isCreate || isset($data['test_method'])) {
            $validMethods = Test::getAvailableMethods();
            if (!in_array($data['test_method'] ?? '', $validMethods, true)) {
                $errors[] = 'Invalid test method. Valid options: ' . implode(', ', $validMethods);
            }
        }

        if ($isCreate || isset($data['test_scope'])) {
            $validScopes = Test::getAvailableScopes();
            if (!in_array($data['test_scope'] ?? '', $validScopes, true)) {
                $errors[] = 'Invalid test scope. Valid options: ' . implode(', ', $validScopes);
            }
        }

        if ($isCreate || isset($data['period_start'])) {
            if (!v::date('Y-m-d')->validate($data['period_start'] ?? '')) {
                $errors[] = 'Valid period start date is required (YYYY-MM-DD)';
            }
        }

        if ($isCreate || isset($data['period_end'])) {
            if (!v::date('Y-m-d')->validate($data['period_end'] ?? '')) {
                $errors[] = 'Valid period end date is required (YYYY-MM-DD)';
            }
        }

        if (isset($data['period_start']) && isset($data['period_end'])) {
            if ($data['period_start'] > $data['period_end']) {
                $errors[] = 'Period start date must be before period end date';
            }
        }

        if ($isCreate || isset($data['tester_email'])) {
            if (!v::email()->validate($data['tester_email'] ?? '')) {
                $errors[] = 'Valid tester email is required';
            }
        }

        if (isset($data['reviewer_email']) && $data['reviewer_email'] !== null) {
            if (!v::email()->validate($data['reviewer_email'])) {
                $errors[] = 'Valid reviewer email is required';
            }
        }

        if (isset($data['sample_size']) && $data['sample_size'] !== null) {
            if (!v::intVal()->min(1)->validate($data['sample_size'])) {
                $errors[] = 'Sample size must be a positive integer';
            }
        }

        if (isset($data['status'])) {
            $validStatuses = Test::getAvailableStatuses();
            if (!in_array($data['status'], $validStatuses, true)) {
                $errors[] = 'Invalid status. Valid options: ' . implode(', ', $validStatuses);
            }
        }

        if (isset($data['conclusion'])) {
            $validConclusions = Test::getAvailableConclusions();
            if (!in_array($data['conclusion'], $validConclusions, true)) {
                $errors[] = 'Invalid conclusion. Valid options: ' . implode(', ', $validConclusions);
            }
        }

        if (isset($data['evidence_references']) && $data['evidence_references'] !== null) {
            if (!is_array($data['evidence_references'])) {
                $errors[] = 'Evidence references must be an array';
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
