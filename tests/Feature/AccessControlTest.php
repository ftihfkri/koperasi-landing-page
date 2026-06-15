<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AccessControlTest extends TestCase
{
    use RefreshDatabase;

    // ── Guest is blocked from all protected pages ──────────────

    public function test_guest_cannot_access_investor_dashboard(): void
    {
        $this->get('/shareholder')->assertRedirect('/login');
    }

    public function test_guest_cannot_access_staff_dashboard(): void
    {
        $this->get('/staff')->assertRedirect('/login');
    }

    public function test_guest_cannot_access_admin_dashboard(): void
    {
        $this->get('/admin')->assertRedirect('/login');
    }

    // ── Pending investor is blocked ────────────────────────────

    public function test_pending_investor_is_redirected_to_pending_page(): void
    {
        $user = User::factory()->pending()->create();

        $this->actingAs($user)->get('/shareholder')->assertRedirect('/register/pending');
    }

    // ── Inactive investor is logged out ───────────────────────

    public function test_inactive_investor_is_logged_out(): void
    {
        $user = User::factory()->inactive()->create();

        $this->actingAs($user)->get('/shareholder')->assertRedirect('/login');
        $this->assertGuest();
    }

    // ── Investor cannot access staff or admin ──────────────────

    public function test_investor_cannot_access_staff_dashboard(): void
    {
        $user = User::factory()->investor()->create();

        $this->actingAs($user)->get('/staff')->assertStatus(403);
    }

    public function test_investor_cannot_access_admin_dashboard(): void
    {
        $user = User::factory()->investor()->create();

        $this->actingAs($user)->get('/admin')->assertStatus(403);
    }

    // ── Staff cannot access admin-only routes ─────────────────

    public function test_staff_cannot_access_admin_dashboard(): void
    {
        $user = User::factory()->staff()->create();

        $this->actingAs($user)->get('/admin')->assertStatus(403);
    }

    public function test_staff_cannot_approve_pending_items(): void
    {
        $user = User::factory()->staff()->create();

        $this->actingAs($user)->post('/admin/approvals/1/approve')->assertStatus(403);
    }

    // ── Admin can access all sections ─────────────────────────

    public function test_admin_can_access_admin_dashboard(): void
    {
        $user = User::factory()->admin()->create();

        $this->actingAs($user)->get('/admin')->assertStatus(200);
    }

    public function test_admin_can_access_staff_dashboard(): void
    {
        $user = User::factory()->admin()->create();

        $this->actingAs($user)->get('/staff')->assertStatus(200);
    }

    public function test_admin_can_access_investor_dashboard(): void
    {
        $user = User::factory()->admin()->create();

        $this->actingAs($user)->get('/shareholder')->assertStatus(200);
    }
}
