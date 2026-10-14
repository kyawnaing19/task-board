<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tasks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->restrictOnDelete();
            $table->unsignedBigInteger('sequence');             // project-scoped, ပြန်မသုံး
            $table->string('code', 40)->unique();               // PRJ-001-1
            $table->string('title', 200);
            $table->mediumText('description')->nullable();      // ၂၀,၀၀၀ လုံး (မြန်မာစာ ၃ byte နဲ့ text ၆၅KB နီးလို့ mediumText)
            $table->string('priority', 10)->default('NORMAL');
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->foreignId('group_id')->constrained('task_groups')->restrictOnDelete();
            $table->unsignedBigInteger('sort_position')->nullable();  // archived task မှာ NULL
            $table->timestamp('completed_at')->nullable();
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->timestamp('archived_at')->nullable();
            $table->foreignId('archived_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['project_id', 'sequence']);
            $table->index(['project_id', 'group_id', 'archived_at', 'sort_position'], 'tasks_board_order_index');
        });

        Schema::create('task_assignees', function (Blueprint $table) {
            $table->id();
            $table->foreignId('task_id')->constrained()->restrictOnDelete();
            $table->foreignId('user_id')->constrained()->restrictOnDelete();
            $table->timestamp('assigned_at');
            $table->foreignId('assigned_by')->constrained('users')->restrictOnDelete();

            $table->unique(['task_id', 'user_id']);
            $table->index('user_id');
        });

        Schema::create('task_tag', function (Blueprint $table) {
            $table->id();
            $table->foreignId('task_id')->constrained()->restrictOnDelete();
            $table->foreignId('tag_id')->constrained()->restrictOnDelete();

            $table->unique(['task_id', 'tag_id']);
        });

        Schema::create('task_activities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('task_id')->constrained()->restrictOnDelete();
            $table->foreignId('actor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('type', 40);
            $table->json('payload')->nullable();
            $table->timestamp('created_at');

            $table->index(['task_id', 'id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('task_activities');
        Schema::dropIfExists('task_tag');
        Schema::dropIfExists('task_assignees');
        Schema::dropIfExists('tasks');
    }
};