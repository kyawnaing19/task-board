<?php

namespace Database\Seeders;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Support\Facades\Hash;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => config('app.admin.email')],
            [
                'name' => config('app.admin.name'),
                'password' => Hash::make(config('app.admin.password')),
                'role' => 'SUPER_ADMIN',
                'status' => 'ACTIVE',
                'must_change_password' => true,
                'email_verified_at' => now(),
            ]
        );
    }
}
