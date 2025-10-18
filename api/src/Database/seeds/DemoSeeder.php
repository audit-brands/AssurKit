<?php

declare(strict_types=1);

namespace AssurKit\Database\Seeds;

use AssurKit\Models\Company;
use AssurKit\Models\Control;
use AssurKit\Models\Evidence;
use AssurKit\Models\Process;
use AssurKit\Models\Risk;
use AssurKit\Models\Role;
use AssurKit\Models\Subprocess;
use AssurKit\Models\Test;
use AssurKit\Models\User;

/**
 * Comprehensive demo seeder for AssurKit SOX workflow.
 *
 * Creates a complete demo environment with:
 * - Users with different roles
 * - Company with processes and subprocesses
 * - Risks and controls (RCM)
 * - Tests with evidence
 * - Issues from exceptions
 */
class DemoSeeder
{
    public function run(): void
    {
        echo "Starting AssurKit demo seeder...\n";

        // Create roles
        $this->createRoles();

        // Create users
        $users = $this->createUsers();

        // Create company with processes and subprocesses
        $company = $this->createCompanyStructure();

        // Create risks
        $risks = $this->createRisks($company);

        // Create controls
        $controls = $this->createControls($risks, $users);

        // Create tests
        $tests = $this->createTests($controls, $users);

        // Create evidence
        $this->createEvidence($tests, $users);

        echo "\n✓ Demo seeder completed successfully!\n";
        echo "\nDemo Credentials:\n";
        echo "  Admin:   admin@assurkit.local / admin123\n";
        echo "  Manager: manager@assurkit.local / manager123\n";
        echo "  Tester:  tester@assurkit.local / tester123\n";
        echo "  Viewer:  viewer@assurkit.local / viewer123\n\n";
    }

    private function createRoles(): void
    {
        echo "Creating roles...\n";

        $roles = ['Admin', 'Manager', 'Tester', 'Viewer'];

        foreach ($roles as $roleName) {
            if (!Role::where('name', $roleName)->exists()) {
                Role::create(['name' => $roleName]);
                echo "  ✓ Created role: {$roleName}\n";
            }
        }
    }

    private function createUsers(): array
    {
        echo "\nCreating users...\n";

        $users = [];

        // Admin user
        $admin = User::createUser('admin@assurkit.local', 'Admin User', 'admin123');
        $admin->assignRole('Admin');
        $users['admin'] = $admin;
        echo "  ✓ Created admin user\n";

        // Manager user
        $manager = User::createUser('manager@assurkit.local', 'Finance Manager', 'manager123');
        $manager->assignRole('Manager');
        $users['manager'] = $manager;
        echo "  ✓ Created manager user\n";

        // Tester user
        $tester = User::createUser('tester@assurkit.local', 'SOX Tester', 'tester123');
        $tester->assignRole('Tester');
        $users['tester'] = $tester;
        echo "  ✓ Created tester user\n";

        // Viewer user
        $viewer = User::createUser('viewer@assurkit.local', 'External Auditor', 'viewer123');
        $viewer->assignRole('Viewer');
        $users['viewer'] = $viewer;
        echo "  ✓ Created viewer user\n";

        return $users;
    }

