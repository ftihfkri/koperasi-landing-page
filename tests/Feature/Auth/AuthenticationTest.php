<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_screen_can_be_rendered(): void
    {
        $this->get('/login')->assertStatus(200);
    }

    public function test_investor_login_redirects_to_investor_dashboard(): void
    {
        $user = User::factory()->investor()->create();

        $this->post('/login', ['login' => $user->email, 'password' => 'password'])
             ->assertRedirect('/dashboard');

        $this->assertAuthenticated();
    }

    public function test_staff_login_redirects_to_staff_dashboard(): void
    {
        $user = User::factory()->staff()->create();

        $this->post('/login', ['login' => $user->email, 'password' => 'password'])
             ->assertRedirect('/dashboard');

        $this->assertAuthenticated();
    }

    public function test_admin_login_redirects_to_admin_dashboard(): void
    {
        $user = User::factory()->admin()->create();

        $this->post('/login', ['login' => $user->email, 'password' => 'password'])
             ->assertRedirect('/dashboard');

        $this->assertAuthenticated();
    }

    public function test_users_cannot_authenticate_with_invalid_password(): void
    {
        $user = User::factory()->create();

        $this->post('/login', ['login' => $user->email, 'password' => 'wrong-password']);

        $this->assertGuest();
    }

    public function test_users_can_logout(): void
    {
        $user = User::factory()->investor()->create();

        $this->actingAs($user)->post('/logout')->assertRedirect('/');

        $this->assertGuest();
    }
}
