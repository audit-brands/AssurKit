<?php

declare(strict_types=1);

namespace AssurKit\Database\Migrations;

use AssurKit\Database\Migration;
use Illuminate\Database\Schema\Blueprint;

class CreateUserRolesTable extends Migration
{
    public function up(): void
    {
        $this->schema->create('user_roles', function (Blueprint $table) {
            $table->uuid('user_id');
            $table->uuid('role_id');
            $table->timestamp('assigned_at')->useCurrent();

            $table->primary(['user_id', 'role_id']);
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('role_id')->references('id')->on('roles')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        $this->schema->dropIfExists('user_roles');
    }
}