    private function createCompanyStructure(): Company
    {
        echo "\nCreating company structure...\n";

        $company = Company::create([
            'name' => 'Acme Corporation',
            'description' => 'Global technology company specializing in enterprise software',
            'ticker_symbol' => 'ACME',
            'industry' => 'Technology',
            'metadata' => [
                'fiscal_year_end' => 'December 31',
                'sox_scope' => 'Full',
                'market_cap' => '5B',
                'employee_count' => 2500,
            ],
        ]);
        echo "  ✓ Created company: {$company->name}\n";

        // Revenue process
        $revenueProcess = Process::create([
            'company_id' => $company->id,
            'name' => 'Revenue Recognition',
            'description' => 'Process for recognizing revenue from software subscriptions and professional services',
            'owner_email' => 'cfo@acmecorp.com',
            'metadata' => [
                'cycle' => 'Revenue',
                'risk_level' => 'High',
                'sox_significant' => true,
            ],
        ]);
        echo "  ✓ Created process: Revenue Recognition\n";

        // Revenue subprocesses
        Subprocess::create([
            'process_id' => $revenueProcess->id,
            'name' => 'Subscription Revenue',
            'description' => 'Recognition of recurring SaaS subscription revenue',
            'owner_email' => 'revenue.accounting@acmecorp.com',
            'assertions' => ['existence_occurrence', 'completeness', 'accuracy_valuation', 'cutoff'],
            'metadata' => ['automation_level' => 'Automated', 'frequency' => 'Daily'],
        ]);

        Subprocess::create([
            'process_id' => $revenueProcess->id,
            'name' => 'Professional Services',
            'description' => 'Recognition of consulting and implementation services revenue',
            'owner_email' => 'services.accounting@acmecorp.com',
            'assertions' => ['existence_occurrence', 'completeness', 'accuracy_valuation'],
            'metadata' => ['automation_level' => 'Semi-automated', 'frequency' => 'Monthly'],
        ]);

        // Procurement process
        $procurementProcess = Process::create([
            'company_id' => $company->id,
            'name' => 'Procurement to Pay',
            'description' => 'End-to-end process for purchasing goods/services and making payments',
            'owner_email' => 'cfo@acmecorp.com',
            'metadata' => [
                'cycle' => 'Expenditure',
                'risk_level' => 'Medium',
                'sox_significant' => true,
            ],
        ]);
        echo "  ✓ Created process: Procurement to Pay\n";

        Subprocess::create([
            'process_id' => $procurementProcess->id,
            'name' => 'Vendor Management',
            'description' => 'Vendor onboarding, approval, and maintenance',
            'owner_email' => 'procurement@acmecorp.com',
            'assertions' => ['existence_occurrence', 'rights_obligations'],
            'metadata' => ['automation_level' => 'Semi-automated', 'frequency' => 'Weekly'],
        ]);

        Subprocess::create([
            'process_id' => $procurementProcess->id,
            'name' => 'Purchase Order Processing',
            'description' => 'Creating, approving, and managing purchase orders',
            'owner_email' => 'procurement@acmecorp.com',
            'assertions' => ['completeness', 'accuracy_valuation', 'rights_obligations'],
            'metadata' => ['automation_level' => 'Automated', 'frequency' => 'Daily'],
        ]);

        // Payroll process
        $payrollProcess = Process::create([
            'company_id' => $company->id,
            'name' => 'Payroll Processing',
            'description' => 'Employee compensation, benefits, and tax processing',
            'owner_email' => 'hr@acmecorp.com',
            'metadata' => [
                'cycle' => 'Human Resources',
                'risk_level' => 'Medium',
                'sox_significant' => false,
            ],
        ]);
        echo "  ✓ Created process: Payroll Processing\n";

        Subprocess::create([
            'process_id' => $payrollProcess->id,
            'name' => 'Bi-Weekly Payroll',
            'description' => 'Regular employee payroll processing and payment',
            'owner_email' => 'payroll@acmecorp.com',
            'assertions' => ['completeness', 'accuracy_valuation'],
            'metadata' => ['automation_level' => 'Automated', 'frequency' => 'Bi-weekly'],
        ]);

        return $company;
    }

    private function createRisks(Company $company): array
    {
        echo "\nCreating risks...\n";

        $risks = [];
        $processes = $company->processes;

        // Revenue risks
        $revenueProcess = $processes->firstWhere('name', 'Revenue Recognition');
        $subscriptionSub = $revenueProcess->subprocesses->firstWhere('name', 'Subscription Revenue');

        $risks[] = Risk::create([
            'subprocess_id' => $subscriptionSub->id,
            'name' => 'Premature Revenue Recognition',
            'description' => 'Revenue could be recognized before subscription services are delivered or before contract terms are met',
            'risk_drivers' => ['Complex contract terms', 'Manual revenue calculations', 'System integration gaps'],
            'assertions' => ['existence_occurrence', 'cutoff'],
            'impact' => 'High',
            'likelihood' => 'Medium',
            'metadata' => ['financial_impact' => '10M', 'regulatory_concern' => true],
        ]);

        $risks[] = Risk::create([
            'subprocess_id' => $subscriptionSub->id,
            'name' => 'Incomplete Revenue Capture',
            'description' => 'All valid subscription revenue may not be captured in the billing system',
            'risk_drivers' => ['Manual data entry', 'System interface failures', 'Incomplete customer setup'],
            'assertions' => ['completeness'],
            'impact' => 'High',
            'likelihood' => 'Low',
            'metadata' => ['financial_impact' => '5M'],
        ]);

        // Procurement risks
        $procurementProcess = $processes->firstWhere('name', 'Procurement to Pay');
        $vendorSub = $procurementProcess->subprocesses->firstWhere('name', 'Vendor Management');

        $risks[] = Risk::create([
            'subprocess_id' => $vendorSub->id,
            'name' => 'Unauthorized Vendor Payments',
            'description' => 'Payments could be made to fraudulent or unauthorized vendors',
            'risk_drivers' => ['Inadequate vendor verification', 'Lack of segregation of duties', 'Weak access controls'],
            'assertions' => ['existence_occurrence', 'rights_obligations'],
            'impact' => 'Medium',
            'likelihood' => 'Medium',
            'metadata' => ['fraud_risk' => true],
        ]);

        echo '  ✓ Created ' . count($risks) . " risks\n";

        return $risks;
    }

