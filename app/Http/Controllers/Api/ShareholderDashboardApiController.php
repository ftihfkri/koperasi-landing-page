<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ShareholderDashboardApiController extends Controller
{
    public function __invoke(Request $request)
    {
        $user = Auth::user();

        $growth = $user->investments()
            ->selectRaw('DATE_FORMAT(investment_date, "%Y-%m") as label, SUM(amount) as total')
            ->groupBy('label')
            ->orderBy('label')
            ->get();

        return response()->json([
            'member' => [
                'id' => $user->id,
                'shareholder_id' => $user->shareholder_id,
                'full_name' => $user->full_name ?? $user->name,
                'email' => $user->email,
                'joined_at' => optional($user->created_at)->toDateString(),
            ],
            'summary' => [
                'total_investment' => (float) $user->investments()->sum('amount'),
                'total_dividend' => (float) $user->dividends()->sum('amount'),
                'membership_months' => $user->created_at ? $user->created_at->diffInMonths(now()) : 0,
            ],
            'growth' => $growth,
            'transactions' => $user->transactions()->latest('transaction_date')->take(15)->get(),
            'dividends' => $user->dividends()->latest('year')->get(),
        ]);
    }
}
