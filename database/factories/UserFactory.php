<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class UserFactory extends Factory
{
    public function definition()
    {
        static $seq = 1;
        return [
            'name'                  => fake()->name(),
            'email'                 => fake()->unique()->safeEmail(),
            'email_verified_at'     => now(),
            'password'              => '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
            'remember_token'        => Str::random(10),
            'role'                     => 'shareholder',
            'status'                   => 'active',
            'is_approved'              => true,
            'shareholder_id'           => 'SSB' . str_pad($seq++, 4, '0', STR_PAD_LEFT),
            'shareholding_start_date'  => now()->subYear(),
        ];
    }

    public function shareholder()
    {
        return $this->state(['role' => 'shareholder', 'status' => 'active', 'is_approved' => true]);
    }

    /** Backwards-compatible alias — old tests may still call ->investor() */
    public function investor()
    {
        return $this->shareholder();
    }

    public function staff()
    {
        return $this->state(['role' => 'staff', 'status' => 'active', 'is_approved' => true]);
    }

    public function admin()
    {
        return $this->state(['role' => 'admin', 'status' => 'active', 'is_approved' => true]);
    }

    public function pending()
    {
        return $this->state(['role' => 'shareholder', 'status' => 'pending', 'is_approved' => false]);
    }

    public function inactive()
    {
        return $this->state(['role' => 'shareholder', 'status' => 'inactive', 'is_approved' => false]);
    }

    public function unverified()
    {
        return $this->state(['email_verified_at' => null]);
    }
}
