<?php

declare(strict_types=1);

namespace AssurKit\Database;

use AssurKit\Database\Seeds\DemoSeeder;
use AssurKit\Models\Role;
use AssurKit\Models\User;

class Seeder
{
    public function __construct()
    {
        Connection::getInstance();
    }

    public function seed(): void
    {
        echo "\n";
        echo "===========================================\n";
        echo "  AssurKit Database Seeder\n";
        echo "===========================================\n\n";

        // Check if database is already seeded
        if ($this->isDatabaseSeeded()) {
            echo "⚠️  Database appears to be already seeded.\n";
            echo "    To reseed, please drop and recreate the database.\n\n";
            return;
        }

        $this->seedDemoData();

        echo "\n===========================================\n";
        echo "  Seeding Complete!\n";
        echo "===========================================\n\n";
    }

    private function isDatabaseSeeded(): bool
    {
        // Check if any users exist (excluding the system default admin)
        return User::count() > 0 || Role::count() > 0;
    }

    private function seedDemoData(): void
    {
        $demoSeeder = new DemoSeeder();
        $demoSeeder->run();
    }
}
