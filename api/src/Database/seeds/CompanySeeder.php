<?php

declare(strict_types=1);

namespace AssurKit\Database\Seeds;

use AssurKit\Models\Company;
use AssurKit\Models\Process;
use AssurKit\Models\Subprocess;

class CompanySeeder
{
    public function run(): void
    {
        $company = Company::create([
            'name' => 'Demo Corporation',
            'description' => 'Sample company for AssurKit demonstration',
            'ticker_symbol' => 'DEMO',
            'industry' => 'Technology',
            'metadata' => [
                'fiscal_year_end' => 'December 31',
                'sox_scope' => 'Full',
            ],
        ]);

        $revenueProcess = Process::create([
            'company_id' => $company->id,
            'name' => 'Revenue Recognition',
            'description' => 'Process for recognizing revenue in accordance with accounting standards',
            'owner_email' => 'revenue.manager@democorp.com',
            'metadata' => [
                'cycle' => 'Revenue',
                'risk_level' => 'High',
            ],
        ]);

        Subprocess::create([
            'process_id' => $revenueProcess->id,
            'name' => 'Sales Order Processing',
            'description' => 'Processing customer orders and generating sales invoices',
            'owner_email' => 'sales.ops@democorp.com',
            'assertions' => ['existence_occurrence', 'completeness', 'accuracy_valuation'],
            'metadata' => [
                'frequency' => 'Daily',
                'automation_level' => 'Semi-automated',
            ],
        ]);

        Subprocess::create([
            'process_id' => $revenueProcess->id,
            'name' => 'Revenue Cut-off',
            'description' => 'Ensuring revenue is recorded in the correct accounting period',
            'owner_email' => 'accounting@democorp.com',
            'assertions' => ['cutoff', 'accuracy_valuation'],
            'metadata' => [
                'frequency' => 'Monthly',
                'automation_level' => 'Manual',
            ],
        ]);

        $procurementProcess = Process::create([
            'company_id' => $company->id,
            'name' => 'Procurement & Accounts Payable',
            'description' => 'Process for purchasing goods and services and managing payables',
            'owner_email' => 'procurement@democorp.com',
            'metadata' => [
                'cycle' => 'Expenditure',
                'risk_level' => 'Medium',
            ],
        ]);

        Subprocess::create([
            'process_id' => $procurementProcess->id,
            'name' => 'Purchase Order Management',
            'description' => 'Creating and approving purchase orders for vendors',
            'owner_email' => 'procurement@democorp.com',
            'assertions' => ['existence_occurrence', 'completeness', 'rights_obligations'],
            'metadata' => [
                'frequency' => 'Daily',
                'automation_level' => 'Automated',
            ],
        ]);

        echo "Company seeder completed successfully.\n";
    }
}
