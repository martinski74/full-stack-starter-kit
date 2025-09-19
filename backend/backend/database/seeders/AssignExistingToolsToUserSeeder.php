<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class AssignExistingToolsToUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $adminUser = \App\Models\User::first();

        if (!$adminUser) {
            $adminUser = \App\Models\User::create([
                'name' => 'Admin',
                'email' => 'admin@example.com',
                'password' => bcrypt('password'), // You should change this in production
                'email_verified_at' => now(),
            ]);
        }

        // Assign existing tools without a user_id to the admin user
        \App\Models\Tool::whereNull('user_id')->update(['user_id' => $adminUser->id]);
    }
}
