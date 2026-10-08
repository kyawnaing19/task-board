<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('teams', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('description', 500)->nullable();

            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();

            // Archive = business state၊ row ကို မဖျက်ဘူး
            $table->timestamp('archived_at')->nullable()->index();
            $table->foreignId('archived_by')->nullable()->constrained('users')->nullOnDelete();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('teams');
    }
};