    private function createControls(array $risks, array $users): array
    {
        echo "\nCreating controls...\n";

        $controls = [];

        // Control for premature revenue recognition
        $controls[] = Control::create([
            'name' => 'Revenue Recognition Review',
            'description' => 'Monthly review of revenue recognized to ensure compliance with ASC 606',
            'control_type' => 'Detective',
            'frequency' => 'Monthly',
            'automation_level' => 'Manual',
            'is_key_control' => true,
            'owner_email' => 'revenue.accounting@acmecorp.com',
            'reviewer_email' => 'cfo@acmecorp.com',
            'evidence_requirements' => [
                'Revenue recognition memo',
                'Contract review checklist',
                'Executive sign-off',
            ],
            'metadata' => [
                'sox_control' => true,
                'testing_frequency' => 'Quarterly',
            ],
            'status' => 'Active',
        ]);

        // Link control to risk
        $controls[0]->risks()->attach($risks[0]->id, [
            'effectiveness' => 'Effective',
            'rationale' => 'Monthly review provides timely detection of revenue recognition errors',
        ]);

        $controls[] = Control::create([
            'name' => 'Automated Subscription Billing Reconciliation',
            'description' => 'Daily automated reconciliation between CRM subscriptions and billing system',
            'control_type' => 'Preventive',
            'frequency' => 'Daily',
            'automation_level' => 'Automated',
            'is_key_control' => true,
            'owner_email' => 'billing.systems@acmecorp.com',
            'reviewer_email' => 'it.manager@acmecorp.com',
            'evidence_requirements' => [
                'Reconciliation report',
                'Exception report',
                'System logs',
            ],
            'metadata' => [
                'sox_control' => true,
                'testing_frequency' => 'Quarterly',
            ],
            'status' => 'Active',
        ]);

        $controls[1]->risks()->attach($risks[1]->id, [
            'effectiveness' => 'Effective',
            'rationale' => 'Automated daily reconciliation prevents incomplete revenue capture',
        ]);

        $controls[] = Control::create([
            'name' => 'Vendor Master File Access Restriction',
            'description' => 'System access controls limit vendor master file changes to authorized personnel',
            'control_type' => 'Preventive',
            'frequency' => 'Ad-hoc',
            'automation_level' => 'Automated',
            'is_key_control' => true,
            'owner_email' => 'it.security@acmecorp.com',
            'reviewer_email' => 'ciso@acmecorp.com',
            'evidence_requirements' => [
                'User access report',
                'Access change log',
                'Segregation of duties matrix',
            ],
            'metadata' => [
                'sox_control' => true,
                'testing_frequency' => 'Annually',
            ],
            'status' => 'Active',
        ]);

        $controls[2]->risks()->attach($risks[2]->id, [
            'effectiveness' => 'Effective',
            'rationale' => 'Access restrictions prevent unauthorized vendor additions',
        ]);

        $controls[] = Control::create([
            'name' => 'Quarterly Vendor Verification',
            'description' => 'Quarterly verification of active vendors against approved vendor list',
            'control_type' => 'Detective',
            'frequency' => 'Quarterly',
            'automation_level' => 'Manual',
            'is_key_control' => false,
            'owner_email' => 'procurement@acmecorp.com',
            'reviewer_email' => 'procurement.manager@acmecorp.com',
            'evidence_requirements' => [
                'Vendor verification checklist',
                'Approved vendor list',
                'Manager approval',
            ],
            'metadata' => [
                'sox_control' => false,
            ],
            'status' => 'Active',
        ]);

        $controls[3]->risks()->attach($risks[2]->id, [
            'effectiveness' => 'Partially Effective',
            'rationale' => 'Quarterly review may not detect unauthorized vendors in time',
        ]);

        echo '  ✓ Created ' . count($controls) . " controls\n";

        return $controls;
    }

