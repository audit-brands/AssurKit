#!/bin/bash
set -e

echo "Starting AssurKit API..."

# Wait for database to be ready
echo "Waiting for database connection..."
until php -r "
try {
    \$host = getenv('DB_HOST');
    \$port = getenv('DB_PORT');
    \$dbname = getenv('DB_DATABASE');
    \$username = getenv('DB_USERNAME');
    \$password = getenv('DB_PASSWORD');
    \$pdo = new PDO(\"pgsql:host=\$host;port=\$port;dbname=\$dbname\", \$username, \$password);
    echo 'Database connection successful' . PHP_EOL;
} catch (PDOException \$e) {
    echo 'Database connection failed: ' . \$e->getMessage() . PHP_EOL;
    exit(1);
}
"; do
  echo "Database not ready, waiting..."
  sleep 2
done

# Run migrations
echo "Running database migrations..."
php migrate.php migrate

# Run seeder
echo "Running database seeder..."
php seed.php

echo "Starting Apache..."
exec apache2-foreground