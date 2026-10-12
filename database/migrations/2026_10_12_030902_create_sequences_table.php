<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sequences', function (Blueprint $table) {
            $table->string('name')->primary();
            $table->unsignedBigInteger('value')->default(0);
        });

        DB::table('sequences')->insert(['name' => 'project', 'value' => 0]);
    }

    public function down(): void
    {
        Schema::dropIfExists('sequences');
    }
};