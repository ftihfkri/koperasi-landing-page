<?php

namespace Tests\Feature;

use App\Models\AgmAttendance;
use App\Models\AgmMeeting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AgmTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private User $investor;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin    = User::factory()->admin()->create();
        $this->investor = User::factory()->investor()->create();
    }

    public function test_admin_can_list_agm_meetings(): void
    {
        AgmMeeting::factory()->count(2)->create(['created_by' => $this->admin->id]);

        $this->actingAs($this->admin)
             ->getJson('/admin/agm/list')
             ->assertStatus(200)
             ->assertJsonStructure(['meetings']);
    }

    public function test_admin_can_create_agm_meeting(): void
    {
        $this->actingAs($this->admin)
             ->postJson('/admin/agm/create', [
                 'title'        => 'AGM 2026',
                 'scheduled_at' => now()->addMonth()->format('Y-m-d H:i:s'),
                 'location'     => 'Tawau HQ',
             ])
             ->assertStatus(200);

        $this->assertDatabaseHas('agm_meetings', ['title' => 'AGM 2026']);
    }

    public function test_created_meeting_has_unique_qr_token(): void
    {
        $this->actingAs($this->admin)
             ->postJson('/admin/agm/create', [
                 'title'        => 'AGM Token Test',
                 'scheduled_at' => now()->addMonth()->format('Y-m-d H:i:s'),
             ]);

        $meeting = AgmMeeting::where('title', 'AGM Token Test')->first();
        $this->assertNotNull($meeting->qr_token);
        $this->assertEquals(32, strlen($meeting->qr_token));
    }

    public function test_logged_in_user_can_scan_valid_agm_token(): void
    {
        $meeting = AgmMeeting::factory()->create(['created_by' => $this->admin->id]);

        $this->actingAs($this->investor)
             ->get('/attend/' . $meeting->qr_token)
             ->assertStatus(200)
             ->assertViewIs('attendance.confirmed');

        $this->assertDatabaseHas('agm_attendances', [
            'meeting_id' => $meeting->id,
            'user_id'    => $this->investor->id,
        ]);
    }

    public function test_invalid_agm_token_shows_error_view(): void
    {
        $this->actingAs($this->investor)
             ->get('/attend/invalid-token-xyz')
             ->assertStatus(200)
             ->assertViewIs('attendance.invalid');
    }

    public function test_closed_meeting_token_shows_error_view(): void
    {
        $meeting = AgmMeeting::factory()->closed()->create(['created_by' => $this->admin->id]);

        $this->actingAs($this->investor)
             ->get('/attend/' . $meeting->qr_token)
             ->assertViewIs('attendance.invalid');
    }

    public function test_guest_scanning_agm_is_redirected_to_login_with_token_in_session(): void
    {
        $meeting = AgmMeeting::factory()->create(['created_by' => $this->admin->id]);

        $this->get('/attend/' . $meeting->qr_token)
             ->assertRedirect('/login');

        $this->assertEquals($meeting->qr_token, session('agm_pending_token'));
    }

    public function test_double_scan_does_not_create_duplicate_attendance(): void
    {
        $meeting = AgmMeeting::factory()->create(['created_by' => $this->admin->id]);

        $this->actingAs($this->investor)->get('/attend/' . $meeting->qr_token);
        $this->actingAs($this->investor)->get('/attend/' . $meeting->qr_token);

        $this->assertEquals(1, AgmAttendance::where([
            'meeting_id' => $meeting->id,
            'user_id'    => $this->investor->id,
        ])->count());
    }

    public function test_admin_can_view_agm_attendance(): void
    {
        $meeting = AgmMeeting::factory()->create(['created_by' => $this->admin->id]);

        $this->actingAs($this->admin)
             ->getJson('/admin/agm/' . $meeting->id . '/attendance')
             ->assertStatus(200)
             ->assertJsonStructure(['total', 'attendances']);
    }

    public function test_admin_can_toggle_meeting_status(): void
    {
        $meeting = AgmMeeting::factory()->create(['created_by' => $this->admin->id, 'is_active' => true]);

        $this->actingAs($this->admin)
             ->postJson('/admin/agm/' . $meeting->id . '/toggle')
             ->assertStatus(200);

        $this->assertFalse((bool) $meeting->fresh()->is_active);
    }

    public function test_admin_can_delete_agm_meeting(): void
    {
        $meeting = AgmMeeting::factory()->create(['created_by' => $this->admin->id]);

        $this->actingAs($this->admin)
             ->deleteJson('/admin/agm/' . $meeting->id)
             ->assertStatus(200);

        $this->assertDatabaseMissing('agm_meetings', ['id' => $meeting->id]);
    }
}
