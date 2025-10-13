<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Capsule\Manager as DB;

class CreateProcessesTable extends Migration
{
    public function up(): void
    {
        DB::schema()->create('processes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('company_id');
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('owner_email')->nullable();
            $table->json('metadata')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->foreign('company_id')->references('id')->on('companies')->onDelete('cascade');
            $table->index(['company_id', 'name']);
            $table->index('is_active');
        });
    }

    public function down(): void
    {
        DB::schema()->dropIfExists('processes');
    }
}