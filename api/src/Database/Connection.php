<?php

declare(strict_types=1);

namespace AssurKit\Database;

use Illuminate\Database\Capsule\Manager as Capsule;

class Connection
{
    private static ?Capsule $capsule = null;

    public static function getInstance(): Capsule
    {
        if (self::$capsule === null) {
            self::$capsule = new Capsule();
            self::$capsule->addConnection([
                'driver' => 'pgsql',
                'host' => $_ENV['DB_HOST'] ?? 'localhost',
                'port' => $_ENV['DB_PORT'] ?? 5432,
                'database' => $_ENV['DB_DATABASE'] ?? 'assurkit',
                'username' => $_ENV['DB_USERNAME'] ?? 'assurkit',
                'password' => $_ENV['DB_PASSWORD'] ?? 'assurkit_secret',
                'charset' => 'utf8',
                'prefix' => '',
                'schema' => 'public',
            ]);

            self::$capsule->setAsGlobal();
            self::$capsule->bootEloquent();
        }

        return self::$capsule;
    }
}