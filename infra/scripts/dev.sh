#!/bin/bash

# Development helper script for AssurKit
# Usage: ./infra/scripts/dev.sh [command]

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
PROJECT_ROOT="$SCRIPT_DIR/../.."
INFRA_DIR="$SCRIPT_DIR/.."

cd "$INFRA_DIR"

case "$1" in
    "up")
        echo "🚀 Starting AssurKit development environment..."
        docker-compose up
        ;;
    "down")
        echo "🛑 Stopping AssurKit development environment..."
        docker-compose down
        ;;
    "build")
        echo "🔨 Building AssurKit containers..."
        docker-compose build
        ;;
    "logs")
        echo "📋 Showing AssurKit logs..."
        docker-compose logs -f
        ;;
    "migrate")
        echo "🗃️ Running database migrations..."
        docker-compose exec api php migrate.php migrate
        ;;
    "seed")
        echo "🌱 Seeding database with default data..."
        docker-compose exec api php seed.php
        ;;
    "shell")
        service=${2:-api}
        echo "🐚 Opening shell for $service service..."
        docker-compose exec "$service" /bin/sh
        ;;
    *)
        echo "AssurKit Development Helper"
        echo ""
        echo "Usage: ./infra/scripts/dev.sh [command]"
        echo ""
        echo "Commands:"
        echo "  up        Start development environment"
        echo "  down      Stop development environment"
        echo "  build     Build all containers"
        echo "  logs      Show container logs"
        echo "  migrate   Run database migrations"
        echo "  seed      Seed database with default data"
        echo "  shell     Open shell (default: api, options: api|frontend|postgres)"
        echo ""
        ;;
esac