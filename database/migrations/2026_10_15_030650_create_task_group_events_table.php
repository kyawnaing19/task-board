<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('task_group_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('group_id')->constrained('task_groups')->restrictOnDelete();
            $table->foreignId('actor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('type', 40);
            $table->json('payload')->nullable();
            $table->timestamp('created_at');

            $table->index(['group_id', 'id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('task_group_events');
    }
};