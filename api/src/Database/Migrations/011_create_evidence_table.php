<?php

use Illuminate\Database\Capsule\Manager as DB;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;

class CreateEvidenceTable extends Migration
{
    public function up(): void
    {
        DB::schema()->create('evidence', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('filename');
            $table->string('original_filename');
            $table->string('mime_type');
            $table->bigInteger('file_size'); // in bytes
            $table->string('sha256_hash'); // File integrity checksum
            $table->string('storage_path');
            $table->string('uploaded_by_email');
            $table->text('description')->nullable();
            $table->json('metadata')->nullable(); // Custom metadata like tags, categories
            $table->enum('status', ['Uploading', 'Available', 'Archived'])->default('Uploading');
            $table->timestamp('archived_at')->nullable();
            $table->timestamps();

            // Indexes for performance and integrity
            $table->unique('sha256_hash'); // Prevent duplicate uploads
            $table->index('uploaded_by_email');
            $table->index('status');
            $table->index('created_at');
            $table->index('mime_type');
        });
    }

    public function down(): void
    {
        DB::schema()->dropIfExists('evidence');
    }
}
