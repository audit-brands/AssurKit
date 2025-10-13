<?php

use Illuminate\Database\Capsule\Manager as DB;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;

class CreateSubprocessesTable extends Migration
{
    public function up(): void
    {
        DB::schema()->create('subprocesses', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('process_id');
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('owner_email')->nullable();
            $table->json('assertions')->nullable(); // Financial statement assertions
            $table->json('metadata')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->foreign('process_id')->references('id')->on('processes')->onDelete('cascade');
            $table->index(['process_id', 'name']);
            $table->index('is_active');
        });
    }

    public function down(): void
    {
        DB::schema()->dropIfExists('subprocesses');
    }
}
