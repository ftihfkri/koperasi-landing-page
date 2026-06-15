<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use App\Models\User;
use App\Models\AgmMeeting;

class LoadTestAgm extends Command
{
    protected $signature = 'agm:loadtest';
    protected $description = 'Simulate 500 concurrent AGM attendances (250 scanned, 250 manual) in one burst to test if the system crashes.';

    public function handle()
    {
        $this->info("--- STARTING KOP-SSB AGM LOAD TEST ---");

        // Clear existing attendances for the test meeting
        $meeting = AgmMeeting::latest()->first();
        \App\Models\AgmAttendance::where('meeting_id', $meeting->id)->delete();
        $this->info("Cleared previous attendances for Meeting ID: {$meeting->id}");

        $members = User::where('email', 'like', 'lt_member%@example.com')->take(500)->get();
        if ($members->count() < 500) {
            $this->error("Only found {$members->count()} members. Expected 500.");
            return;
        }

        $manualMembers = $members->slice(0, 250);
        $scannedMembers = $members->slice(250, 250);

        $baseUrl = rtrim(config('app.url', 'http://localhost'), '/');
        $this->info("Base URL: {$baseUrl}");

        $this->info("Firing 500 CONCURRENT requests (250 Manual via Admin, 250 QR Scans via Members)!!!");
        
        $startTime = microtime(true);

        $responses = Http::pool(function ($pool) use ($baseUrl, $meeting, $manualMembers, $scannedMembers) {
            $requests = [];
            
            // 250 Manual Attendances
            foreach ($manualMembers as $member) {
                $requests[] = $pool->post("{$baseUrl}/test/manual-attend/{$meeting->id}", [
                                       'user_id' => $member->id
                                   ]);
            }
            
            // 250 QR Scans
            foreach ($scannedMembers as $member) {
                $requests[] = $pool->get("{$baseUrl}/attend/{$meeting->qr_token}?test_user_id={$member->id}");
            }
            
            return $requests;
        });

        $endTime = microtime(true);
        $duration = number_format($endTime - $startTime, 2);

        $this->info("Requests completed in {$duration} seconds.");

        $successCount = 0;
        $failCount = 0;
        
        foreach ($responses as $response) {
            if ($response instanceof \Illuminate\Http\Client\Response) {
                if ($response->successful()) {
                    $successCount++;
                } else {
                    $failCount++;
                }
            } else {
                $failCount++;
            }
        }

        $this->info("Results: {$successCount} Succeeded, {$failCount} Failed.");

        // Check DB state
        $attendanceCount = \App\Models\AgmAttendance::where('meeting_id', $meeting->id)->count();
        $this->info("Total attendance recorded in database: {$attendanceCount} / 500");
    }
}
