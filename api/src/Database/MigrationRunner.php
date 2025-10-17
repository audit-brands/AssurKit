<?php

declare(strict_types=1);

namespace AssurKit\Database;

class MigrationRunner
{
    private array $migrations = [
        \AssurKit\Database\Migrations\CreateUsersTable::class,
        \AssurKit\Database\Migrations\CreateRolesTable::class,
        \AssurKit\Database\Migrations\CreateUserRolesTable::class,
        \CreateCompaniesTable::class,
        \CreateProcessesTable::class,
        \CreateSubprocessesTable::class,
        \CreateRisksTable::class,
        \CreateControlsTable::class,
        \CreateRiskControlMatrixTable::class,
        \CreateTestsTable::class,
        \CreateEvidenceTable::class,
    ];

    public function __construct()
    {
        Connection::getInstance();

        // Load all migration files
        $migrationsDir = __DIR__ . '/Migrations/';

        // Load namespaced migrations (001-003)
        require_once $migrationsDir . '001_CreateUsersTable.php';
        require_once $migrationsDir . '002_CreateRolesTable.php';
        require_once $migrationsDir . '003_CreateUserRolesTable.php';

        // Load non-namespaced migrations (004-011)
        require_once $migrationsDir . '004_create_companies_table.php';
        require_once $migrationsDir . '005_create_processes_table.php';
        require_once $migrationsDir . '006_create_subprocesses_table.php';
        require_once $migrationsDir . '007_create_risks_table.php';
        require_once $migrationsDir . '008_create_controls_table.php';
        require_once $migrationsDir . '009_create_risk_control_matrix_table.php';
        require_once $migrationsDir . '010_create_tests_table.php';
        require_once $migrationsDir . '011_create_evidence_table.php';
    }

    public function migrate(): void
    {
        // Create migrations table if it doesn't exist
        $this->createMigrationsTable();

        foreach ($this->migrations as $migrationClass) {
            $migrationName = $this->getMigrationName($migrationClass);

            if (!$this->hasRun($migrationName)) {
                echo "Running migration: {$migrationName}\n";

                $migration = new $migrationClass();
                $migration->up();

                $this->markAsRun($migrationName);

                echo "Completed migration: {$migrationName}\n";
            } else {
                echo "Skipping migration: {$migrationName} (already run)\n";
            }
        }
    }

    public function rollback(): void
    {
        foreach (array_reverse($this->migrations) as $migrationClass) {
            $migrationName = $this->getMigrationName($migrationClass);

            if ($this->hasRun($migrationName)) {
                echo "Rolling back migration: {$migrationName}\n";

                $migration = new $migrationClass();
                $migration->down();

                $this->markAsNotRun($migrationName);

                echo "Rolled back migration: {$migrationName}\n";
            }
        }
    }

    private function createMigrationsTable(): void
    {
        $schema = Connection::getInstance()->schema();

        if (!$schema->hasTable('migrations')) {
            $schema->create('migrations', function ($table) {
                $table->string('migration')->primary();
                $table->timestamp('run_at')->useCurrent();
            });
        }
    }

    private function getMigrationName(string $class): string
    {
        return basename(str_replace('\\', '/', $class));
    }

    private function hasRun(string $migrationName): bool
    {
        $db = Connection::getInstance()->getConnection();

        return $db->table('migrations')
            ->where('migration', $migrationName)
            ->exists();
    }

    private function markAsRun(string $migrationName): void
    {
        $db = Connection::getInstance()->getConnection();

        $db->table('migrations')->insert([
            'migration' => $migrationName,
            'run_at' => date('Y-m-d H:i:s'),
        ]);
    }

    private function markAsNotRun(string $migrationName): void
    {
        $db = Connection::getInstance()->getConnection();

        $db->table('migrations')
            ->where('migration', $migrationName)
            ->delete();
    }
}
