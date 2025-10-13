<?php

use Illuminate\Database\Capsule\Manager as DB;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;

class CreateRiskControlMatrixTable extends Migration
{
    public function up(): void
    {
        DB::schema()->create('risk_control_matrix', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('risk_id');
            $table->uuid('control_id');
            $table->enum('effectiveness', ['Not Effective', 'Partially Effective', 'Effective']);
            $table->text('rationale')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->foreign('risk_id')->references('id')->on('risks')->onDelete('cascade');
            $table->foreign('control_id')->references('id')->on('controls')->onDelete('cascade');

            // Ensure unique risk-control pairs
            $table->unique(['risk_id', 'control_id']);

            $table->index('effectiveness');
        });
    }

    public function down(): void
    {
        DB::schema()->dropIfExists('risk_control_matrix');
    }
}
