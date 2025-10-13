<?php

declare(strict_types=1);

namespace AssurKit\Database\Migrations;

use AssurKit\Database\Migration;
use Illuminate\Database\Schema\Blueprint;

class CreateRolesTable extends Migration
{
    public function up(): void
    {
        $this->schema->create('roles', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name')->unique();
            $table->text('description')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        $this->schema->dropIfExists('roles');
    }
}
