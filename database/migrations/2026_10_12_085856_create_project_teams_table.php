<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('project_teams', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->restrictOnDelete();
            $table->foreignId('team_id')->constrained()->restrictOnDelete();

            $table->timestamp('added_at');
            $table->foreignId('added_by')->constrained('users')->restrictOnDelete();

            $table->timestamp('removed_at')->nullable();
            $table->foreignId('removed_by')->nullable()->constrained('users')->nullOnDelete();

            $table->index(['project_id', 'removed_at']);
            $table->index(['team_id', 'removed_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('project_teams');
    }
};