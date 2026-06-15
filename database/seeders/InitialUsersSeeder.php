<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class InitialUsersSeeder extends Seeder
{
    public function run()
    {
        $users = [
            [
                'email'      => 'admin@kop.com',
                'name'       => 'Admin User',
                'role'       => 'admin',
                'shareholder_id'  => 'SSB001',
            ],
            [
                'email'      => 'staff@kop.com',
                'name'       => 'Staff User',
                'role'       => 'staff',
                'shareholder_id'  => 'SSB002',
            ],
            [
                'email'      => 'investor@kop.com',
                'name'       => 'Investor User',
                'role'       => 'shareholder',
                'shareholder_id'  => 'SSB003',
            ],
        ];

        foreach ($users as $u) {
            User::updateOrCreate(
                ['email' => $u['email']],
                [
                    'name'                   => $u['name'],
                    'password'               => Hash::make('Admin1234'),
                    'role'                   => $u['role'],
                    'status'                 => 'active',
                    'is_approved'            => true,
                    'shareholder_id'              => $u['shareholder_id'],
                    'shareholding_start_date'  => now(),
                ]
            );
        }

        $this->command->info('Seeded 3 users: admin@kop.com, staff@kop.com, investor@kop.com (password: Admin1234)');
    }
}
