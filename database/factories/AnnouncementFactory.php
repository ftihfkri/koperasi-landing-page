<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class AnnouncementFactory extends Factory
{
    public function definition()
    {
        return [
            'title'        => fake()->sentence(5),
            'content'      => fake()->paragraphs(2, true),
            'is_active'    => true,
            'published_at' => now(),
            'created_by'   => User::factory()->admin(),
        ];
    }

    public function inactive()
    {
        return $this->state(['is_active' => false]);
    }
}
