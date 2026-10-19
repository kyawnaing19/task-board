<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('users', 'dashboard_assignments_seen_at')) {
            Schema::table('users', function (Blueprint $table) {
                $table->timestamp('dashboard_assignments_seen_at')->nullable();
            });
        }

        // ရှိပြီးသား account တွေရဲ့ checkpoint = account ဖန်တီးချိန်
        DB::table('users')
            ->whereNull('dashboard_assignments_seen_at')
            ->update(['dashboard_assignments_seen_at' => DB::raw('created_at')]);
    }

    public function down(): void
    {
        // Column ကို ကိုယ်ပိုင်ဖန်တီးခဲ့တာ မသေချာလို့ မဖျက်ဘူး
    }
};