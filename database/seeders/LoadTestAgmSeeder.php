<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\AgmMeeting;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class LoadTestAgmSeeder extends Seeder
{
    public function run()
    {
        // 1. Ensure we have an admin
        $admin = User::firstOrCreate(
            ['email' => 'admin_loadtest@gmail.com'],
            [
                'name' => 'Load Test Admin',
                'full_name' => 'Load Test Admin',
                'password' => Hash::make('Fatih1234'),
                'role' => 'admin',
                'shareholder_id' => 'LT-ADMIN',
                'is_approved' => true,
            ]
        );

        // 2. Create a new AGM Meeting
        $meeting = AgmMeeting::create([
            'title' => 'Load Test AGM ' . date('Y'),
            'scheduled_at' => now()->addDays(1),
            'location' => 'Main Hall Load Test',
            'notes' => 'Testing 500+ concurrent attendees',
            'qr_token' => AgmMeeting::generateToken(),
            'created_by' => $admin->id,
            'is_active' => true,
        ]);

        $this->command->info("Created AGM Meeting ID: {$meeting->id} with token: {$meeting->qr_token}");

        // 3. Create 500 members for the test
        $this->command->info("Creating 500 test members...");
        
        $users = [];
        $password = Hash::make('password123'); // same password for speed
        
        for ($i = 1; $i <= 500; $i++) {
            $users[] = [
                'name' => "LT Member {$i}",
                'full_name' => "LT Member {$i}",
                'email' => "lt_member{$i}@example.com",
                'shareholder_id' => 'LT-' . str_pad($i, 5, '0', STR_PAD_LEFT),
                'role' => 'shareholder',
                'password' => $password,
                'is_approved' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ];
            
            // Insert in chunks of 100 to avoid memory issues
            if ($i % 100 === 0) {
                User::insert($users);
                $users = [];
            }
        }
        
        if (!empty($users)) {
            User::insert($users);
        }

        $this->command->info("Successfully generated 500 members!");
    }
}
