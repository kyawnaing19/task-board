<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('task_groups', function (Blueprint $table) {
            $table->id();
            $table->string('name', 50);
            $table->string('color', 20)->default('slate');
            $table->unsignedInteger('sort_order');

            $table->boolean('is_initial')->nullable()->unique();
            $table->boolean('is_completed')->nullable()->unique();

            $table->timestamp('archived_at')->nullable()->index();
            $table->foreignId('archived_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        $now = now();

        DB::table('task_groups')->insert([
            ['name' => 'To Do',       'color' => 'slate', 'sort_order' => 1, 'is_initial' => true, 'is_completed' => null, 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'In Progress', 'color' => 'blue',  'sort_order' => 2, 'is_initial' => null, 'is_completed' => null, 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Review',      'color' => 'amber', 'sort_order' => 3, 'is_initial' => null, 'is_completed' => null, 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Done',        'color' => 'green', 'sort_order' => 4, 'is_initial' => null, 'is_completed' => true, 'created_at' => $now, 'updated_at' => $now],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('task_groups');
    }
};