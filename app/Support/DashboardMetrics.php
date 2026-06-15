<?php

namespace App\Support;

use App\Models\Announcement;
use App\Models\Dividend;
use App\Models\Transaction;
use App\Models\User;

class DashboardMetrics
{
    public static function totals(): array
    {
        $latestDividend = Dividend::orderByDesc('year')->first();

        return [
            'members'             => User::where('role', 'shareholder')->count(),
            'approved_members'    => User::where('role', 'shareholder')->where('is_approved', true)->count(),
            'pending_members'     => User::where('role', 'shareholder')->where('is_approved', false)->count(),
            'staff'               => User::where('role', 'staff')->count(),
            'admins'              => User::where('role', 'admin')->count(),
            'total_deposit'       => (float) Transaction::where('type', 'deposit')->sum('amount'),
            'total_dividend'      => (float) Dividend::sum('amount'),
            'transactions'        => Transaction::count(),
            'active_announcements'=> Announcement::where('is_active', true)->count(),
            'latest_rate'         => $latestDividend?->rate,
            'latest_dividend_year'=> $latestDividend?->year,
        ];
    }
}