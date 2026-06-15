<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class DividendFactory extends Factory
{
    public function definition()
    {
        return [
            'user_id' => User::factory()->investor(),
            'year'    => fake()->numberBetween(2020, 2025),
            'rate'    => fake()->randomFloat(2, 1, 10),
            'amount'  => fake()->randomFloat(2, 50, 2000),
        ];
    }
}
