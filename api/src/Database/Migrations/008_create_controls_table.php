<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Capsule\Manager as DB;

class CreateControlsTable extends Migration
{
    public function up(): void
    {
        DB::schema()->create('controls', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('control_id')->unique(); // Business-friendly ID like CTL-001
            $table->string('name');
            $table->text('description');
            $table->enum('control_type', ['Preventive', 'Detective', 'Corrective']);
            $table->enum('frequency', ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Annual', 'Ad-hoc']);
            $table->enum('automation_level', ['Manual', 'Semi-automated', 'Automated']);
            $table->boolean('is_key_control')->default(false);
            $table->string('owner_email');
            $table->string('reviewer_email')->nullable();
            $table->json('evidence_requirements')->nullable();
            $table->json('metadata')->nullable();
            $table->enum('status', ['Draft', 'Active', 'Retired'])->default('Draft');
            $table->timestamps();

            $table->index(['control_type', 'frequency']);
            $table->index(['owner_email', 'status']);
            $table->index('is_key_control');
            $table->index('status');
        });
    }

    public function down(): void
    {
        DB::schema()->dropIfExists('controls');
    }
}