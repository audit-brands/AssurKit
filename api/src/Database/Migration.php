<?php

declare(strict_types=1);

namespace AssurKit\Database;

use Illuminate\Database\Schema\Builder;

abstract class Migration
{
    protected Builder $schema;

    public function __construct()
    {
        $this->schema = Connection::getInstance()->schema();
    }

    abstract public function up(): void;

    abstract public function down(): void;
}