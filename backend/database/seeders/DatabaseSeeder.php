<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Role;
use Illuminate\Support\Facades\Hash;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([CategorySeeder::class, RoleSeeder::class]);

        // Create ivan@admin.local user with 'owner' role
        User::firstOrCreate(
            ['email' => 'ivan@admin.local'],
            [
                'name' => 'Ivan Ivanov',
                'password' => Hash::make('password'),
                'role' => 'owner',
                'email_verified_at' => now(),
            ]
        );

        // Create petar@backend.local user with 'Backend Developer' role
        User::firstOrCreate(
            ['email' => 'petar@backend.local'],
            [
                'name' => 'Petar Petrov',
                'password' => Hash::make('password'),
                'role' => 'Backend Developer',
                'email_verified_at' => now(),
            ]
        );

        // Create elena@frontend.local user with 'Frontend Developer' role
        User::firstOrCreate(
            ['email' => 'elena@frontend.local'],
            [
                'name' => 'Elena Georgieva',
                'password' => Hash::make('password'),
                'role' => 'Frontend Developer',
                'email_verified_at' => now(),
            ]
        );

        // User::factory(10)->create();

        User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
        ]);
    }
}
