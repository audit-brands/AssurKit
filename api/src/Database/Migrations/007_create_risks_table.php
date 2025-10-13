<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Capsule\Manager as DB;

class CreateRisksTable extends Migration
{
    public function up(): void
    {
        DB::schema()->create('risks', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('subprocess_id');
            $table->string('name');
            $table->text('description');
            $table->enum('risk_type', ['Operational', 'Financial', 'Compliance', 'Strategic', 'Technology']);
            $table->enum('likelihood', ['Very Low', 'Low', 'Medium', 'High', 'Very High']);
            $table->enum('impact', ['Very Low', 'Low', 'Medium', 'High', 'Very High']);
            $table->json('assertions'); // Financial statement assertions this risk affects
            $table->json('metadata')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->foreign('subprocess_id')->references('id')->on('subprocesses')->onDelete('cascade');
            $table->index(['subprocess_id', 'name']);
            $table->index(['risk_type', 'likelihood', 'impact']);
            $table->index('is_active');
        });
    }

    public function down(): void
    {
        DB::schema()->dropIfExists('risks');
    }
}