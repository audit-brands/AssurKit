<?php

declare(strict_types=1);

namespace AssurKit\Database;

class MigrationRunner
{
    private array $migrations = [
        \AssurKit\Database\Migrations\CreateUsersTable::class,
        \AssurKit\Database\Migrations\CreateRolesTable::class,
        \AssurKit\Database\Migrations\CreateUserRolesTable::class,
    ];

    public function __construct()
    {
        Connection::getInstance();
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
            'run_at' => now(),
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
