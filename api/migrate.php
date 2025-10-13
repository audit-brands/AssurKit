#!/usr/bin/env php
<?php

declare(strict_types=1);

require __DIR__ . '/vendor/autoload.php';

use AssurKit\Database\MigrationRunner;

// Load environment variables
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
if (file_exists(__DIR__ . '/.env')) {
    $dotenv->load();
}

$command = $argv[1] ?? 'migrate';

$runner = new MigrationRunner();

switch ($command) {
    case 'migrate':
        echo "Running database migrations...\n";
        $runner->migrate();
        echo "Migrations completed!\n";
        break;

    case 'rollback':
        echo "Rolling back database migrations...\n";
        $runner->rollback();
        echo "Rollback completed!\n";
        break;

    default:
        echo "Usage: php migrate.php [migrate|rollback]\n";
        exit(1);
}
