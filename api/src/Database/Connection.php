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
                'host' => getenv('DB_HOST') ?: ($_ENV['DB_HOST'] ?? 'localhost'),
                'port' => (int) (getenv('DB_PORT') ?: ($_ENV['DB_PORT'] ?? 5432)),
                'database' => getenv('DB_DATABASE') ?: ($_ENV['DB_DATABASE'] ?? 'assurkit'),
                'username' => getenv('DB_USERNAME') ?: ($_ENV['DB_USERNAME'] ?? 'assurkit'),
                'password' => getenv('DB_PASSWORD') ?: ($_ENV['DB_PASSWORD'] ?? 'assurkit_secret'),
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
