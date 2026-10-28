<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('teams', function (Blueprint $table) {
            $table->foreignId('leader_id')->nullable()->after('description')->constrained('users')->nullOnDelete();
            $table->timestamp('leader_assigned_at')->nullable()->after('leader_id');
            $table->foreignId('leader_assigned_by')->nullable()->after('leader_assigned_at')->constrained('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('teams', function (Blueprint $table) {
            $table->dropConstrainedForeignId('leader_assigned_by');
            $table->dropColumn('leader_assigned_at');
            $table->dropConstrainedForeignId('leader_id');
        });
    }
};
