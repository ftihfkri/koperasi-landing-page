<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class TransactionFactory extends Factory
{
    public function definition()
    {
        return [
            'user_id'          => User::factory()->investor(),
            'type'             => fake()->randomElement(['deposit', 'dividend', 'withdrawal']),
            'amount'           => fake()->randomFloat(2, 100, 5000),
            'transaction_date' => fake()->dateTimeBetween('-2 years', 'now'),
            'description'      => fake()->sentence(4),
            'reference_type'   => null,
            'reference_id'     => null,
        ];
    }

    public function deposit()
    {
        return $this->state(['type' => 'deposit', 'amount' => fake()->randomFloat(2, 500, 10000)]);
    }

    /** Backwards-compatible alias for old tests calling ->investment() */
    public function investment()
    {
        return $this->deposit();
    }

    public function dividend()
    {
        return $this->state(['type' => 'dividend', 'amount' => fake()->randomFloat(2, 10, 500)]);
    }
}
