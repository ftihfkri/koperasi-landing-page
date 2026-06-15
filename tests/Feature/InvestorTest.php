<?php

namespace Tests\Feature;

use App\Models\Announcement;
use App\Models\Dividend;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InvestorTest extends TestCase
{
    use RefreshDatabase;

    private User $investor;

    protected function setUp(): void
    {
        parent::setUp();
        $this->investor = User::factory()->investor()->create();
    }

    public function test_investor_dashboard_page_loads(): void
    {
        $this->actingAs($this->investor)->get('/shareholder')->assertStatus(200);
    }

    public function test_dashboard_data_returns_json_with_required_keys(): void
    {
        Transaction::factory()->investment()->create(['user_id' => $this->investor->id]);

        $response = $this->actingAs($this->investor)
                         ->getJson('/shareholder/dashboard-data');

        $response->assertStatus(200)
                 ->assertJsonStructure(['profile', 'summary', 'chartData', 'transactions', 'announcements']);
    }

    public function test_dashboard_data_summary_contains_financial_fields(): void
    {
        $response = $this->actingAs($this->investor)->getJson('/shareholder/dashboard-data');

        $response->assertJsonStructure([
            'summary' => ['currentAccount', 'totalInvested', 'totalDividend', 'tabungKomitmen'],
        ]);
    }

    public function test_investor_can_download_member_statement(): void
    {
        Transaction::factory()->count(3)->create(['user_id' => $this->investor->id]);

        $response = $this->actingAs($this->investor)->get('/shareholder/statement/download');

        $response->assertStatus(200)
                 ->assertHeader('Content-Type', 'text/csv; charset=UTF-8');
    }

    public function test_statement_csv_contains_correct_headers(): void
    {
        $response = $this->actingAs($this->investor)->get('/shareholder/statement/download');

        $this->assertStringContainsString('Date,Type,Amount,Description', $response->streamedContent());
    }

    public function test_investor_can_view_announcements_page(): void
    {
        Announcement::factory()->count(2)->create();

        $this->actingAs($this->investor)->get('/shareholder/announcements')->assertStatus(200);
    }

    public function test_investor_can_view_membership_card_page(): void
    {
        $this->actingAs($this->investor)->get('/shareholder/shareholding-card')->assertStatus(200);
    }

    public function test_investor_can_view_certificate_page(): void
    {
        $this->actingAs($this->investor)->get('/shareholder/certificate')->assertStatus(200);
    }
}