    private function createTests(array $controls, array $users): array
    {
        echo "\nCreating tests...\n";

        $tests = [];

        // Test for revenue recognition review
        $tests[] = Test::create([
            'control_id' => $controls[0]->id,
            'period_start' => date('Y-m-01', strtotime('-2 months')),
            'period_end' => date('Y-m-t', strtotime('-2 months')),
            'test_plan' => [
                'objective' => 'Verify revenue recognition review is performed monthly',
                'procedure' => 'Select 3 high-value contracts and verify compliance with ASC 606',
                'sample_size' => 3,
                'population' => 45,
            ],
            'status' => 'Concluded',
            'tester_email' => 'tester@assurkit.local',
            'reviewer_email' => 'manager@assurkit.local',
            'conclusion' => 'Pass',
            'notes' => 'All sampled contracts properly reviewed and documented. No exceptions noted.',
            'metadata' => [
                'testing_approach' => 'Inquiry and observation',
                'test_date' => date('Y-m-d', strtotime('-1 month')),
            ],
        ]);

        // Test for automated billing reconciliation
        $tests[] = Test::create([
            'control_id' => $controls[1]->id,
            'period_start' => date('Y-m-01', strtotime('-1 month')),
            'period_end' => date('Y-m-t', strtotime('-1 month')),
            'test_plan' => [
                'objective' => 'Verify automated reconciliation operates daily without errors',
                'procedure' => 'Review system logs and reconciliation reports for 25 business days',
                'sample_size' => 25,
                'population' => 25,
            ],
            'status' => 'Concluded',
            'tester_email' => 'tester@assurkit.local',
            'reviewer_email' => 'manager@assurkit.local',
            'conclusion' => 'Fail',
            'notes' => 'Reconciliation failed on 2 occasions due to system timeout. Root cause analysis needed.',
            'metadata' => [
                'testing_approach' => 'Inspection of reports',
                'test_date' => date('Y-m-d', strtotime('-5 days')),
                'deficiency_severity' => 'Significant',
            ],
        ]);

        // Test for vendor access controls (in progress)
        $tests[] = Test::create([
            'control_id' => $controls[2]->id,
            'period_start' => date('Y-m-01'),
            'period_end' => date('Y-m-t'),
            'test_plan' => [
                'objective' => 'Verify only authorized users can modify vendor master file',
                'procedure' => 'Attempt unauthorized changes and verify system prevents them',
                'sample_size' => 10,
                'population' => 150,
            ],
            'status' => 'In Progress',
            'tester_email' => 'tester@assurkit.local',
            'reviewer_email' => 'manager@assurkit.local',
            'metadata' => [
                'testing_approach' => 'Reperformance',
                'test_start_date' => date('Y-m-d', strtotime('-3 days')),
            ],
        ]);

        echo '  ✓ Created ' . count($tests) . " tests\n";

        return $tests;
    }

    private function createEvidence(array $tests, array $users): void
    {
        echo "\nCreating evidence...\n";

        $evidenceCount = 0;

        // Evidence for passed test
        Evidence::create([
            'test_id' => $tests[0]->id,
            'filename' => 'revenue_recognition_review_q2_2024.pdf',
            'file_type' => 'application/pdf',
            'file_size' => 245678,
            'storage_path' => '/evidence/2024/q2/revenue_recognition_review_q2_2024.pdf',
            'checksum_sha256' => hash('sha256', 'revenue_recognition_review_q2_2024'),
            'uploaded_by_email' => 'tester@assurkit.local',
            'tags' => ['revenue', 'asc606', 'q2-2024'],
            'metadata' => [
                'evidence_type' => 'Memo',
                'period_covered' => 'Q2 2024',
            ],
        ]);
        $evidenceCount++;

        Evidence::create([
            'test_id' => $tests[0]->id,
            'filename' => 'contract_review_checklist.xlsx',
            'file_type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'file_size' => 89234,
            'storage_path' => '/evidence/2024/q2/contract_review_checklist.xlsx',
            'checksum_sha256' => hash('sha256', 'contract_review_checklist'),
            'uploaded_by_email' => 'tester@assurkit.local',
            'tags' => ['revenue', 'contracts', 'q2-2024'],
            'metadata' => [
                'evidence_type' => 'Checklist',
                'contracts_reviewed' => 3,
            ],
        ]);
        $evidenceCount++;

        // Evidence for failed test
        Evidence::create([
            'test_id' => $tests[1]->id,
            'filename' => 'billing_reconciliation_log_june_2024.csv',
            'file_type' => 'text/csv',
            'file_size' => 456789,
            'storage_path' => '/evidence/2024/06/billing_reconciliation_log_june_2024.csv',
            'checksum_sha256' => hash('sha256', 'billing_reconciliation_log_june_2024'),
            'uploaded_by_email' => 'tester@assurkit.local',
            'tags' => ['billing', 'reconciliation', 'june-2024'],
            'metadata' => [
                'evidence_type' => 'System Log',
                'period_covered' => 'June 2024',
                'exceptions_found' => 2,
            ],
        ]);
        $evidenceCount++;

        echo "  ✓ Created {$evidenceCount} evidence items\n";
    }
}
