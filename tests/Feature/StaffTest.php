<?php

namespace Tests\Feature;

use App\Models\PendingApproval;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StaffTest extends TestCase
{
    use RefreshDatabase;

    private User $staff;
    private User $investor;

    protected function setUp(): void
    {
        parent::setUp();
        $this->staff    = User::factory()->staff()->create();
        $this->investor = User::factory()->investor()->create();
    }

    public function test_staff_dashboard_page_loads(): void
    {
        $this->actingAs($this->staff)->get('/staff')->assertStatus(200);
    }

    public function test_staff_dashboard_data_returns_json(): void
    {
        $this->actingAs($this->staff)
             ->getJson('/staff/dashboard-data')
             ->assertStatus(200)
             ->assertJsonStructure(['kpi', 'recent_transactions', 'my_pending']);
    }

    public function test_staff_can_search_members(): void
    {
        $response = $this->actingAs($this->staff)
                         ->getJson('/staff/shareholders/search?q=' . urlencode($this->investor->name));

        $response->assertStatus(200)->assertJsonStructure(['data' => [['id', 'name', 'email']]]);
    }

    public function test_staff_can_view_member_details(): void
    {
        $this->actingAs($this->staff)
             ->getJson('/staff/shareholders/' . $this->investor->id)
             ->assertStatus(200)
             ->assertJsonStructure(['profile', 'summary']);
    }

    public function test_staff_can_approve_pending_registration(): void
    {
        $pending = User::factory()->pending()->create();

        $this->actingAs($this->staff)
             ->postJson('/staff/shareholders/' . $pending->id . '/approve')
             ->assertStatus(200);

        $this->assertEquals('active', $pending->fresh()->status);
    }

    public function test_staff_submit_add_transaction_creates_pending_approval(): void
    {
        $this->actingAs($this->staff)
             ->postJson('/staff/submit/add-transaction/' . $this->investor->id, [
                 'type'             => 'deposit',
                 'amount'           => 1000,
                 'transaction_date' => now()->format('Y-m-d'),
                 'description'      => 'Test deposit',
             ])
             ->assertStatus(200);

        $this->assertDatabaseHas('pending_approvals', [
            'type'           => 'add_transaction',
            'submitted_by'   => $this->staff->id,
            'target_user_id' => $this->investor->id,
        ]);
    }

    public function test_staff_submit_edit_member_creates_pending_approval(): void
    {
        $this->actingAs($this->staff)
             ->postJson('/staff/submit/edit-member/' . $this->investor->id, [
                 'name'  => 'Updated Name',
                 'email' => $this->investor->email,
             ])
             ->assertStatus(200);

        $this->assertDatabaseHas('pending_approvals', [
            'type'           => 'edit_member',
            'submitted_by'   => $this->staff->id,
            'target_user_id' => $this->investor->id,
        ]);
    }

    public function test_staff_can_get_transactions_data(): void
    {
        Transaction::factory()->count(3)->create(['user_id' => $this->investor->id]);

        $this->actingAs($this->staff)
             ->getJson('/staff/transactions/data')
             ->assertStatus(200);
    }

    public function test_staff_can_access_agm_page(): void
    {
        $this->actingAs($this->staff)->get('/staff/agm')->assertStatus(200);
    }

    public function test_staff_can_list_agm_meetings(): void
    {
        $this->actingAs($this->staff)
             ->getJson('/admin/agm/list')
             ->assertStatus(200)
             ->assertJsonStructure(['meetings']);
    }
}
