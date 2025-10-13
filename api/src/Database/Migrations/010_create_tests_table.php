<?php

use Illuminate\Database\Capsule\Manager as DB;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;

class CreateTestsTable extends Migration
{
    public function up(): void
    {
        DB::schema()->create('tests', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('test_id')->unique(); // Business-friendly ID like TST-001
            $table->uuid('control_id');
            $table->string('name');
            $table->text('description')->nullable();
            $table->enum('test_method', ['Inquiry', 'Observation', 'Inspection', 'Re-performance', 'Analytical']);
            $table->enum('test_scope', ['Full Population', 'Sample Based', 'Key Items', 'Judgmental']);
            $table->integer('sample_size')->nullable();
            $table->text('sample_criteria')->nullable();
            $table->date('period_start');
            $table->date('period_end');
            $table->string('tester_email');
            $table->string('reviewer_email')->nullable();
            $table->enum('status', ['Planned', 'In Progress', 'Submitted', 'In Review', 'Concluded'])->default('Planned');
            $table->text('test_procedures')->nullable();
            $table->text('test_results')->nullable();
            $table->enum('conclusion', ['Effective', 'Deficient', 'Not Tested'])->nullable();
            $table->text('deficiency_description')->nullable();
            $table->text('management_response')->nullable();
            $table->json('evidence_references')->nullable(); // Array of evidence file IDs
            $table->json('metadata')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamp('concluded_at')->nullable();
            $table->timestamps();

            $table->foreign('control_id')->references('id')->on('controls')->onDelete('cascade');
            $table->index(['control_id', 'status']);
            $table->index(['tester_email', 'status']);
            $table->index(['period_start', 'period_end']);
            $table->index('status');
            $table->index('conclusion');
        });
    }

    public function down(): void
    {
        DB::schema()->dropIfExists('tests');
    }
}
