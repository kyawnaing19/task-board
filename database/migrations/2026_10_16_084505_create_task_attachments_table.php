<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('task_attachments', function (Blueprint $table) {
            $table->id();

            $table->foreignId('task_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('uploaded_by')
                ->constrained('users')
                ->restrictOnDelete();

            $table->string('original_name', 255);
            $table->string('disk', 50)->default('private');
            $table->string('path');
            $table->string('mime_type', 150);
            $table->unsignedBigInteger('size');

            $table->timestamps();

            $table->index(['task_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('task_attachments');
    }
};