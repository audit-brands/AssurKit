<?php

declare(strict_types=1);

namespace AssurKit\Database;

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
        echo "Seeding database...\n";

        $this->seedRoles();
        $this->seedDefaultAdmin();

        echo "Database seeding completed!\n";
    }

    private function seedRoles(): void
    {
        echo "Seeding roles...\n";

        foreach (Role::getDefaultRoles() as $roleData) {
            if (!Role::where('name', $roleData['name'])->exists()) {
                Role::create($roleData);
                echo "Created role: {$roleData['name']}\n";
            } else {
                echo "Role already exists: {$roleData['name']}\n";
            }
        }
    }

    private function seedDefaultAdmin(): void
    {
        echo "Seeding default admin user...\n";

        $adminEmail = $_ENV['ADMIN_EMAIL'] ?? 'admin@assurkit.local';
        $adminPassword = $_ENV['ADMIN_PASSWORD'] ?? 'admin123';

        if (!User::where('email', $adminEmail)->exists()) {
            $admin = User::createUser($adminEmail, 'Admin User', $adminPassword);
            $admin->assignRole('Admin');

            echo "Created admin user: {$adminEmail}\n";
            echo "Admin password: {$adminPassword}\n";
        } else {
            echo "Admin user already exists: {$adminEmail}\n";
        }
    }
}
