<?php

namespace Tests\Feature;

use App\Models\Announcement;
use App\Models\PendingApproval;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private User $investor;
    private User $staff;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin    = User::factory()->admin()->create();
        $this->staff    = User::factory()->staff()->create();
        $this->investor = User::factory()->investor()->create();
    }

    public function test_admin_dashboard_page_loads(): void
    {
        $this->actingAs($this->admin)->get('/admin')->assertStatus(200);
    }

    public function test_admin_dashboard_data_returns_json(): void
    {
        $this->actingAs($this->admin)
             ->getJson('/admin/dashboard-data')
             ->assertStatus(200)
             ->assertJsonStructure(['kpi', 'recent_tx', 'pending_list']);
    }

    public function test_admin_can_approve_pending_item(): void
    {
        $pending = PendingApproval::create([
            'type'           => 'edit_member',
            'submitted_by'   => $this->staff->id,
            'target_user_id' => $this->investor->id,
            'payload'        => ['full_name' => 'New Name'],
            'status'         => 'pending',
        ]);

        $this->actingAs($this->admin)
             ->postJson('/admin/approvals/' . $pending->id . '/approve', ['admin_remarks' => 'ok'])
             ->assertStatus(200);

        $this->assertEquals('approved', $pending->fresh()->status);
        $this->assertEquals('New Name', $this->investor->fresh()->name);
    }

    public function test_admin_can_reject_pending_item(): void
    {
        $pending = PendingApproval::create([
            'type'           => 'edit_member',
            'submitted_by'   => $this->staff->id,
            'target_user_id' => $this->investor->id,
            'payload'        => ['name' => 'Should Not Apply'],
            'status'         => 'pending',
        ]);

        $this->actingAs($this->admin)
             ->postJson('/admin/approvals/' . $pending->id . '/reject', ['admin_remarks' => 'not ok'])
             ->assertStatus(200);

        $this->assertEquals('rejected', $pending->fresh()->status);
        $this->assertNotEquals('Should Not Apply', $this->investor->fresh()->name);
    }

    public function test_admin_can_create_announcement(): void
    {
        $this->actingAs($this->admin)
             ->postJson('/admin/announcements', [
                 'title'        => 'Test Announcement',
                 'content'      => 'This is a test.',
                 'published_at' => now()->format('Y-m-d'),
             ])
             ->assertStatus(200);

        $this->assertDatabaseHas('announcements', ['title' => 'Test Announcement']);
    }

    public function test_admin_can_delete_announcement(): void
    {
        $ann = Announcement::factory()->create(['created_by' => $this->admin->id]);

        $this->actingAs($this->admin)
             ->deleteJson('/admin/announcements/' . $ann->id)
             ->assertStatus(200);

        $this->assertDatabaseMissing('announcements', ['id' => $ann->id]);
    }

    public function test_admin_can_toggle_announcement(): void
    {
        $ann = Announcement::factory()->create(['created_by' => $this->admin->id, 'is_active' => true]);

        $this->actingAs($this->admin)
             ->postJson('/admin/announcements/' . $ann->id . '/toggle')
             ->assertStatus(200);

        $this->assertFalse((bool) $ann->fresh()->is_active);
    }

    public function test_admin_can_change_user_role(): void
    {
        $this->actingAs($this->admin)
             ->postJson('/admin/users/' . $this->investor->id . '/role', ['role' => 'staff'])
             ->assertStatus(200);

        $this->assertEquals('staff', $this->investor->fresh()->role);
    }

    public function test_admin_can_list_users(): void
    {
        $this->actingAs($this->admin)
             ->getJson('/admin/users/list')
             ->assertStatus(200);
    }

    public function test_admin_can_set_dividend(): void
    {
        $this->actingAs($this->admin)
             ->postJson('/admin/dividend/set', [
                 'year'       => 2025,
                 'percentage' => 5.5,
             ])
             ->assertStatus(200);

        $this->assertDatabaseHas('dividends', ['year' => 2025]);
    }
}
