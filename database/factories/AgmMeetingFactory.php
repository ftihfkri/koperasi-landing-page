<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class AgmMeetingFactory extends Factory
{
    public function definition()
    {
        return [
            'title'        => 'AGM ' . fake()->year(),
            'scheduled_at' => fake()->dateTimeBetween('now', '+6 months'),
            'location'     => fake()->city(),
            'notes'        => null,
            'qr_token'     => bin2hex(random_bytes(16)),
            'created_by'   => User::factory()->admin(),
            'is_active'    => true,
        ];
    }

    public function closed()
    {
        return $this->state(['is_active' => false]);
    }
}
